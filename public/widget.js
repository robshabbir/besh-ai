(function() {
  'use strict';
  
  // Get API key from script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const scriptUrl = new URL(currentScript.src);
  const apiKey = scriptUrl.searchParams.get('key');
  
  if (!apiKey) {
    console.error('Calva Widget: API key is required. Add ?key=YOUR_API_KEY to the script URL.');
    return;
  }
  
  // Session management
  let sessionId = localStorage.getItem('calva_session_id') || null;
  let isOpen = false;
  let messageHistory = [];
  
  // Create widget HTML
  const widgetHTML = `
    <div id="calva-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Chat Bubble -->
      <div id="calva-bubble" style="width: 60px; height: 60px; border-radius: 30px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); box-shadow: 0 4px 20px rgba(0,0,0,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      
      <!-- Chat Window -->
      <div id="calva-window" style="position: absolute; bottom: 80px; right: 0; width: 380px; max-width: calc(100vw - 40px); height: 600px; max-height: calc(100vh - 120px); background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); display: none; flex-direction: column; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 16px;">Chat with us</div>
            <div style="font-size: 13px; opacity: 0.9;">We typically reply instantly</div>
          </div>
          <button id="calva-close" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; opacity: 0.8; transition: opacity 0.2s;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <!-- Messages -->
        <div id="calva-messages" style="flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb;">
          <div style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 16px;">
            Start a conversation
          </div>
        </div>
        
        <!-- Input -->
        <div style="padding: 16px; background: white; border-top: 1px solid #e5e7eb;">
          <form id="calva-form" style="display: flex; gap: 8px;">
            <input 
              id="calva-input" 
              type="text" 
              placeholder="Type your message..." 
              style="flex: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              autocomplete="off"
            />
            <button 
              type="submit"
              id="calva-send"
              style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 8px; padding: 12px 20px; cursor: pointer; font-weight: 600; font-size: 14px; transition: opacity 0.2s;"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Inject widget into page
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);
    
    // Get elements
    const bubble = document.getElementById('calva-bubble');
    const window = document.getElementById('calva-window');
    const closeBtn = document.getElementById('calva-close');
    const form = document.getElementById('calva-form');
    const input = document.getElementById('calva-input');
    const messages = document.getElementById('calva-messages');
    const sendBtn = document.getElementById('calva-send');
    
    // Toggle window
    bubble.addEventListener('click', toggleWindow);
    closeBtn.addEventListener('click', toggleWindow);
    
    function toggleWindow() {
      isOpen = !isOpen;
      window.style.display = isOpen ? 'flex' : 'none';
      
      if (isOpen) {
        bubble.style.transform = 'scale(0.9)';
        input.focus();
      } else {
        bubble.style.transform = 'scale(1)';
      }
    }
    
    // Handle message submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const message = input.value.trim();
      if (!message) return;
      
      // Clear input
      input.value = '';
      
      // Add user message
      addMessage(message, 'user');
      
      // Disable input while processing
      input.disabled = true;
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
      
      try {
        // Send to API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: apiKey,
            message: message,
            sessionId: sessionId
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Save session ID
          if (data.sessionId) {
            sessionId = data.sessionId;
            localStorage.setItem('calva_session_id', sessionId);
          }
          
          // Add AI response
          addMessage(data.response, 'assistant');
        } else {
          addMessage('Sorry, I encountered an error. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage('Unable to send message. Please check your connection.', 'error');
      } finally {
        // Re-enable input
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        input.focus();
      }
    });
    
    // Add message to chat
    function addMessage(text, role) {
      const messageEl = document.createElement('div');
      messageEl.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;
      
      const bubble = document.createElement('div');
      bubble.textContent = text;
      bubble.style.cssText = `
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        ${role === 'user' 
          ? 'background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white;' 
          : role === 'error'
          ? 'background: #fee2e2; color: #991b1b;'
          : 'background: white; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'
        }
      `;
      
      messageEl.appendChild(bubble);
      messages.appendChild(messageEl);
      
      // Scroll to bottom
      messages.scrollTop = messages.scrollHeight;
      
      // Store in history
      messageHistory.push({ role, text });
    }
    
    // Input focus styling
    input.addEventListener('focus', function() {
      this.style.borderColor = '#3b82f6';
    });
    
    input.addEventListener('blur', function() {
      this.style.borderColor = '#d1d5db';
    });
    
    // Send button hover
    sendBtn.addEventListener('mouseenter', function() {
      this.style.opacity = '0.9';
    });
    
    sendBtn.addEventListener('mouseleave', function() {
      this.style.opacity = '1';
    });
  });
})();
