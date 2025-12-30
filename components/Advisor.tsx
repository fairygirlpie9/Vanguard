
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { createAdvisorChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { sendMetric, sendEvent } from '../services/datadogService';

const Advisor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'VANGUARD AI UPLINK ESTABLISHED.\n\nThis terminal is connected to the Central Intelligence Network (AI). \n\nUse this uplink to query specific survival scenarios, medical triage advice, or resource management strategies not found in the local database.\n\nAWAITING INPUT...', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = createAdvisorChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setLastReasoning(null);

    const startTime = performance.now();

    try {
      const streamResult = await chatSession.current.sendMessageStream({ message: userMsg.text });
      
      let fullText = '';
      const timestamp = Date.now();
      let totalTokens = 0;
      
      setMessages(prev => [...prev, { role: 'model', text: '', timestamp }]);

      for await (const chunk of streamResult) {
         const c = chunk as GenerateContentResponse;
         const text = c.text;
         
         if (c.usageMetadata?.totalTokenCount) {
             totalTokens = c.usageMetadata.totalTokenCount;
         }

         if (text) {
             fullText += text;
             
             // Real-time parsing of the reasoning block to hide it from main chat but store it
             let displayText = fullText;
             const reasoningMatch = fullText.match(/\[TACTICAL_ASSESSMENT\]([\s\S]*?)\[END_ASSESSMENT\]/);
             
             if (reasoningMatch) {
                 setLastReasoning(reasoningMatch[1].trim());
                 displayText = fullText.replace(/\[TACTICAL_ASSESSMENT\][\s\S]*?\[END_ASSESSMENT\]/, '').trim();
             }

             setMessages(prev => prev.map(msg => 
                msg.timestamp === timestamp ? { ...msg, text: displayText } : msg
             ));
         }
      }

      const duration = performance.now() - startTime;
      
      // --- DATADOG REPORTING ---
      
      // 1. Send Metrics
      sendMetric('vanguard.gemini.response_time_ms', duration, ['type:chat']);
      if (totalTokens > 0) {
        sendMetric('vanguard.gemini.tokens_used', totalTokens, ['type:chat']);
      }

      // 2. Send Reasoning Event (The "Visible" part)
      if (lastReasoning) {
          // This puts the reasoning text directly onto the Datadog Dashboard
          sendEvent('AI Reasoning Log', lastReasoning, 'info');
      } else {
          // Fallback if regex didn't catch (e.g. streaming split) - parse final text
          const finalMatch = fullText.match(/\[TACTICAL_ASSESSMENT\]([\s\S]*?)\[END_ASSESSMENT\]/);
          if (finalMatch) {
              const reasoning = finalMatch[1].trim();
              setLastReasoning(reasoning);
              sendEvent('AI Reasoning Log', reasoning, 'info');
          }
      }

      // 3. HACKATHON CRITERIA: "Actionable Item with Context for AI Engineer"
      // Rule: If latency is > 5s OR text contains "uncertain", trigger an Engineering Alert
      if (duration > 5000 || fullText.toLowerCase().includes("i am not sure")) {
          const contextPayload = `
**INCIDENT CONTEXT FOR AI OPS:**
- **Model:** gemini-2.5-flash
- **Latency:** ${duration.toFixed(0)}ms (Threshold: 5000ms)
- **Token Usage:** ${totalTokens}
- **User Query:** "${userMsg.text}"
- **Trigger:** ${duration > 5000 ? 'High Latency' : 'Model Uncertainty'}

**ACTION REQUIRED:**
- Investigate model performance degradation.
- Review prompt complexity in 'services/geminiService.ts'.
          `;
          
          sendEvent('AI Performance Degradation', contextPayload, 'warning');
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '>> SYSTEM ERROR: UPLINK LOST.', isError: true, timestamp: Date.now() }]);
      sendMetric('vanguard.gemini.errors', 1, ['type:chat']);
      
      // Incident Event for Engineer
      sendEvent('AI System Failure', `Exception in Advisor Component.\nContext: Chat Stream interrupted.\nError: ${error}`, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-tech-border relative shadow-[0_0_20px_rgba(0,0,0,0.5)] font-tech">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-primary via-transparent to-tech-primary opacity-50"></div>
      
      <div className="p-4 border-b border-tech-border bg-tech-panel/50 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center space-x-3">
           <div className="w-2 h-2 bg-tech-primary rounded-full animate-pulse"></div>
           <div>
              <h2 className="text-sm font-bold text-tech-primary uppercase tracking-[0.2em] crt-glow">Command Uplink</h2>
              <p className="text-[10px] text-gray-500 font-mono">SECURE CHANNEL // ENCRYPTION: AES-256</p>
           </div>
        </div>
        <div className="text-tech-secondary text-xs font-mono">
            {isTyping ? 'RECEIVING DATA...' : 'IDLE'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/80 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 border ${
              msg.role === 'user' 
                ? 'bg-tech-panel border-gray-700 text-gray-200' 
                : 'bg-black border-tech-primary/30 text-tech-primary shadow-[0_0_10px_rgba(0,255,65,0.05)]'
            }`}>
              {msg.role === 'model' && (
                <div className="text-[10px] font-bold text-tech-primary mb-2 uppercase tracking-widest border-b border-tech-primary/20 pb-1 flex justify-between">
                   <span>VANGUARD AI</span>
                   <span>T-{msg.timestamp}</span>
                </div>
              )}
              {msg.role === 'user' && (
                 <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest border-b border-gray-700 pb-1 text-right">
                    OPERATOR
                 </div>
              )}
              <div className={`text-sm font-mono leading-relaxed whitespace-pre-wrap ${msg.isError ? 'text-tech-alert' : ''}`}>
                 <ReactMarkdown 
                    components={{
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 text-gray-400" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 text-gray-400" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                      a: ({node, ...props}) => <a className="text-tech-secondary underline decoration-dotted" target="_blank" {...props} />
                    }}
                 >
                   {msg.text}
                 </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* TACTICAL REASONING DISPLAY PANEL (Visual Confirmation of what is sent to Datadog) */}
      {lastReasoning && !isTyping && (
          <div className="mx-4 mb-2 border border-tech-secondary/50 bg-black/60 p-3 animate-fade-in">
              <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[10px] font-bold text-tech-secondary uppercase tracking-widest">Tactical Insight (Logged to HQ)</h3>
                  <span className="text-[9px] text-gray-500">EVENT_ID: {Date.now().toString().substring(8)}</span>
              </div>
              <p className="text-xs text-gray-400 font-mono italic leading-tight">
                  "{lastReasoning}"
              </p>
          </div>
      )}

      <div className="p-4 border-t border-tech-border bg-tech-panel">
        <div className="flex space-x-2 relative">
          <span className="absolute left-3 top-3 text-tech-primary font-mono">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder="ENTER COMMAND OR QUERY..."
            className="flex-1 bg-black border border-tech-border p-3 pl-8 text-white focus:border-tech-primary outline-none font-mono text-sm placeholder-gray-700 uppercase"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-tech-border text-tech-primary border border-tech-primary font-bold px-6 py-2 hover:bg-tech-primary hover:text-black uppercase tracking-wider transition-all disabled:opacity-50"
          >
            TX
          </button>
        </div>
      </div>
    </div>
  );
};

export default Advisor;
