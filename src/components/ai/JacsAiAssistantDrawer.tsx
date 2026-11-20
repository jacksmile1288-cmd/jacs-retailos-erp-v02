import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  ChevronRight,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import {
  JACS_QUICK_QA_PRESETS,
  QuickQaItem,
  AssistantChatMessage,
  askJacsAssistant,
} from '../../services/jacsAiAssistant';
import { useApp } from '../../context/AppContext';

export interface JacsAiAssistantDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const JacsAiAssistantDrawer: React.FC<JacsAiAssistantDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    theme,
    businessProfile,
    activeTerminal,
    isAiAssistantOpen,
    closeAiAssistant,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : Boolean(isAiAssistantOpen);
  const onClose = propOnClose || closeAiAssistant || (() => {});
  const isLight = theme === 'light';

  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Halo! Saya JacS Assistant, asisten teknis pintar untuk JacS RetailOS ERP & POS. Silakan klik salah satu dari 6 pertanyaan cepat di bawah atau ketik pertanyaan spesifik Anda.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'qa' | 'chat'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendQuestion = async (customText?: string) => {
    const textToSend = (customText || inputQuestion).trim();
    if (!textToSend || isLoading) return;

    const userMsg: AssistantChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) {
      setInputQuestion('');
    }
    setIsLoading(true);

    try {
      const answer = await askJacsAssistant(textToSend, {
        businessName: businessProfile?.name,
        activeSector: businessProfile?.businessType,
        terminalName: activeTerminal?.name || activeTerminal?.id,
      });

      const assistantMsg: AssistantChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AssistantChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Mohon maaf, saat ini terjadi kendala memproses respons. Silakan coba kembali atau pilih salah satu kartu Q&A bantuan cepat.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPresetClick = (preset: QuickQaItem) => {
    setSelectedPresetId((prev) => (prev === preset.id ? null : preset.id));
    handleSendQuestion(preset.question);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Percakapan telah direset. Silakan tanyakan hal lain seputar sistem JacS RetailOS ERP.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setSelectedPresetId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl h-full flex flex-col shadow-2xl transition-all duration-300 border-l ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-[#0f141c] border-slate-800 text-slate-200'
        }`}
        role="dialog"
        aria-label="JacS Smart AI Assistant"
      >
        <header
          className={`px-5 py-4 flex items-center justify-between border-b shrink-0 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#161b22] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-['Plus_Jakarta_Sans'] font-normal text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  JacS Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  SMART HELP
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Panduan Operasional, POS, &amp; Cloud ERP Architect
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              title="Bersihkan Percakapan"
              className={`p-2 rounded-xl border transition cursor-pointer text-slate-400 hover:text-cyan-400 ${
                isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-800 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup Panel Bantuan (Esc)"
              className={`p-2 rounded-xl border transition cursor-pointer text-slate-400 hover:text-rose-400 ${
                isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-800 hover:bg-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className={`px-5 py-2.5 border-b flex items-center justify-between text-xs shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#131922] border-slate-800/80'
        }`}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qa')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6 Q&amp;A Cepat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Obrolan AI
            </button>
          </div>

          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            AI Ready
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {(activeTab === 'all' || activeTab === 'qa') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>6 Kisi-Kisi Q&amp;A Bantuan Cepat</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Klik untuk jawaban ringkas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {JACS_QUICK_QA_PRESETS.map((preset) => {
                  const isExpanded = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`rounded-xl border transition-all text-left flex flex-col justify-between p-3 cursor-pointer ${
                        isExpanded
                          ? isLight
                            ? 'bg-cyan-50/70 border-cyan-400 shadow-sm'
                            : 'bg-cyan-950/30 border-cyan-500/60 shadow-md'
                          : isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-300'
                          : 'bg-[#161b22] hover:bg-[#1c222d] border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => handleQuickPresetClick(preset)}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded uppercase bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {preset.category}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90 text-cyan-500' : ''
                            }`}
                          />
                        </div>
                        <h4 className={`text-xs font-semibold leading-snug ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {preset.question}
                        </h4>
                      </div>

                      {isExpanded ? (
                        <p className={`mt-2 pt-2 border-t text-[11px] leading-relaxed animate-in fade-in ${
                          isLight
                            ? 'border-cyan-200 text-cyan-950 font-medium'
                            : 'border-cyan-800/60 text-cyan-200'
                        }`}>
                          {preset.shortAnswer}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 font-mono">
                          Lihat Solusi →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'chat') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Bot className="w-4 h-4 text-cyan-500" />
                <span>Obrolan Konsultan AI</span>
              </div>

              <div className="space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-wrap leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none'
                            : isLight
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            : 'bg-[#161b22] border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div>{msg.text}</div>
                        <div
                          className={`text-[9px] mt-1 text-right font-mono ${
                            isUser ? 'text-cyan-200/80' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 italic py-1 animate-pulse">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <span>JacS Assistant sedang berpikir dan merumuskan jawaban...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        <footer
          className={`p-4 border-t shrink-0 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#161b22] border-slate-800'
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              id="input-jacs-ai-assistant"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Tanyakan PIN, Kasir POS, Gudang BOM, Cloud..."
              disabled={isLoading}
              className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border transition focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0f141c] border-slate-700 text-white placeholder:text-gray-500'
              }`}
            />
            <button
              type="submit"
              id="btn-send-jacs-ai"
              disabled={isLoading || !inputQuestion.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 text-white transition cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 shrink-0"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
            Didukung oleh Knowledge Base Resmi JacS RetailOS &amp; AI Router Clouvia
          </p>
        </footer>
      </aside>
    </div>
  );
};

export default JacsAiAssistantDrawer;