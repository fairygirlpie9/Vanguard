
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
         
         // Capture Token Usage if available in chunks
         if (c.usageMetadata?.totalTokenCount) {
             totalTokens = c.usageMetadata.totalTokenCount;
         }

         if (text) {
             fullText += text;
             setMessages(prev => prev.map(msg => 
                msg.timestamp === timestamp ? { ...msg, text: fullText } : msg
             ));
         }
      }

      // Send Metrics after stream completes
      const duration = performance.now() - startTime;
      sendMetric('vanguard.gemini.response_time_ms', duration, ['type:chat']);
      if (totalTokens > 0) {
        sendMetric('vanguard.gemini.tokens_used', totalTokens, ['type:chat']);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '>> SYSTEM ERROR: UPLINK LOST.', isError: true, timestamp: Date.now() }]);
      sendMetric('vanguard.gemini.errors', 1, ['type:chat']);
      sendEvent('Gemini Chat Error', 'Failed to stream response from Advisor AI.', 'error');
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
