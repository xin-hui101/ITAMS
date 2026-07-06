import { useState, useRef, useEffect } from 'react';
import api from '../../services/authService';
import './ChatWidget.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I am your IT Asset Management assistant. Ask me anything about your assets, maintenance, or warranty status!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post<{ reply: string }>('/chat', {
        message: userMessage,
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.reply,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        className="cw-toggle"
        onClick={() => setOpen(prev => !prev)}
        title="AI Assistant"
      >
        {open
          ? <i className="ti ti-x" />
          : <i className="ti ti-robot" />
        }
      </button>

      {/* Chat window */}
      {open && (
        <div className="cw-window">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-avatar">
                <i className="ti ti-robot" />
              </div>
              <div>
                <div className="cw-title">ITAMS Assistant</div>
                <div className="cw-subtitle">Powered by Gemini</div>
              </div>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)}>
              <i className="ti ti-x" />
            </button>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cw-message cw-message-${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="cw-msg-avatar">
                    <i className="ti ti-robot" />
                  </div>
                )}
                <div className="cw-msg-bubble">
  {msg.role === 'assistant' ? (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="table-wrap">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {msg.content}
    </ReactMarkdown>
  ) : (
    msg.content
  )}
</div>
              </div>
            ))}
            {loading && (
              <div className="cw-message cw-message-assistant">
                <div className="cw-msg-avatar">
                  <i className="ti ti-robot" />
                </div>
                <div className="cw-msg-bubble cw-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="cw-suggestions">
              {[
                'Which assets are expiring soon?',
                'How many pending maintenance?',
                'Show me asset summary',
              ].map(q => (
                <button
                  key={q}
                  className="cw-suggestion"
                  onClick={() => { setInput(q); }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="cw-input-wrap">
            <textarea
              className="cw-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="cw-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <i className="ti ti-send" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}