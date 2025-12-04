import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Bot, User, Hand, BookOpen, ExternalLink, X } from 'lucide-react';
import mermaid from 'mermaid';
import { Message } from '../types';
import { GLOSSARY } from '../constants';

interface MessageBubbleProps {
  message: Message;
}

// Mermaid component for rendering diagrams
const MermaidDiagram = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<boolean>(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    try {
      mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif'
      });
    } catch (e) {
      console.warn("Mermaid init failed", e);
    }

    const renderChart = async () => {
      try {
        // Validate syntax first to prevent Mermaid from injecting error elements into the DOM
        await mermaid.parse(chart);
        
        const { svg } = await mermaid.render(idRef.current, chart);
        setSvg(svg);
        setError(false);
      } catch (err) {
        // Silently fail on error as requested
        setError(true); 
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart]);

  if (error) {
    // User requested to ignore syntax errors and not show them in the UI.
    return null;
  }

  return svg ? (
    <div 
      className="my-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  ) : (
    <div className="my-4 h-12 flex items-center justify-center text-slate-400 text-sm italic">
      Rendering diagram...
    </div>
  );
};

// Component for interactive glossary terms
const ConceptTrigger = ({ term, conceptKey }: { term: React.ReactNode, conceptKey: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const glossaryItem = GLOSSARY[conceptKey];
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
       if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
       }
    }

    if (isOpen) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    }
  }, [isOpen]);


  if (!glossaryItem) {
    return <span className="text-indigo-600 font-medium">{term}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-0.5 font-medium transition-colors rounded px-1 -mx-1
          ${isOpen ? 'bg-indigo-100 text-indigo-800' : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'}
        `}
        title="Click for definition"
      >
        {term}
        <BookOpen size={10} className="opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 md:w-72 bg-white rounded-xl shadow-xl border border-indigo-100 z-50 animate-scale-in text-left">
           {/* Arrow */}
           <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-8 border-transparent border-t-white drop-shadow-sm"></div>
           
           <div className="p-3 bg-indigo-50/50 rounded-t-xl border-b border-indigo-50 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Definition</span>
                <h4 className="text-sm font-bold text-slate-800">{term}</h4>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white/50">
                <X size={14} />
              </button>
           </div>
           
           <div className="p-3">
             <p className="text-xs text-slate-600 leading-relaxed mb-3">
               {glossaryItem.definition}
             </p>
             <a 
               href={glossaryItem.url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-medium rounded-lg transition-all shadow-sm group"
             >
               <FileText size={12} className="text-slate-400 group-hover:text-indigo-500"/>
               {glossaryItem.slideTitle.replace(/Slide \d+ \((.*?)\)/, '$1')}
               <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>
           </div>
        </div>
      )}
    </span>
  );
};

// Simple Icon helper for the popup link
const FileText = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full gap-3 px-4 py-6 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
      
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm z-10
        ${isModel 
          ? 'bg-white border border-indigo-100 text-indigo-600' 
          : 'bg-indigo-600 text-white'
        }
      `}>
        {isModel ? <Bot size={22} /> : <Hand size={20} />}
      </div>
      
      {/* Message Content Wrapper */}
      <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${isModel ? 'items-start' : 'items-end'}`}>
        
        {/* Name Label */}
        <span className={`text-xs font-medium mb-1.5 opacity-60 px-1 ${isModel ? 'text-slate-600' : 'text-indigo-900'}`}>
          {isModel ? 'Formal Methods TA' : 'Student'}
        </span>

        {/* Bubble */}
        <div className={`
          relative px-5 py-4 rounded-2xl shadow-sm text-sm leading-7
          ${isModel 
            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' 
            : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tr-sm'
          }
        `}>
          <div className="prose prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p className={`mb-2 last:mb-0 ${isModel ? 'text-slate-700' : 'text-indigo-900'}`}>{children}</p>,
                ul: ({ children }) => <ul className={`list-disc ml-4 mb-2 ${isModel ? 'text-slate-700' : 'text-indigo-900'}`}>{children}</ul>,
                ol: ({ children }) => <ol className={`list-decimal ml-4 mb-2 ${isModel ? 'text-slate-700' : 'text-indigo-900'}`}>{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 pl-4 italic my-2 ${isModel ? 'border-indigo-200 text-slate-600' : 'border-indigo-300 text-indigo-700'}`}>
                    {children}
                  </blockquote>
                ),
                a: ({ href, children, ...props }) => {
                  if (href?.startsWith('concept:')) {
                    const key = href.split(':')[1];
                    return <ConceptTrigger term={children} conceptKey={key} />;
                  }
                  return (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 hover:underline font-medium break-all"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isMermaid = match && match[1] === 'mermaid';
                  if (isMermaid) return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;

                  const isInline = !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code className={`px-1.5 py-0.5 rounded font-mono text-xs ${isModel ? 'bg-slate-100 text-pink-600' : 'bg-indigo-100 text-pink-600'}`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="rounded-lg overflow-hidden my-3 shadow-sm">
                      <code className="block bg-slate-900 text-slate-50 p-3 text-xs font-mono overflow-x-auto" {...props}>{children}</code>
                    </div>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};