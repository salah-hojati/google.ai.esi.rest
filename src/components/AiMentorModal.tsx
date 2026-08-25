import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Code2, 
  BookOpen, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface AiMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialTopic?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isFallback?: boolean;
}

export const AiMentorModal: React.FC<AiMentorModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  initialTopic
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **Java EE & Jersey (JAX-RS) AI Architect and Tutor**.

Ask me anything about:
- RESTful Resource endpoints, HTTP verbs, and parameter injection (\`@PathParam\`, \`@QueryParam\`, \`@BeanParam\`)
- Filters lifecycle (\`@PreMatching\`, \`ContainerRequestFilter\`, \`ContainerResponseFilter\`, \`@NameBinding\`, \`DynamicFeature\`)
- Interceptors (\`ReaderInterceptor\`, \`WriterInterceptor\`, entity stream manipulation)
- Jersey Client API (\`ClientBuilder\`, \`WebTarget\`, async callbacks, RxClient)
- Exception Mappers and Jakarta Bean Validation`
    }
  ]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setPrompt(`Explain the concept and best practices of "${initialTopic}" in Java EE / Jakarta EE Jersey.`);
    }
  }, [initialTopic, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userPromptText?: string) => {
    const textToSend = userPromptText || prompt;
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: textToSend }
    ];
    setMessages(newMessages);
    setPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          code: initialCode,
          topic: initialTopic
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.answer, isFallback: data.isFallback }
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `**Error**: ${data.error || 'Failed to get answer. Please check your network or try again.'}`
          }
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `### Jersey / JAX-RS Architecture Reference:

1. **Filters & Interceptors:** In Jersey, \`ContainerRequestFilter\` handles Pre-Matching / Post-Matching routing and auth, while \`ReaderInterceptor\` and \`WriterInterceptor\` wrap the low-level byte serialization stream.
2. **Client API:** Use \`ClientBuilder.newClient().target(uri).path(...).request().get()\` for clean, thread-safe REST consumption.

*(To enable live interactive AI queries, attach your Gemini API key in AI Studio Secrets)*`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    'How does @PreMatching differ from regular ContainerRequestFilter?',
    'Show an example of a custom @NameBinding @Secured annotation filter',
    'How do I implement a non-blocking @Suspended AsyncResponse?',
    'What is the best way to reuse Jersey Client instances?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl h-[620px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-100">Jersey REST AI Mentor & Code Tutor</h3>
              <p className="text-[11px] text-stone-400">Powered by Gemini for Java EE & Jakarta REST mastery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs scrollbar-thin scrollbar-thumb-stone-700">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </span>
              )}

              <div
                className={`p-4 rounded-xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-stone-950 font-medium'
                    : 'bg-stone-950 border border-stone-800 text-stone-200 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-800/80 text-[10px] text-stone-500">
                    <span>Jersey AI Assistant</span>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="hover:text-stone-300 flex items-center space-x-1"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <span className="p-1.5 rounded-lg bg-stone-800 text-stone-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-stone-400 text-xs p-3">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing Jersey code and preparing architectural explanation...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-5 py-2 bg-stone-950/60 border-t border-stone-800/80 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {quickPrompts.map((qp, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSend(qp)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-800 text-stone-300 border border-stone-700/60 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about @PreMatching, ContainerRequestFilter, WebTarget..."
            className="flex-1 bg-stone-900 text-stone-100 text-xs px-4 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || loading}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
