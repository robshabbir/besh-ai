// ==================== GLOBAL UTILITIES ====================

// Intersection Observer for fade-up animations
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// Navbar background on scroll
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('border-white/10');
    } else {
      nav.classList.remove('border-white/10');
    }
  });
}

// Industry tabs
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.industry-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.industry-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.industry-panel').forEach(p => p.classList.add('hidden'));
      document.querySelector(`[data-panel="${target}"]`).classList.remove('hidden');
    });
  });
});

// FAQ accordion
window.toggleFaq = function(btn) {
  const answer = btn.nextElementSibling;
  const chevron = btn.querySelector('.faq-chevron');
  const isOpen = !answer.classList.contains('hidden');
  
  // Close all
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.add('hidden'));
  document.querySelectorAll('.faq-chevron').forEach(c => c.style.transform = '');
  
  if (!isOpen) {
    answer.classList.remove('hidden');
    chevron.style.transform = 'rotate(180deg)';
  }
};

// ROI Calculator
window.calcROI = function() {
  const missedEl = document.getElementById('roi-missed');
  const valueEl = document.getElementById('roi-value');
  const rateEl = document.getElementById('roi-rate');
  
  if (!missedEl || !valueEl || !rateEl) return;

  const missed = parseInt(missedEl.value);
  const value = parseInt(valueEl.value);
  const rate = parseInt(rateEl.value);
  
  document.getElementById('roi-missed-val').textContent = missed;
  document.getElementById('roi-value-val').textContent = '$' + value.toLocaleString();
  document.getElementById('roi-rate-val').textContent = rate + '%';
  
  const monthlyLost = Math.round(missed * 4.33 * value * (rate / 100));
  const recovered = monthlyLost - 49;
  
  document.getElementById('roi-lost').textContent = '$' + monthlyLost.toLocaleString();
  document.getElementById('roi-recovered').textContent = '+$' + Math.max(0, recovered).toLocaleString();
};

// Initialize ROI calculator on load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('roi-missed')) {
    window.calcROI();
    // Add listeners to update on change
    ['roi-missed', 'roi-value', 'roi-rate'].forEach(id => {
      document.getElementById(id).addEventListener('input', window.calcROI);
    });
  }
});


// ==================== DEMO WIDGET LOGIC ====================

// Demo conversation state
let demoActive = false;
let demoTimerInterval = null;
let demoSeconds = 0;
let demoWidget = null;
let selectedIndustry = 'plumbing';

// Agent IDs per industry — expand as new ElevenLabs agents are created
const INDUSTRY_AGENTS = {
  plumbing:   'agent_2901khtdsd4temk9vwrrk782q2vw',
  law:        'agent_2901khtdsd4temk9vwrrk782q2vw', // TODO: create dedicated agent
  medical:    'agent_2901khtdsd4temk9vwrrk782q2vw', // TODO: create dedicated agent
  restaurant: 'agent_2901khtdsd4temk9vwrrk782q2vw', // TODO: create dedicated agent
  salon:      'agent_2901khtdsd4temk9vwrrk782q2vw', // TODO: create dedicated agent
  auto:       'agent_2901khtdsd4temk9vwrrk782q2vw', // TODO: create dedicated agent
};

window.endDemoConversation = function() {
  const btn = document.getElementById('demo-start-btn');
  const orb = document.getElementById('demo-orb-container');
  const widgetArea = document.getElementById('elevenlabs-widget-area');
  const transcript = document.getElementById('demo-transcript');
  const statusEl = document.getElementById('demo-connection-status');

  demoActive = false;
  if (demoTimerInterval) clearInterval(demoTimerInterval);
  
  if (btn) {
    btn.innerHTML = '<span class="relative z-10 flex items-center gap-2"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg> Start Conversation</span>';
    btn.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
    btn.style.boxShadow = '0 0 30px rgba(99,102,241,0.3), 0 8px 20px rgba(0,0,0,0.3)';
  }
  
  if (statusEl) {
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span><span class="text-green-400 text-[10px] font-semibold">READY</span>';
  }
  
  if (demoWidget) { demoWidget.remove(); demoWidget = null; }
  if (widgetArea) widgetArea.classList.remove('active');
  if (orb) orb.style.display = '';
  
  if (transcript) {
    transcript.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-center py-8"><div class="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3"><svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg></div><p class="text-sm text-dark-400">Conversation ended</p><p class="text-xs text-dark-600 mt-1">Click Start Conversation to try again</p></div>';
  }
};

window.startDemoConversation = function() {
  if (demoActive) { endDemoConversation(); return; }

  const btn = document.getElementById('demo-start-btn');
  const orb = document.getElementById('demo-orb-container');
  const widgetArea = document.getElementById('elevenlabs-widget-area');
  const emptyState = document.getElementById('demo-empty-state');
  const transcript = document.getElementById('demo-transcript');
  const statusEl = document.getElementById('demo-connection-status');

  demoActive = true;
  demoSeconds = 0;
  if (emptyState) emptyState.style.display = 'none';
  
  if (transcript) {
    transcript.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-center py-8"><div class="flex items-center gap-2 mb-3"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><p class="text-sm text-brand-300 font-medium">Conversation in progress</p><p class="text-xs text-dark-500 mt-1">Speak naturally — the AI is listening and responding via your speakers</p></div>';
  }
  
  if (btn) {
    btn.innerHTML = '<span class="relative z-10 flex items-center gap-2"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"/></svg> End Conversation</span>';
    btn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
    btn.style.boxShadow = '0 0 30px rgba(220,38,38,0.3), 0 8px 20px rgba(0,0,0,0.3)';
  }
  
  if (statusEl) {
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span><span class="text-brand-400 text-[10px] font-semibold">CONNECTED</span>';
  }

  demoTimerInterval = setInterval(() => {
    demoSeconds++;
    const m = Math.floor(demoSeconds / 60);
    const s = demoSeconds % 60;
    const timerDisplay = document.getElementById('demo-timer');
    if (timerDisplay) {
      timerDisplay.textContent = m + ':' + String(s).padStart(2, '0');
    }
  }, 1000);

  // Hide orb, show widget area with loading state
  if (orb) orb.style.display = 'none';
  if (widgetArea) {
    widgetArea.classList.add('active');
    widgetArea.innerHTML = '<div class="widget-loading"><div class="spinner"></div>Connecting to AI agent…</div>';
    
    // Create and insert the ElevenLabs widget with industry-specific agent
    const agentId = INDUSTRY_AGENTS[selectedIndustry] || INDUSTRY_AGENTS.plumbing;
    setTimeout(() => {
      if (!demoActive) return;
      widgetArea.innerHTML = '';
      demoWidget = document.createElement('elevenlabs-convai');
      demoWidget.setAttribute('agent-id', agentId);
      widgetArea.appendChild(demoWidget);
    }, 600);
  }
};

window.animateOrbBars = function() {
  if (!demoActive) return;
  const bars = document.querySelectorAll('#demo-orb-bars > div');
  bars.forEach(bar => {
    const h = 6 + Math.random() * 26;
    bar.style.height = h + 'px';
  });
  requestAnimationFrame(() => setTimeout(animateOrbBars, 100));
};

// Industry selector — updates agent name, tracks selection, handles mid-conversation switching
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.demo-ind-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ind = btn.dataset.industry;
      if (ind === selectedIndustry) return;
      
      document.querySelectorAll('.demo-ind-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIndustry = ind;
      
      const names = { plumbing: 'Anthony · Mike\'s Plumbing', law: 'Lisa · Hart & Associates', medical: 'Amy · Greenfield Medicine', restaurant: 'Maria · Bella Cucina', salon: 'Mia · Luxe Hair Studio', auto: 'Sarah · Ridge Auto' };
      const nameEl = document.getElementById('demo-agent-name');
      if (nameEl) nameEl.textContent = names[ind] || 'AI Agent';
      
      // Show/hide industry note for non-plumbing (only plumbing has a real dedicated agent currently)
      const note = document.getElementById('demo-industry-note');
      if (note) {
        if (ind === 'plumbing') {
          note.classList.remove('visible');
        } else {
          note.classList.add('visible');
        }
      }
      
      // If conversation is active, end it and prompt restart with new industry
      if (demoActive) {
        endDemoConversation();
        const transcript = document.getElementById('demo-transcript');
        if (transcript) {
          transcript.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-center py-8"><div class="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3"><span class="text-lg">' + btn.querySelector('.text-lg').textContent + '</span></div><p class="text-sm text-brand-300 font-medium">Switched to ' + (names[ind] || ind) + '</p><p class="text-xs text-dark-500 mt-1">Click Start Conversation to begin</p></div>';
        }
      }
      
      // Update conversation cards to highlight matching industry
      const industryMap = { plumbing: 'EMERGENCY', law: 'BOOKING', medical: 'BOOKING', restaurant: 'RESERVATION', salon: 'BOOKING', auto: 'EMERGENCY' };
      document.querySelectorAll('#demo-conversation-cards > div').forEach(card => {
        const label = card.querySelector('span')?.textContent || '';
        if (label === industryMap[ind]) {
          card.style.borderColor = 'rgba(99,102,241,0.3)';
          card.style.transform = 'scale(1.02)';
        } else {
          card.style.borderColor = '';
          card.style.transform = '';
        }
      });
    });
  });
});


// ==================== INTERACTIVE PHONE DEMO (HERO) ====================
document.addEventListener('DOMContentLoaded', () => {
  const convo = document.getElementById('hero-conversation');
  const typingEl = document.getElementById('hero-typing');
  const timerEl = document.getElementById('hero-timer');
  const agentNameEl = document.getElementById('hero-agent-name');
  const statusEl = document.getElementById('hero-status');
  const waveform = document.getElementById('hero-waveform');
  if (!convo) return;

  const scenarios = {
    emergency: {
      agent: "Sarah · Mike's Plumbing",
      messages: [
        { role: 'ai', text: "Mike's Plumbing, this is Sarah!" },
        { role: 'caller', text: "Hi, I've got a pipe leaking under my kitchen sink and it's getting pretty bad." },
        { role: 'ai', text: "Oh no, how bad is it? Like is it spraying or more of a slow drip?" },
        { role: 'caller', text: "It's a steady stream, I've got towels down but they're soaking through." },
        { role: 'ai', text: "Yikes, okay. First thing — shut-off valve under the sink, turn it clockwise. What's your address? I'm gonna get someone out to you ASAP." },
        { role: 'caller', text: "432 West 58th Street. Will someone come today?" },
        { role: 'ai', text: "Yep, I'm getting Mike on this right now. What's your name and best number to reach you?" },
        { role: 'caller', text: "It's John, 347-555-0123." },
        { role: 'ai', text: "Got it, John. Mike's heading your way — should be there within the hour. Hang tight!" },
      ],
      tags: ['🚨 Emergency', '📍 Address captured', '📲 Dispatched']
    },
    booking: {
      agent: "Sarah · Mike's Plumbing",
      messages: [
        { role: 'ai', text: "Mike's Plumbing, this is Sarah!" },
        { role: 'caller', text: "Hey, I need to get my water heater looked at. It's making weird noises." },
        { role: 'ai', text: "Oh hmm, like a banging or more of a rumbling?" },
        { role: 'caller', text: "Rumbling, and the water isn't getting as hot as it used to." },
        { role: 'ai', text: "Yeah that sounds like sediment buildup. Pretty common fix actually. Want me to get someone out there to take a look?" },
        { role: 'caller', text: "Sure, how much would that be?" },
        { role: 'ai', text: "Water heater repair's usually two hundred to six hundred depending on what it needs. But we can come take a look first. Does Thursday morning work for you?" },
        { role: 'caller', text: "Thursday works. I'm Maria, 917-555-0456." },
        { role: 'ai', text: "Perfect, Maria. Got you down for Thursday AM. We'll give you a call before we head over. Sound good?" },
      ],
      tags: ['📅 Appointment', '💰 Pricing given', '✅ Booked']
    },
    restaurant: {
      agent: "Laura · Bella Cucina",
      messages: [
        { role: 'ai', text: "Bella Cucina, hi!" },
        { role: 'caller', text: "Hi, I'd like to make a reservation for Saturday. Party of six." },
        { role: 'ai', text: "Saturday, party of six — nice! What time were you thinking?" },
        { role: 'caller', text: "Around 7:30 if you have it." },
        { role: 'ai', text: "Let me check... 7:30 works! We've got a great table for six. Any special occasion?" },
        { role: 'caller', text: "Yeah, it's my wife's birthday actually. Do you do anything special for that?" },
        { role: 'ai', text: "Oh happy birthday to her! Yeah we can do a complimentary dessert with a candle. We can also set up the table with some extra flair if you want." },
        { role: 'caller', text: "That would be amazing. Also, any gluten-free options?" },
        { role: 'ai', text: "Yep! All our pastas can be made GF, and we've got a whole separate menu. Can I get a name for the reservation?" },
      ],
      tags: ['🍽️ Reservation', '🎂 Special request', '✅ Confirmed']
    },
    legal: {
      agent: "Lisa · Hart & Associates",
      messages: [
        { role: 'ai', text: "Hart and Associates, this is Lisa, how can I help?" },
        { role: 'caller', text: "Hi, I was in a car accident last week and I think I need a lawyer." },
        { role: 'ai', text: "Oh I'm sorry to hear that. Are you okay? Were there any injuries?" },
        { role: 'caller', text: "I've got a neck injury and my car is totaled. The other driver ran a red light." },
        { role: 'ai', text: "That's really tough, I'm sorry you're dealing with that. Have you filed a police report?" },
        { role: 'caller', text: "Yeah, I got the report number and everything." },
        { role: 'ai', text: "Good, that's important. So Mr. Hart specializes in exactly this kind of case. He does a free consultation — no obligation. Can I get a name and number so he can call you back today?" },
        { role: 'caller', text: "Sure, it's David Chen, 646-555-0789." },
        { role: 'ai', text: "Got it, David. Mr. Hart will call you this afternoon. Don't talk to any insurance companies before you speak with him, okay?" },
      ],
      tags: ['⚖️ Case intake', '🎯 Qualified', '📅 Consult booked']
    }
  };

  let currentScenario = 'emergency';
  let messageIndex = 0;
  let timerSeconds = 0;
  let timerInterval = null;
  let animationTimeout = null;

  function updateTimer() {
    timerSeconds++;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function addBubble(role, text) {
    const div = document.createElement('div');
    if (role === 'caller') {
      div.className = 'bubble-caller px-3 py-2 max-w-[90%] bubble-animate';
      div.innerHTML = `<p class="text-[10px] text-dark-500 mb-0.5">Caller</p><p class="text-dark-200">${text}</p>`;
    } else {
      div.className = 'bubble-ai px-3 py-2 max-w-[90%] ml-auto bubble-animate';
      div.innerHTML = `<p class="text-[10px] text-brand-300 mb-0.5">Calva AI</p><p class="text-dark-100">${text}</p>`;
    }
    convo.appendChild(div);
    convo.scrollTop = convo.scrollHeight;
  }

  function addTags(tags) {
    const div = document.createElement('div');
    div.className = 'flex flex-wrap gap-1 mt-2 bubble-animate';
    tags.forEach(tag => {
      div.innerHTML += `<span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-500/10 text-brand-300">${tag}</span>`;
    });
    convo.appendChild(div);
    convo.scrollTop = convo.scrollHeight;
  }

  function showTyping() {
    if (typingEl) {
      typingEl.classList.remove('hidden');
      typingEl.classList.add('flex');
    }
    if (waveform) waveform.classList.add('wave-active');
    if (statusEl) statusEl.textContent = 'AI is responding...';
  }

  function hideTyping() {
    if (typingEl) {
      typingEl.classList.add('hidden');
      typingEl.classList.remove('flex');
    }
    if (waveform) waveform.classList.remove('wave-active');
    if (statusEl) statusEl.textContent = 'AI is listening...';
  }

  function playScenario(name) {
    // Reset
    if (animationTimeout) clearTimeout(animationTimeout);
    if (timerInterval) clearInterval(timerInterval);
    if (convo) convo.innerHTML = '';
    hideTyping();
    messageIndex = 0;
    timerSeconds = 0;
    if (timerEl) timerEl.textContent = '0:00';

    currentScenario = name;
    const scenario = scenarios[name];
    if (!scenario) return;

    if (agentNameEl) agentNameEl.textContent = scenario.agent;

    // Update active tab
    document.querySelectorAll('#hero-scenarios .scenario-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.scenario === name);
      if (t.dataset.scenario !== name) t.classList.add('text-dark-500');
      else t.classList.remove('text-dark-500');
    });

    timerInterval = setInterval(updateTimer, 1000);

    function nextMessage() {
      if (messageIndex >= scenario.messages.length) {
        // Show tags at end
        setTimeout(() => addTags(scenario.tags), 500);
        clearInterval(timerInterval);
        // Loop after delay
        setTimeout(() => {
          const scenarioKeys = Object.keys(scenarios);
          const nextIdx = (scenarioKeys.indexOf(name) + 1) % scenarioKeys.length;
          playScenario(scenarioKeys[nextIdx]);
        }, 5000);
        return;
      }

      const msg = scenario.messages[messageIndex];
      messageIndex++;

      if (msg.role === 'ai') {
        // Show typing indicator first
        showTyping();
        const typingDelay = 400 + Math.min(msg.text.length * 15, 1500);
        animationTimeout = setTimeout(() => {
          hideTyping();
          addBubble('ai', msg.text);
          // Next message after reading time
          const readDelay = 800 + Math.min(msg.text.length * 20, 2000);
          animationTimeout = setTimeout(nextMessage, readDelay);
        }, typingDelay);
      } else {
        addBubble('caller', msg.text);
        const readDelay = 600 + Math.min(msg.text.length * 18, 1800);
        animationTimeout = setTimeout(nextMessage, readDelay);
      }
    }

    // Start after brief delay
    animationTimeout = setTimeout(nextMessage, 800);
  }

  // Tab click handlers
  document.querySelectorAll('#hero-scenarios .scenario-tab').forEach(tab => {
    tab.addEventListener('click', () => playScenario(tab.dataset.scenario));
  });

  // Start first scenario
  setTimeout(() => playScenario('emergency'), 1200);
});
