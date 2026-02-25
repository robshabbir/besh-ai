const express = require('express');
const db = require('../db');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { provisionPhoneNumberForTenant } = require('../services/twilio-provisioning');
const { sendSMS } = require('../services/notifications');
const { loadTemplate } = require('../services/template-loader');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Rate limit checkout creation
router.use('/create-checkout', rateLimit(3, 60000));

const isPlaceholder = (process.env.STRIPE_SECRET_KEY || '').includes('PLACEHOLDER');
const stripe = isPlaceholder ? null : require('stripe')(process.env.STRIPE_SECRET_KEY);

// Pricing tiers (aligned with landing page)
const PRICING = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_test',
    name: 'Starter',
    amount: 4900, // $49/mo in cents
    minutes: 100
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_test',
    name: 'Professional',
    amount: 9900, // $99/mo in cents
    minutes: 300
  },
  business: {
    priceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business_test',
    name: 'Business',
    amount: 19900, // $199/mo in cents
    minutes: 1000
  }
};

/**
 * POST /billing/create-checkout
 * Create a Stripe Checkout session for new subscription
 */
router.post('/create-checkout', async (req, res) => {
  try {
    if (isPlaceholder) {
      return res.json({ skipped: true, message: 'Stripe not configured — payment skipped' });
    }

    const { plan, email, businessName, industry } = req.body;
    
    if (!plan || !PRICING[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    if (!email || !businessName) {
      return res.status(400).json({ error: 'Email and business name required' });
    }
    
    const planConfig = PRICING[plan];
    
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1
        }
      ],
      customer_email: email,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          business_name: businessName,
          industry: industry || 'general',
          plan: plan
        }
      },
      metadata: {
        business_name: businessName,
        industry: industry || 'general',
        plan: plan
      },
      success_url: `${process.env.BASE_URL}/onboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/pricing?canceled=true`,
      allow_promotion_codes: true
    });
    
    logger.info('Checkout session created', { sessionId: session.id, plan, email });
    
    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Checkout creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /billing/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  logger.info('Stripe webhook received', { type: event.type });
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        logger.info('Payment succeeded', { customerId: event.data.object.customer });
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message, type: event.type });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /billing/portal
 * Create a link to Stripe Customer Portal for subscription management
 */
router.get('/portal', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.BASE_URL}/admin/dashboard`
    });
    
    res.json({ url: session.url });
  } catch (error) {
    logger.error('Portal creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * Handle successful checkout - create tenant and provision phone number
 */
async function handleCheckoutCompleted(session) {
  const { business_name, industry, plan } = session.metadata;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const customerEmail = session.customer_details?.email || session.customer_email;
  
  logger.info('Processing checkout completion', { 
    businessName: business_name, 
    customerId, 
    subscriptionId,
    email: customerEmail 
  });
  
  try {
    // Check if tenant already exists for this customer
    const existingTenants = await db.getAllTenants();
    const existing = existingTenants.find(t => 
      t.config?.stripeCustomerId === customerId
    );
    
    if (existing) {
      logger.info('Tenant already exists for customer', { tenantId: existing.id, customerId });
      // Re-activate if was deactivated
      if (!existing.active) {
        await db.updateTenant(existing.id, { active: true });
        logger.info('Tenant re-activated', { tenantId: existing.id });
      }
      return;
    }
    
    // Generate API key
    const apiKey = 'calva_' + crypto.randomBytes(24).toString('hex');
    
    // Load template for industry
    const template = loadTemplate(industry || 'general');
    
    // Create initial config with template
    const config = {
      businessConfig: {
        name: business_name,
        email: customerEmail,
        industry: industry || 'general'
      },
      systemPrompt: template.systemPrompt.replace(/\{businessName\}/g, business_name),
      greeting: template.greeting,
      knowledgeBase: template.knowledgeBase || '',
      businessHours: template.businessHours || {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan: plan,
      languages: ['en'],
      features: {
        bookingEnabled: true,
        smsNotifications: true,
        afterHoursMode: false,
        voicemailEnabled: true,
        transferEnabled: false
      }
    };
    
    // Create tenant in database with placeholder phone number
    const tenantId = await db.createTenant(
      business_name,
      industry || 'general',
      '+1000000000', // Temporary placeholder
      config,
      apiKey
    );
    
    logger.info('Tenant created in database', { 
      tenantId, 
      businessName: business_name,
      customerId
    });
    
    // Provision Twilio phone number
    let phoneNumber = '+1000000000'; // Fallback
    let phoneProvisionError = null;
    
    try {
      const provisionResult = await provisionPhoneNumberForTenant(tenantId);
      phoneNumber = provisionResult.phoneNumber;
      logger.info('Phone number provisioned', { 
        tenantId, 
        phoneNumber: provisionResult.phoneNumber,
        locality: provisionResult.locality,
        region: provisionResult.region
      });
    } catch (provisionError) {
      phoneProvisionError = provisionError.message;
      logger.error('Phone provisioning failed - tenant created but needs manual provisioning', {
        tenantId,
        error: provisionError.message
      });
      // Don't throw - we'll notify support about manual provisioning needed
    }
    
    // Get the base URL for dashboard link
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/admin/dashboard`;
    
    // Send welcome SMS if we have phone provisioned and customer email
    if (phoneNumber !== '+1000000000' && customerEmail) {
      try {
        // Try to extract phone from customer email or use a notification system
        // For now, we'll log this - in production, you'd capture phone during checkout
        const welcomeMessage = `Welcome to Calva! Your AI receptionist is ready at ${phoneNumber}. ` +
          `Dashboard: ${dashboardUrl} | API Key: ${apiKey.substring(0, 20)}... (check your email for full key)`;
        
        logger.info('Welcome notification prepared', { 
          tenantId, 
          phoneNumber,
          message: welcomeMessage.substring(0, 50) + '...'
        });
        
        // TODO: Send actual SMS if we capture customer phone during checkout
        // await sendSMS(customerPhone, welcomeMessage);
        
      } catch (smsError) {
        logger.warn('Welcome SMS failed', { error: smsError.message, tenantId });
      }
    }
    
    // Log success information for email sending (can be picked up by external service)
    logger.info('Tenant provisioning completed', {
      tenantId,
      businessName: business_name,
      phoneNumber,
      apiKey: apiKey.substring(0, 15) + '...',
      dashboardUrl,
      customerEmail,
      plan,
      phoneProvisionError,
      action: 'SEND_WELCOME_EMAIL', // Flag for external email service to pick up
      emailData: {
        to: customerEmail,
        subject: `Welcome to Calva - Your AI Receptionist is Ready!`,
        businessName: business_name,
        phoneNumber,
        dashboardUrl,
        apiKey: apiKey,
        plan: plan.toUpperCase(),
        setupInstructions: phoneProvisionError 
          ? 'We are provisioning your phone number and will email you shortly with details.'
          : `Your AI receptionist is live at ${phoneNumber}. Forward calls or update your business number.`
      }
    });
    
    logger.info('🎉 Tenant onboarding complete', { 
      tenantId, 
      businessName: business_name,
      phoneNumber,
      customerId 
    });
    
  } catch (error) {
    logger.error('Failed to complete tenant onboarding', { 
      error: error.message,
      stack: error.stack,
      customerId 
    });
    throw error;
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const status = subscription.status;
  
  logger.info('Subscription updated', { customerId, status });
  
  try {
    const tenants = await db.getAllTenants();
    const tenant = tenants.find(t => t.config?.stripeCustomerId === customerId);
    
    if (!tenant) {
      logger.warn('No tenant found for subscription update', { customerId });
      return;
    }
    
    // Update tenant status based on subscription status
    const active = ['active', 'trialing'].includes(status);
    
    await db.updateTenant(tenant.id, { active: active ? 1 : 0 });
    
    logger.info('Tenant status updated', { 
      tenantId: tenant.id, 
      active, 
      subscriptionStatus: status 
    });
    
  } catch (error) {
    logger.error('Failed to update tenant subscription', { 
      error: error.message,
      customerId 
    });
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  
  logger.info('Subscription deleted', { customerId });
  
  try {
    const tenants = await db.getAllTenants();
    const tenant = tenants.find(t => t.config?.stripeCustomerId === customerId);
    
    if (!tenant) {
      logger.warn('No tenant found for subscription deletion', { customerId });
      return;
    }
    
    // Deactivate tenant
    await db.updateTenant(tenant.id, { active: false });
    
    logger.info('Tenant deactivated', { tenantId: tenant.id, customerId });
    
  } catch (error) {
    logger.error('Failed to deactivate tenant', { 
      error: error.message,
      customerId 
    });
  }
}

/**
 * Handle payment failure
 */
function buildFailedPaymentSms(tenant, invoice) {
  const businessName = tenant.config?.businessConfig?.name || tenant.name || 'your business';
  const cents = invoice.amount_due ?? invoice.amount_remaining ?? invoice.total ?? 0;
  const amountDue = (Number(cents) / 100).toFixed(2);
  let message = `⚠️ Payment failed for ${businessName}. Amount due: $${amountDue}.`;

  if (invoice.hosted_invoice_url) {
    message += ` Update payment method: ${invoice.hosted_invoice_url}`;
  }

  return message;
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  logger.warn('Payment failed', { customerId, invoiceId: invoice.id });

  try {
    const tenants = await db.getAllTenants();
    const tenant = tenants.find(t => t.config?.stripeCustomerId === customerId);

    if (!tenant) {
      logger.warn('No tenant found for failed payment', { customerId, invoiceId: invoice.id });
      return;
    }

    const ownerPhone = tenant.config?.businessConfig?.ownerPhone;
    const businessPhone = tenant.phone_number;

    if (!ownerPhone || !businessPhone) {
      logger.warn('Skipping failed payment SMS due to missing phone data', {
        tenantId: tenant.id,
        hasOwnerPhone: !!ownerPhone,
        hasBusinessPhone: !!businessPhone
      });
      return;
    }

    const message = buildFailedPaymentSms(tenant, invoice);
    await sendSMS(ownerPhone, businessPhone, message);

    logger.info('Failed payment SMS notification sent', {
      tenantId: tenant.id,
      invoiceId: invoice.id,
      customerId
    });
  } catch (error) {
    logger.error('Failed payment notification failed', {
      error: error.message,
      customerId,
      invoiceId: invoice.id
    });
  }
}

/**
 * GET /billing/status
 * Returns payment/subscription status for the current tenant
 */
router.get('/status', async (req, res) => {
  if (isPlaceholder) {
    return res.json({ status: 'skipped', message: 'Stripe not configured — payment step skipped', paid: true });
  }

  if (!req.session || !req.session.tenantId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tenant = await db.getTenantById(req.session.tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const config = tenant.config || {};
  res.json({
    status: config.stripeSubscriptionId ? 'active' : 'none',
    paid: !!config.stripeSubscriptionId,
    plan: config.plan || null
  });
});

router.__testHooks = {
  handlePaymentFailed,
  buildFailedPaymentSms
};

module.exports = router;
