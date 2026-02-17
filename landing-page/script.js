// ===================================
// Calva Landing Page - JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ===================================
    // Mobile Menu Toggle
    // ===================================
    
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const navLinkItems = navLinks.querySelectorAll('a');
        navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }
    
    // ===================================
    // FAQ Accordion
    // ===================================
    
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const answer = this.nextElementSibling;
            
            // Close all other FAQs
            faqQuestions.forEach(q => {
                if (q !== this) {
                    q.setAttribute('aria-expanded', 'false');
                    const a = q.nextElementSibling;
                    if (a) a.style.maxHeight = '0';
                }
            });
            
            // Toggle current FAQ
            if (isExpanded) {
                this.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = '0';
            } else {
                this.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
    
    // ===================================
    // Smooth Scroll Enhancement
    // ===================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#" or "#signup" (modal trigger)
            if (href === '#' || href === '#signup') {
                e.preventDefault();
                if (href === '#signup') {
                    // In production, this would trigger signup flow
                    // For now, scroll to pricing
                    const pricingSection = document.getElementById('pricing');
                    if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===================================
    // Scroll-based Navigation Background
    // ===================================
    
    const nav = document.querySelector('.nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            nav.style.backgroundColor = 'rgba(10, 10, 15, 0.95)';
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        } else {
            nav.style.backgroundColor = 'rgba(10, 10, 15, 0.8)';
            nav.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
    
    // ===================================
    // Intersection Observer for Animations
    // ===================================
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    const animatedElements = document.querySelectorAll(
        '.stat-card, .step-card, .industry-card, .feature-card, ' +
        '.pricing-card, .testimonial-card, .faq-item'
    );
    
    animatedElements.forEach((el, index) => {
        // Initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        
        // Observe
        observer.observe(el);
    });
    
    // ===================================
    // Phone Number Click Tracking (Analytics ready)
    // ===================================
    
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            // In production, send to analytics
            console.log('Phone click tracked:', this.getAttribute('href'));
        });
    });
    
    // ===================================
    // CTA Button Click Tracking (Analytics ready)
    // ===================================
    
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            const buttonLocation = this.closest('section')?.className || 'unknown';
            // In production, send to analytics
            console.log('CTA clicked:', buttonText, 'in', buttonLocation);
        });
    });
    
    // ===================================
    // Form Validation (for future signup form)
    // ===================================
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    
    // Export for potential use
    window.calvaValidation = {
        email: validateEmail,
        phone: validatePhone
    };
    
    // ===================================
    // Pricing Plan Selection Memory
    // ===================================
    
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('click', function() {
            const tier = this.querySelector('.pricing-tier')?.textContent;
            // Store selected plan in localStorage for signup flow
            if (tier) {
                localStorage.setItem('calva_selected_plan', tier);
                console.log('Selected plan:', tier);
            }
        });
    });
    
    // ===================================
    // Load Selected Plan (if redirected back)
    // ===================================
    
    const selectedPlan = localStorage.getItem('calva_selected_plan');
    if (selectedPlan) {
        pricingCards.forEach(card => {
            const tier = card.querySelector('.pricing-tier')?.textContent;
            if (tier === selectedPlan) {
                card.style.borderColor = 'var(--accent-primary)';
                card.style.boxShadow = '0 0 30px var(--accent-glow)';
            }
        });
    }
    
    // ===================================
    // Typing Effect for Hero Title (Optional)
    // ===================================
    
    /*
    // Uncomment to enable typing effect
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        function typeWriter() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        
        setTimeout(typeWriter, 500);
    }
    */
    
    // ===================================
    // Console Easter Egg
    // ===================================
    
    console.log(
        '%c📞 Calva - Every Call, Covered',
        'color: #6366f1; font-size: 24px; font-weight: bold;'
    );
    console.log(
        '%cInterested in working with us? Email: careers@calva.ai',
        'color: #b4b4c8; font-size: 14px;'
    );
});

// ===================================
// Modal Functions (for future use)
// ===================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = '';
}

// Close modal on outside click
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===================================
// Export for potential external use
// ===================================

window.calva = {
    openModal,
    closeModal
};
