import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap, Info, BookOpen, X, ExternalLink, FileText, Star } from 'lucide-react';
import { Message } from '../types';
import { sendMessageStream } from '../services/gemini';
import { MessageBubble } from './MessageBubble';
import { COURSE_TITLE, SLIDES } from '../constants';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello. I am the Teaching Assistant for SE-306 Formal Methods. I can assist you with Temporal Logic (LTL, CTL), Model Checking (NuSMV), and Petri Nets.\n\nPlease ask your question, and I will reference the course slides in my response.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: aiMessageId,
        role: 'model',
        content: '',
        timestamp: new Date()
      }
    ]);

    try {
      let fullContent = '';
      await sendMessageStream(
        newMessages.filter(m => m.id !== 'welcome'),
        input,
        (chunk) => {
          fullContent += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'model',
          content: "**Error:** I am unable to access the course material right now. Please check your connection or API configuration.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight hidden sm:block">{COURSE_TITLE}</h1>
            <h1 className="font-bold text-lg text-slate-800 leading-tight sm:hidden">SE-306 Bot</h1>
            <p className="text-indigo-600 text-xs font-medium tracking-wide">Virtual Teaching Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="https://forms.gle/jNHTj3XvKJS8D3Wo8"
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-colors shadow-sm text-sm font-medium"
            title="Rate this TA"
          >
            <Star size={16} className="fill-current opacity-75" />
            <span className="hidden sm:inline">Rate TA</span>
          </a>

          <button 
            onClick={() => setIsResourcesOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors shadow-sm text-sm font-medium"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Slides</span>
          </button>
          
          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Info size={14} />
            <span>Strict Citation Mode</span>
          </div>
        </div>
      </header>

      {/* Slide Resources Modal */}
      {isResourcesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsResourcesOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600"/>
                Course Materials
              </h3>
              <button onClick={() => setIsResourcesOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                {SLIDES.map((slide, index) => (
                  <a 
                    key={index} 
                    href={slide.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl group transition-all duration-200 border border-transparent hover:border-indigo-100"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slide {String(index + 1).padStart(2, '0')}</span>
                         <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-900 leading-tight">
                          {slide.title.replace(/Slide \d+ \((.*?)\)/, '$1').replace(/Slide \d+: (.*)/, '$1')}
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-all" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col pb-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && messages[messages.length - 1].role !== 'model' && (
             <div className="px-4 py-6">
               <div className="flex items-center gap-2 text-slate-400 text-sm ml-14">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
                 <span className="font-medium">Thinking...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl outline-none transition-all text-slate-800 placeholder-slate-400 shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-medium">
              Powered by Gemini 3 Pro Preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};