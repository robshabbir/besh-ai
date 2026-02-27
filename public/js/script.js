// ===== MOBILE NAVIGATION =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offset = 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Trigger stat counters when problem section becomes visible
            if (entry.target.id === 'problem') {
                animateStats();
            }
        }
    });
}, observerOptions);

// Observe all sections except hero and social proof (they're visible immediately)
document.querySelectorAll('section').forEach(section => {
    if (!section.classList.contains('visible-immediately')) {
        observer.observe(section);
    }
});

// ===== DEMO WIDGET ANIMATION =====
const demoMessages = [
    {
        type: 'ai',
        avatar: '🤖',
        text: 'Thank you for calling Besh Medical Center. This is your AI receptionist. How may I help you today?',
        time: '2:34 PM'
    },
    {
        type: 'customer',
        avatar: '👤',
        text: 'Hi, I need to schedule an appointment with Dr. Mitchell.',
        time: '2:34 PM'
    },
    {
        type: 'ai',
        avatar: '🤖',
        text: 'I\'d be happy to help you schedule an appointment with Dr. Mitchell. May I have your name, please?',
        time: '2:35 PM'
    },
    {
        type: 'customer',
        avatar: '👤',
        text: 'Sarah Johnson',
        time: '2:35 PM'
    },
    {
        type: 'ai',
        avatar: '🤖',
        text: 'Thank you, Sarah. Dr. Mitchell has availability this Thursday at 2:00 PM or Friday at 10:30 AM. Which works better for you?',
        time: '2:35 PM'
    },
    {
        type: 'customer',
        avatar: '👤',
        text: 'Thursday at 2 PM would be perfect.',
        time: '2:36 PM'
    },
    {
        type: 'ai',
        avatar: '🤖',
        text: 'Perfect! I\'ve booked you for Thursday, January 18th at 2:00 PM with Dr. Mitchell. You\'ll receive a confirmation text and email shortly. Is there anything else I can help you with?',
        time: '2:36 PM'
    },
    {
        type: 'customer',
        avatar: '👤',
        text: 'No, that\'s all. Thank you!',
        time: '2:36 PM'
    },
    {
        type: 'ai',
        avatar: '🤖',
        text: 'You\'re welcome, Sarah! We look forward to seeing you on Thursday. Have a great day!',
        time: '2:37 PM'
    }
];

const demoMessagesContainer = document.getElementById('demoMessages');
const demoTyping = document.getElementById('demoTyping');
let currentMessageIndex = 0;

function addDemoMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `demo-message ${message.type}`;
    messageEl.innerHTML = `
        <div class="message-avatar">${message.avatar}</div>
        <div>
            <div class="message-bubble">${message.text}</div>
            <div class="message-time">${message.time}</div>
        </div>
    `;
    demoMessagesContainer.appendChild(messageEl);
    demoMessagesContainer.scrollTop = demoMessagesContainer.scrollHeight;
}

function showTypingIndicator() {
    if (demoTyping) {
        demoTyping.style.display = 'block';
        demoMessagesContainer.scrollTop = demoMessagesContainer.scrollHeight;
    }
}

function hideTypingIndicator() {
    if (demoTyping) {
        demoTyping.style.display = 'none';
    }
}

function playDemoConversation() {
    if (currentMessageIndex >= demoMessages.length) {
        // Reset and start over
        setTimeout(() => {
            demoMessagesContainer.innerHTML = '';
            currentMessageIndex = 0;
            playDemoConversation();
        }, 3000);
        return;
    }

    const message = demoMessages[currentMessageIndex];
    const isAI = message.type === 'ai';
    
    // Show typing for AI messages
    if (isAI) {
        showTypingIndicator();
    }
    
    setTimeout(() => {
        hideTypingIndicator();
        addDemoMessage(message);
        currentMessageIndex++;
        
        // Wait before next message (customer messages faster)
        const delay = isAI ? 2000 : 1500;
        setTimeout(playDemoConversation, delay);
    }, isAI ? 1500 : 800);
}

// Start demo animation after a brief delay
setTimeout(playDemoConversation, 1000);

// ===== STAT COUNTER ANIMATION =====
let statsAnimated = false;

function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;

    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// ===== INDUSTRY CONVERSATION =====
const industryData = {
    medical: {
        title: '🏥 Medical Practice',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Thank you for calling Riverside Medical Center. How may I help you today?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I need to schedule a checkup.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'I\'d be happy to help. Are you an existing patient or would this be your first visit?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I\'m an existing patient.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Great! We have availability next Tuesday at 9:00 AM or Wednesday at 2:30 PM. Which works for you?', time: 'Now' }
        ]
    },
    law: {
        title: '⚖️ Law Firm',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Thank you for calling Martinez & Associates Law Firm. How can I assist you?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I need to speak with an attorney about a contract dispute.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'I understand. Attorney Martinez specializes in contract law. May I have your name and phone number to schedule a consultation?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'Sure, it\'s John Smith, 555-0123.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Thank you, John. I\'ve scheduled a 30-minute consultation for tomorrow at 3:00 PM. You\'ll receive a confirmation email shortly.', time: 'Now' }
        ]
    },
    auto: {
        title: '🚗 Auto Repair Shop',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Mike\'s Auto Repair, how can I help you?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'My check engine light is on. Can I bring my car in today?', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Absolutely! What type of vehicle do you have?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'It\'s a 2019 Honda Civic.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Perfect. We can see you today at 4:00 PM for a diagnostic. Does that work?', time: 'Now' }
        ]
    },
    plumbing: {
        title: '🔧 Plumbing Service',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Peterson Plumbing Solutions, this is your AI receptionist. What\'s the nature of your plumbing issue?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I have a leaking pipe under my kitchen sink.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'I can help with that. Is this an emergency or can it wait for a scheduled appointment?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'It\'s not an emergency, but I\'d like someone soon.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'We have a plumber available tomorrow morning at 10:00 AM. I\'ll text you the confirmation and our plumber will call 30 minutes before arrival.', time: 'Now' }
        ]
    },
    restaurant: {
        title: '🍽️ Restaurant',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Thank you for calling Bella Vista Restaurant. How may I help you?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I\'d like to make a reservation for dinner tonight.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Wonderful! How many guests will be joining you?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'Four people, around 7 PM if possible.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Perfect! I have a table for 4 available at 7:00 PM. May I have your name and phone number?', time: 'Now' }
        ]
    },
    salon: {
        title: '💇 Salon & Spa',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Welcome to Serenity Spa. How can I pamper you today?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I\'d like to book a haircut and color.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Excellent choice! Do you have a preferred stylist?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'Yes, Maria if she\'s available.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Maria has availability this Friday at 1:00 PM. The service will take about 2.5 hours. Shall I book that for you?', time: 'Now' }
        ]
    },
    realestate: {
        title: '🏠 Real Estate Agency',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Thank you for calling Premier Realty. Are you looking to buy or sell?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I\'m interested in viewing some homes in the downtown area.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Great! What\'s your budget range and how many bedrooms are you looking for?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'Around $400k, 3 bedrooms.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Perfect. I\'ll connect you with agent Sarah Chen who specializes in that area. She\'ll call you within 2 hours to schedule viewings.', time: 'Now' }
        ]
    },
    veterinary: {
        title: '🐾 Veterinary Clinic',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Happy Paws Veterinary Clinic, how can I help you and your pet today?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'My dog needs his annual checkup and vaccines.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Absolutely! What\'s your dog\'s name and what type of dog is he?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'His name is Max, he\'s a Golden Retriever.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Lovely! We have availability next Monday at 11:00 AM. The checkup and vaccines will take about 30 minutes. Does that work for you?', time: 'Now' }
        ]
    },
    schools: {
        title: '🎓 Private School',
        messages: [
            { type: 'ai', avatar: '🤖', text: 'Thank you for calling Oakwood Academy. How may I assist you?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'I\'d like information about enrolling my daughter for next year.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Wonderful! What grade will she be entering?', time: 'Now' },
            { type: 'customer', avatar: '👤', text: 'She\'ll be starting 6th grade.', time: 'Now' },
            { type: 'ai', avatar: '🤖', text: 'Excellent. I can schedule a campus tour and admissions consultation. We have availability this Thursday at 2:00 PM or next Tuesday at 10:00 AM. Which works better?', time: 'Now' }
        ]
    }
};

const industryCards = document.querySelectorAll('.industry-card');
const industryConversation = document.getElementById('industryConversation');
const conversationTitle = document.getElementById('conversationTitle');
const conversationMessages = document.getElementById('conversationMessages');
const closeConversation = document.getElementById('closeConversation');

industryCards.forEach(card => {
    card.addEventListener('click', () => {
        const industry = card.getAttribute('data-industry');
        const data = industryData[industry];
        
        if (data) {
            conversationTitle.textContent = data.title;
            conversationMessages.innerHTML = '';
            
            data.messages.forEach((message, index) => {
                setTimeout(() => {
                    const messageEl = document.createElement('div');
                    messageEl.className = `demo-message ${message.type}`;
                    messageEl.innerHTML = `
                        <div class="message-avatar">${message.avatar}</div>
                        <div>
                            <div class="message-bubble">${message.text}</div>
                            <div class="message-time">${message.time}</div>
                        </div>
                    `;
                    conversationMessages.appendChild(messageEl);
                    conversationMessages.scrollTop = conversationMessages.scrollHeight;
                }, index * 400);
            });
            
            industryConversation.style.display = 'block';
        }
    });
});

if (closeConversation) {
    closeConversation.addEventListener('click', () => {
        industryConversation.style.display = 'none';
    });
}

// Close conversation when clicking outside
industryConversation?.addEventListener('click', (e) => {
    if (e.target === industryConversation) {
        industryConversation.style.display = 'none';
    }
});

// ===== FAQ ACCORDION =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
    });
});

// ===== ROI CALCULATOR =====
const callsSlider = document.getElementById('callsPerDay');
const jobValueSlider = document.getElementById('jobValue');
const callsValue = document.getElementById('callsValue');
const jobValueDisplay = document.getElementById('jobValueDisplay');
const lostRevenue = document.getElementById('lostRevenue');
const paybackDays = document.getElementById('paybackDays');
const yearlyGain = document.getElementById('yearlyGain');

function calculateROI() {
    const callsPerDay = parseInt(callsSlider.value);
    const avgJobValue = parseInt(jobValueSlider.value);
    
    // Calculations
    const missedCallRate = 0.30; // 30% missed calls (conservative estimate)
    const conversionRate = 0.60; // 60% of answered calls convert
    
    const missedCallsPerDay = callsPerDay * missedCallRate;
    const lostRevenuePerDay = missedCallsPerDay * avgJobValue * conversionRate;
    const lostRevenuePerMonth = lostRevenuePerDay * 30;
    const lostRevenuePerYear = lostRevenuePerDay * 365;
    
    const calvaPrice = 597; // Professional plan
    const payback = Math.ceil(calvaPrice / lostRevenuePerDay);
    
    // Update display
    callsValue.textContent = callsPerDay;
    jobValueDisplay.textContent = avgJobValue.toLocaleString();
    lostRevenue.textContent = '$' + Math.round(lostRevenuePerMonth).toLocaleString();
    paybackDays.textContent = payback;
    yearlyGain.textContent = '$' + Math.round(lostRevenuePerYear).toLocaleString();
}

if (callsSlider && jobValueSlider) {
    callsSlider.addEventListener('input', calculateROI);
    jobValueSlider.addEventListener('input', calculateROI);
    
    // Initial calculation
    calculateROI();
}

// ===== PRICING TOGGLE =====
const billingToggle = document.getElementById('billingToggle');
const priceAmounts = document.querySelectorAll('.amount');

if (billingToggle) {
    billingToggle.addEventListener('change', () => {
        const isAnnual = billingToggle.checked;
        
        priceAmounts.forEach(amount => {
            const monthly = amount.getAttribute('data-monthly');
            const annual = amount.getAttribute('data-annual');
            
            if (isAnnual) {
                amount.textContent = annual;
            } else {
                amount.textContent = monthly;
            }
        });
    });
}

// ===== NAVBAR BACKGROUND ON SCROLL =====
let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.background = 'rgba(10, 10, 26, 0.95)';
        nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.background = 'rgba(10, 10, 26, 0.8)';
        nav.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ===== SCROLL TO TOP ON LOGO CLICK =====
const logo = document.querySelector('.logo');
if (logo) {
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    logo.style.cursor = 'pointer';
}

// ===== PERFORMANCE: LAZY LOAD IMAGES =====
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===== AUDIO PLAYER FUNCTIONALITY =====
const audioTabs = document.querySelectorAll('.audio-tab');
const audioDemoContents = document.querySelectorAll('.audio-demo-content');
let currentAudio = null;

// Tab switching
audioTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const demoType = tab.getAttribute('data-demo');
        
        // Stop current audio if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            const currentBtn = document.querySelector(`.play-pause-btn[data-audio="${currentAudio.id}"]`);
            if (currentBtn) {
                currentBtn.querySelector('.play-icon').style.display = 'block';
                currentBtn.querySelector('.pause-icon').style.display = 'none';
            }
        }
        
        // Update active states
        audioTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        audioDemoContents.forEach(content => {
            if (content.getAttribute('data-demo') === demoType) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    });
});

// Audio player controls
const playPauseBtns = document.querySelectorAll('.play-pause-btn');

playPauseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const audioId = btn.getAttribute('data-audio');
        const audio = document.getElementById(audioId);
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');
        
        if (!audio) return;
        
        // Pause other audios
        document.querySelectorAll('audio').forEach(a => {
            if (a !== audio && !a.paused) {
                a.pause();
                const otherBtn = document.querySelector(`.play-pause-btn[data-audio="${a.id}"]`);
                if (otherBtn) {
                    otherBtn.querySelector('.play-icon').style.display = 'block';
                    otherBtn.querySelector('.pause-icon').style.display = 'none';
                }
            }
        });
        
        if (audio.paused) {
            audio.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            currentAudio = audio;
        } else {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    });
});

// Progress bar and time updates
document.querySelectorAll('audio').forEach(audio => {
    const audioId = audio.id;
    const progressBar = document.querySelector(`.progress-bar[data-audio="${audioId}"]`);
    const progressFilled = progressBar?.querySelector('.progress-filled');
    const container = audio.closest('.audio-player-container');
    const currentTimeEl = container?.querySelector('.current-time');
    const durationEl = container?.querySelector('.duration');
    const transcriptContainer = container?.parentElement.querySelector('.transcript-messages');
    
    // Update duration when metadata loads
    audio.addEventListener('loadedmetadata', () => {
        if (durationEl) {
            durationEl.textContent = formatTime(audio.duration);
        }
    });
    
    // Update progress and current time
    audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progressFilled) {
            progressFilled.style.width = `${percent}%`;
        }
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
        
        // Highlight transcript line
        if (transcriptContainer) {
            const transcriptLines = transcriptContainer.querySelectorAll('.transcript-line');
            transcriptLines.forEach(line => {
                const lineTime = parseFloat(line.getAttribute('data-time'));
                if (audio.currentTime >= lineTime) {
                    transcriptLines.forEach(l => l.classList.remove('active'));
                    line.classList.add('active');
                    
                    // Auto-scroll to active line
                    if (line.classList.contains('active')) {
                        line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        }
    });
    
    // Reset on end
    audio.addEventListener('ended', () => {
        const btn = document.querySelector(`.play-pause-btn[data-audio="${audioId}"]`);
        if (btn) {
            btn.querySelector('.play-icon').style.display = 'block';
            btn.querySelector('.pause-icon').style.display = 'none';
        }
        if (progressFilled) {
            progressFilled.style.width = '0%';
        }
        if (transcriptContainer) {
            transcriptContainer.querySelectorAll('.transcript-line').forEach(l => l.classList.remove('active'));
        }
    });
    
    // Click on progress bar to seek
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });
    }
});

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Add custom industry conversation
industryData.custom = {
    title: '⚙️ Custom Business',
    messages: [
        { type: 'ai', avatar: '🤖', text: 'Thank you for calling. How may I help you today?', time: 'Now' },
        { type: 'customer', avatar: '👤', text: 'I have a question about your services.', time: 'Now' },
        { type: 'ai', avatar: '🤖', text: 'I\'d be happy to help! Besh can be configured for ANY business that receives phone calls. Tell us about your business and we\'ll customize your AI receptionist in minutes.', time: 'Now' },
        { type: 'customer', avatar: '👤', text: 'That sounds perfect. How do I get started?', time: 'Now' },
        { type: 'ai', avatar: '🤖', text: 'Great! I can schedule a quick setup call with our team, or you can start your free trial right now at calva.ai. Which would you prefer?', time: 'Now' }
    ]
};

// ===== CONSOLE EASTER EGG =====
console.log('%c👋 Looking under the hood?', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cWe\'re hiring talented developers! Email us at careers@calva.ai', 'font-size: 14px; color: #3b82f6;');

// ===== ANALYTICS EVENT TRACKING (placeholder for future integration) =====
function trackEvent(eventName, eventData = {}) {
    // This will be connected to your analytics platform (GA, Mixpanel, etc.)
    console.log('Event:', eventName, eventData);
    
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, eventData);
    // }
}

// Track CTA clicks
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('cta_click', {
            location: btn.textContent.trim(),
            url: btn.href || window.location.href
        });
    });
});

// Track phone number clicks
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('phone_click', {
            number: link.href.replace('tel:', '')
        });
    });
});

// Track industry card clicks
industryCards.forEach(card => {
    card.addEventListener('click', () => {
        trackEvent('industry_view', {
            industry: card.getAttribute('data-industry')
        });
    });
});

// Track pricing tier views
const pricingCards = document.querySelectorAll('.pricing-card');
const pricingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const planName = entry.target.querySelector('.plan-name')?.textContent;
            if (planName) {
                trackEvent('pricing_view', { plan: planName });
            }
        }
    });
}, { threshold: 0.5 });

pricingCards.forEach(card => pricingObserver.observe(card));

// ===== ACCESSIBILITY IMPROVEMENTS =====
// Add keyboard navigation for FAQ
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            question.click();
        }
    });
});

// Add focus visible for better keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// ===== FORM HANDLING (if forms are added later) =====
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        trackEvent('form_submit', {
            form_id: form.id || 'unknown',
            ...data
        });
        
        // Handle form submission
        console.log('Form submitted:', data);
    });
});

// ===== PAGE LOAD PERFORMANCE =====
window.addEventListener('load', () => {
    // Track page load time
    const loadTime = performance.now();
    console.log(`Page loaded in ${Math.round(loadTime)}ms`);
    
    trackEvent('page_load', {
        load_time: Math.round(loadTime),
        user_agent: navigator.userAgent
    });
});

// ===== PREVENT LAYOUT SHIFT =====
// Ensure hero is visible immediately
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const socialProof = document.querySelector('.social-proof');
    
    if (hero) hero.classList.add('visible-immediately');
    if (socialProof) socialProof.classList.add('visible-immediately');
});

// ===================================
// Try It Live — Demo Call Trigger
// ===================================
async function triggerDemoCall() {
    const phoneInput = document.getElementById('demoPhone');
    const statusEl = document.getElementById('demoCallStatus');
    const btn = document.getElementById('demoCallBtn');
    
    const phone = phoneInput.value.trim();
    
    if (!phone || phone.replace(/[\s\-\(\)]/g, '').length < 10) {
        statusEl.className = 'demo-call-status error';
        statusEl.textContent = 'Please enter a valid phone number';
        phoneInput.focus();
        return;
    }
    
    // Disable button and show calling state
    btn.disabled = true;
    btn.innerHTML = '📞 Calling...';
    statusEl.className = 'demo-call-status calling';
    statusEl.textContent = '🔄 Connecting you to Besh...';
    
    try {
        const response = await fetch('/api/demo-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            statusEl.className = 'demo-call-status success';
            statusEl.textContent = '✅ Calling you now! Pick up your phone — Besh is ready to talk.';
            btn.innerHTML = '✅ Call Sent!';
            
            // Reset after 30 seconds
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '📞 Call Me Now';
                statusEl.textContent = '';
                statusEl.className = 'demo-call-status';
            }, 30000);
        } else {
            statusEl.className = 'demo-call-status error';
            statusEl.textContent = data.error || 'Something went wrong. Try calling us directly at (929) 755-7288';
            btn.disabled = false;
            btn.innerHTML = '📞 Call Me Now';
        }
    } catch (err) {
        statusEl.className = 'demo-call-status error';
        statusEl.textContent = 'Connection error. Try calling us directly at (929) 755-7288';
        btn.disabled = false;
        btn.innerHTML = '📞 Call Me Now';
    }
}

// Allow Enter key to trigger call
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('demoPhone');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                triggerDemoCall();
            }
        });
        
        // Auto-format phone number
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 0) {
                if (val.length <= 3) {
                    val = '(' + val;
                } else if (val.length <= 6) {
                    val = '(' + val.slice(0, 3) + ') ' + val.slice(3);
                } else {
                    val = '(' + val.slice(0, 3) + ') ' + val.slice(3, 6) + '-' + val.slice(6, 10);
                }
            }
            e.target.value = val;
        });
    }
});
