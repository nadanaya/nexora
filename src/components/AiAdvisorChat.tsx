import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  Scale, 
  ShieldCheck, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ArrowRight,
  HelpCircle,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { UserProfile, RebateReview, FollowUpTask, ChatMessage } from '../types';
import { sendAiChatMessage } from '../services/aiService';

interface AiAdvisorChatProps {
  currentUser: UserProfile;
  reviews: RebateReview[];
  tasks: FollowUpTask[];
  onOpenReviewDetail?: (review: RebateReview) => void;
}

const PRESET_QUESTIONS = [
  {
    category: '특수관계자',
    text: '거래처 A(뷰티넥서스) 특수관계자 장려금 승인 시 위험 요인은?',
  },
  {
    category: '금융사고 방지',
    text: '거래처 B(루미너스) 수취계좌 불일치 해결을 위한 증빙 절차는?',
  },
  {
    category: '직무 분리(SoD)',
    text: '기안자(김영업)와 승인자(이재무)의 SoD 직무 분리 규정 설명해줘',
  },
  {
    category: '한도 통제',
    text: '당월 누적 한도(1억원) 초과 시 영업 소명 가이드라인은?',
  },
  {
    category: '그룹 거버넌스',
    text: 'Aurora 지주사-Corevia-마실커머스-Celtonic 4대 계열사 거래 관계 분석',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    role: 'model',
    text: `안녕하십니까, ${'Corevia Cosmetics'} 법무·감사 및 판매장려금 수석 AI 자문관입니다.

삼일PwC **W07 화장품 제조·유통 거래처 판매장려금 운영 및 내부통제** 기준에 의거하여 실무 자문을 수행합니다.

현재 **진행 심사 5건** 및 **열린 후속 작업 4건**이 시스템에 연동되어 있습니다. 아래 빠른 질의를 선택하시거나, 특수관계자 식별, 계좌 실명 불일치, SoD 직무분리 통제 등에 관해 무엇이든 질의해 주십시오.`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  },
];

export const AiAdvisorChat: React.FC<AiAdvisorChatProps> = ({
  currentUser,
  reviews,
  tasks,
  onOpenReviewDetail,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nexora_ai_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('nexora_ai_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userName: currentUser.name,
      userRole: currentUser.role,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      // Build server payload with multi-turn conversation
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const contextData = {
        currentUserName: currentUser.name,
        currentUserRole: currentUser.role,
        activeReviewsCount: reviews.filter((r) => r.status !== 'APPROVED' && r.status !== 'PAID' && r.status !== 'REJECTED').length,
        openTasksCount: tasks.filter((t) => t.status === 'OPEN').length,
      };

      const result = await sendAiChatMessage(payloadMessages, contextData);

      const aiReplyMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'model',
        text: result.reply,
        timestamp: result.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      setMessages((prev) => [...prev, aiReplyMessage]);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        text: `### [시스템 안내]\n통신 지연으로 인해 내부 W07 규칙 가이드라인을 참조하시기 바랍니다. 직무 분리(SoD) 및 계좌 실명 검증 규정은 즉시 유효합니다.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem('nexora_ai_chat_history');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#070b12] border border-stone-800 rounded-2xl shadow-2xl flex flex-col h-[750px] overflow-hidden">
      {/* Top Docket Header - Sincere Legal Editorial Style */}
      <div className="bg-[#0b101b] border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-900 via-amber-950/40 to-stone-900 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-cinzel font-bold text-stone-100 tracking-wider">
                NEXORA AI 법무·감사 수석 자문관
              </h2>
              <span className="font-editorial text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans">
              Corevia 화장품 B2B 판매장려금 · 특수관계자 식별 · 직무분리(SoD) · 계좌 실명 통제 실시간 자문
            </p>
          </div>
        </div>

        {/* Status context & Reset */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-xs text-stone-400">
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>질의자:</span>
            <span className="text-stone-200 font-semibold">{currentUser.name}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-800 text-amber-300 border border-stone-700 font-mono">
              {currentUser.role}
            </span>
          </div>

          <button
            onClick={handleResetChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-200 border border-stone-800 transition text-xs font-medium cursor-pointer"
            title="대화 기록을 초기화합니다."
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">대화 초기화</span>
          </button>
        </div>
      </div>

      {/* Preset Quick-Prompt Bar */}
      <div className="bg-[#05080f] border-b border-stone-800/80 px-6 py-2.5 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-cinzel text-amber-400/90 whitespace-nowrap flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" />
          핵심 쟁점 질의:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.text)}
            disabled={isLoading}
            className="text-[11px] px-3 py-1 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-500/40 transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span className="text-amber-400/80 font-semibold mr-1">[{q.category}]</span>
            <span>{q.text}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto`}
            >
              {/* Message Header Pill */}
              <div className="flex items-center gap-2 mb-1.5 text-xs text-stone-400">
                {isUser ? (
                  <>
                    <span className="font-mono text-[10px] text-stone-500">{msg.timestamp}</span>
                    <span className="text-stone-300 font-semibold">{msg.userName || currentUser.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700">
                      {msg.userRole || currentUser.role}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <User className="w-3 h-3" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-300">
                      <Bot className="w-3 h-3" />
                    </div>
                    <span className="font-cinzel text-amber-300 font-semibold text-[11px]">
                      NEXORA AI 자문관
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`relative p-5 rounded-2xl max-w-3xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-950/80 to-[#10172a] border border-indigo-500/30 text-stone-100 shadow-lg'
                    : 'bg-[#090e18] border border-stone-800/90 text-stone-200 shadow-xl'
                }`}
              >
                {/* Copy button for model response */}
                {!isUser && (
                  <button
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="absolute top-3.5 right-3.5 text-stone-500 hover:text-amber-300 p-1 rounded hover:bg-stone-800/60 transition cursor-pointer"
                    title="자문 의견 복사"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Formatted Text Content */}
                <div className="space-y-3 font-sans whitespace-pre-wrap selection:bg-amber-500/30">
                  {formatMarkdownContent(msg.text)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-stone-400">
              <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-300 animate-pulse">
                <Bot className="w-3 h-3" />
              </div>
              <span className="font-cinzel text-amber-300 font-semibold text-[11px]">
                NEXORA AI 자문관
              </span>
              <span className="text-stone-500 text-[10px]">규정 및 데이터 검토 중...</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#090e18] border border-amber-500/30 text-stone-300 text-xs flex items-center gap-3 shadow-lg">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-editorial text-amber-200 text-sm">
                W07 내부통제 기준 및 판례를 검토하고 자문 의견서를 작성 중입니다...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area with Champagne Gold Trim */}
      <div className="bg-[#0b101b] border-t border-stone-800 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder="특수관계자 장려금 승인 규정, 수취계좌 불일치 조치 절차, SoD 분리 요건 등을 질의하세요..."
              className="w-full bg-[#05080f] text-stone-100 placeholder-stone-500 text-xs sm:text-sm rounded-xl p-3 border border-stone-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none transition shadow-inner font-sans"
            />
            <div className="absolute right-3 bottom-2.5 text-[10px] text-stone-500 hidden sm:block">
              Enter 전송 · Shift+Enter 줄바꿈
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4 text-stone-950" />
            <span className="font-cinzel tracking-wider">자문 요청</span>
          </button>
        </form>

        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-[11px] text-stone-500 font-sans">
          <span>* 삼일PwC W07 판매장려금 내부통제 기준 및 가상 화장품 그룹 Aurora 거버넌스를 기반으로 자문합니다.</span>
          <span className="hidden md:inline">Gemini 3.8 Flash Engine</span>
        </div>
      </div>
    </div>
  );
};

// Markdown Formatter Helper for Executive Editorial Aesthetic
function formatMarkdownContent(rawText: string): React.ReactNode {
  const lines = rawText.split('\n');

  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="font-editorial text-base sm:text-lg font-bold text-amber-300 mt-2 mb-1 border-b border-amber-500/20 pb-1 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{line.replace('### ', '')}</span>
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="font-cinzel text-base font-bold text-stone-100 mt-2 mb-1 tracking-wide">
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="font-cinzel text-lg font-bold text-amber-400 mt-2 mb-1 tracking-wide">
          {line.replace('# ', '')}
        </h1>
      );
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      return (
        <div key={idx} className="flex items-start gap-2 pl-2 my-0.5 text-stone-300">
          <span className="text-amber-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
          <span>{renderFormattedInline(content)}</span>
        </div>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const number = line.match(/^(\d+)\.\s/)?.[1];
      const content = line.replace(/^\d+\.\s/, '');
      return (
        <div key={idx} className="flex items-start gap-2 pl-2 my-0.5 text-stone-300">
          <span className="font-mono text-amber-300 text-xs font-bold mt-0.5 shrink-0">
            {number}.
          </span>
          <span>{renderFormattedInline(content)}</span>
        </div>
      );
    }

    // Empty lines
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }

    // Standard paragraph
    return (
      <p key={idx} className="text-stone-300">
        {renderFormattedInline(line)}
      </p>
    );
  });
}

function renderFormattedInline(text: string): React.ReactNode {
  // Bold formatting **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      // Give emphasis to key tags
      if (boldText.includes('CRITICAL') || boldText.includes('차단') || boldText.includes('위반')) {
        return <strong key={i} className="font-bold text-rose-400 bg-rose-950/40 px-1 py-0.2 rounded border border-rose-500/30">{boldText}</strong>;
      }
      if (boldText.includes('적합') || boldText.includes('완료') || boldText.includes('승인')) {
        return <strong key={i} className="font-bold text-emerald-300">{boldText}</strong>;
      }
      if (boldText.includes('주의') || boldText.includes('보완') || boldText.includes('소명')) {
        return <strong key={i} className="font-bold text-amber-300">{boldText}</strong>;
      }
      return <strong key={i} className="font-bold text-stone-100">{boldText}</strong>;
    }
    return part;
  });
}
