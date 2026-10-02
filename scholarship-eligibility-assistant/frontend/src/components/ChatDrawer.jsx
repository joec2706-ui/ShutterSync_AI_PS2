import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function ChatDrawer() {
  const { isChatOpen, setIsChatOpen, profile, results } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **Scholarship Co-Pilot**. Ask me anything about scheme rules, why a decision was made, what documents you need, or how to simulate an outcome!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat({
        message: text,
        history: newHistory,
        profile,
        results
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          mode: res.mode
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, could not process request: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    '🎯 What is my highest impact next action?',
    '❓ Why am I not eligible for OBC Higher Education?',
    '📄 What documents are required for Maharashtra schemes?',
    '🔮 What happens if family income is ₹2,50,000?'
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-navy-900 px-4 py-3 text-white shadow-xl hover:bg-navy-800 transition-all transform hover:scale-105 ${
          isChatOpen ? 'hidden' : 'flex'
        }`}
      >
        <span className="text-lg">💬</span>
        <span className="text-xs font-bold tracking-wide">Scholarship Co-Pilot</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
      </button>

      {/* Slide-over Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-navy-900 p-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700 text-lg">
                  🤖
                </span>
                <div>
                  <h2 className="text-sm font-bold">Scholarship AI Co-Pilot</h2>
                  <p className="text-[11px] text-slate-300">Context-aware rule assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-navy-800 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-navy-800 text-white rounded-br-none shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.mode && (
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {m.mode === 'gemini' ? '✨ Powered by Gemini' : '⚙️ Rule Reasoning Engine'}
                    </span>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-500 w-fit">
                  <span className="flex h-2 w-2 rounded-full bg-navy-800 animate-bounce"></span>
                  <span>Co-Pilot is analyzing rules…</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="border-t border-slate-100 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                Suggested Prompts:
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-navy-50 hover:border-navy-300 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="border-t border-slate-200 bg-white p-3 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about rules, eligibility or simulator…"
                className="input text-xs py-2"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-3 py-2 text-xs font-bold shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
