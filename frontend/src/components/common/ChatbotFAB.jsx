import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const ChatbotFAB = () => {
  const { theme } = useAuth();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your MyComplaintPortal AI Assistant. How can I help you report an issue, check status, or find department contacts today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const quickQuestions = [
    'How to register a complaint?',
    'Track my complaint status',
    'Water Board contact info',
    'Road & Potholes department',
  ];

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = "Thank you for your message. You can register your civic grievance by clicking 'Register Complaint' on the home page.";
      const query = text.toLowerCase();

      if (query.includes('pothole') || query.includes('road')) {
        botReply = "For road or pothole repairs, select 'Public Works Department (PWD)' when filing your complaint. Be sure to upload clear photos and include your 6-digit pincode.";
      } else if (query.includes('water') || query.includes('leak')) {
        botReply = "Water supply issues are routed to the 'Water Supply & Sewerage Board'. Emergency line: 1800-1215-1514.";
      } else if (query.includes('electricity') || query.includes('power')) {
        botReply = "Power outages and transformer issues fall under the 'Electricity Board (EB)'. Average resolution time is under 24 hours.";
      } else if (query.includes('status') || query.includes('track')) {
        botReply = "You can track real-time status of your reported grievances under 'My Complaints' in your citizen dashboard.";
      } else if (query.includes('duplicate') || query.includes('repost')) {
        botReply = "Before posting a new complaint, our Gemini AI automatically checks if an issue has already been reported in your pincode. If a match is found, click 'Repost' to support it!";
      } else if (query.includes('register') || query.includes('how to')) {
        botReply = "To register a grievance, click 'Register Complaint' at the top of the home page. Fill in your address, pincode, description, and upload photo evidence!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99999 }}>
      {/* CHATBOT DRAWER CONTAINER */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '4.25rem',
            right: '0',
            width: '370px',
            maxWidth: 'calc(100vw - 2rem)',
            height: '430px',
            maxHeight: 'calc(100vh - 7rem)',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderRadius: '24px',
            border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', itemsCenter: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', fontFamily: 'serif', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Gemini Civic Bot <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </h4>
                <p style={{ fontSize: '0.65rem', color: '#93c5fd', margin: 0, fontWeight: '600' }}>
                  Online • 24/7 AI Civic Support
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '50%',
              }}
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SCROLLABLE MESSAGES BODY (FULL PREVIOUS CONVERSATION SCROLLING) */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: isDark ? '#090f1d' : '#f8fafc',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  maxWidth: '88%',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: m.sender === 'user' ? '#2563eb' : '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    marginTop: '0.2rem',
                  }}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    lineHeight: '1.45',
                    backgroundColor: m.sender === 'user' ? '#2563eb' : (isDark ? '#1e293b' : '#ffffff'),
                    color: m.sender === 'user' ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                    border: m.sender === 'user' ? 'none' : (isDark ? '1px solid #334155' : '1.5px solid #e2e8f0'),
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    fontWeight: '700',
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      display: 'block',
                      marginTop: '0.35rem',
                      textAlign: m.sender === 'user' ? 'right' : 'left',
                      color: m.sender === 'user' ? '#bfdbfe' : (isDark ? '#94a3b8' : '#64748b'),
                      fontWeight: '600',
                    }}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Quick Suggestion Chips */}
            {messages.length < 5 && (
              <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                  Quick Questions:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#60a5fa' : '#1d4ed8',
                        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', fontStyle: 'italic', color: '#2563eb' }}>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gemini AI is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.75rem',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderTop: isDark ? '1px solid #1e293b' : '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Ask about grievances, status, departments..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#ffffff' : '#0f172a',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                padding: '0.65rem 1rem',
                borderRadius: '9999px',
                outline: 'none',
                fontSize: '0.8rem',
                fontWeight: '700',
                width: '100%',
              }}
            />
            <button
              type="submit"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
              title="Send Message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}

      {/* Floating FAB Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '2.5px solid #ffffff',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        title="Open AI Civic Assistant"
      >
        <Bot className="w-7 h-7 text-blue-400" />
      </button>
    </div>
  );
};
