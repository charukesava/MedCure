import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../services/api";
import "../styles/DoctorAgent.css";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const QUICK_PROMPTS = [
  "I have a fever and headache",
  "Chest pain and shortness of breath",
  "I feel dizzy and nauseous",
  "Persistent cough for 2 weeks",
  "Stomach pain after eating",
  "Skin rash and itching",
  "High blood pressure symptoms",
  "Diabetes management tips",
];

const WELCOME_MESSAGE = {
  id: "welcome",
  from: "bot",
  text: `Hello! 👋 I'm **Dr. HealthAI**, your personal AI medical consultant.

I'm here to help you understand your symptoms, learn about possible causes, and guide you on the right treatment path.

You can ask me about:
• 🤒 Symptoms & what they could mean
• 🧬 Causes & risk factors of diseases  
• 💊 Treatments, medications & home remedies
• 🥗 Diet & lifestyle advice for conditions
• 🩺 When to see a specialist

*Please describe your symptoms or health concern — I'm here to help!*`,
  time: getTime(),
};

// ──────────────────────────────────────────────
// Markdown-lite renderer
// ──────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = null;
  let key = 0;

  const flushList = () => {
    if (currentList) {
      elements.push(
        <ul key={`ul-${key++}`} className="da-msg-list">
          {currentList}
        </ul>,
      );
      currentList = null;
    }
  };

  const formatInline = (raw) => {
    // Bold **text**
    const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  };

  lines.forEach((line) => {
    // Heading: starts with emoji + **
    if (/^[🔍🧬⚠️💊🥗🩺🏥✅❗]/.test(line) && line.includes("**")) {
      flushList();
      elements.push(
        <p key={key++} className="da-msg-heading">
          {formatInline(line)}
        </p>,
      );
      return;
    }
    // Bullet list
    if (/^(\s*[-•]|\s*\d+\.)/.test(line)) {
      const content = line
        .replace(/^\s*[-•]\s*/, "")
        .replace(/^\s*\d+\.\s*/, "");
      if (!currentList) currentList = [];
      currentList.push(<li key={key++}>{formatInline(content)}</li>);
      return;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={key++} className="da-msg-hr" />);
      return;
    }
    // Empty line
    if (line.trim() === "") {
      flushList();
      elements.push(<br key={key++} />);
      return;
    }
    // Normal paragraph
    flushList();
    elements.push(
      <p key={key++} className="da-msg-para">
        {formatInline(line)}
      </p>,
    );
  });

  flushList();
  return elements;
}

// ──────────────────────────────────────────────
// Message bubble
// ──────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div className={`da-message-row ${isBot ? "da-bot-row" : "da-user-row"}`}>
      {isBot && (
        <div className="da-avatar" aria-label="Dr. HealthAI">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="20" fill="#0D9488" />
            {/* Doctor icon */}
            <circle cx="20" cy="14" r="5" fill="white" />
            <path
              d="M10 32c0-5.523 4.477-10 10-10s10 4.477 10 10"
              fill="white"
            />
            <rect x="17" y="24" width="6" height="2" rx="1" fill="#0D9488" />
            <rect x="19" y="22" width="2" height="6" rx="1" fill="#0D9488" />
          </svg>
        </div>
      )}
      <div
        className={`da-bubble ${isBot ? "da-bubble-bot" : "da-bubble-user"}`}
      >
        {isBot ? (
          <div className="da-bubble-content">{renderMarkdown(msg.text)}</div>
        ) : (
          <p className="da-bubble-content da-user-text">{msg.text}</p>
        )}
        <span className="da-msg-time">{msg.time}</span>
      </div>
      {!isBot && (
        <div className="da-avatar da-user-avatar" aria-label="You">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="20" fill="#2563EB" />
            <circle cx="20" cy="15" r="6" fill="white" />
            <path d="M7 36c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="white" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Typing indicator
// ──────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="da-message-row da-bot-row">
      <div className="da-avatar">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#0D9488" />
          <circle cx="20" cy="14" r="5" fill="white" />
          <path d="M10 32c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="white" />
        </svg>
      </div>
      <div className="da-bubble da-bubble-bot da-typing-bubble">
        <span className="da-dot" />
        <span className="da-dot" />
        <span className="da-dot" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function DoctorAgent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ── History state ────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // Build conversation history for API (last 10 exchanges = 20 turns)
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.id !== "welcome")
      .slice(-20)
      .map((m) => ({
        role: m.from === "user" ? "user" : "model",
        text: m.text,
      }));
  }, []);

  // ── Fetch chat history from backend ──────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistoryError("Please log in to view your history.");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BASE_URL}/api/ai/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load history");
      }
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      setHistoryError(err.message || "Could not load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const openHistory = () => {
    setHistoryOpen(true);
    setExpandedSession(null);
    fetchHistory();
  };

  // ── Load a past session into the main chat ────────────────────
  const loadSession = (session) => {
    const loaded = [];
    for (const turn of session.messages) {
      const d = new Date(turn.timestamp);
      const t = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      loaded.push({
        id: `h-u-${d.getTime()}`,
        from: "user",
        text: turn.userMessage,
        time: t,
      });
      loaded.push({
        id: `h-b-${d.getTime()}`,
        from: "bot",
        text: turn.aiReply,
        time: t,
      });
    }
    setMessages([{ ...WELCOME_MESSAGE, time: getTime() }, ...loaded]);
    setHistoryOpen(false);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isTyping) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      from: "user",
      text: userText,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = buildHistory([...messages, userMsg]);

      const res = await fetch(`${BASE_URL}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          conversationHistory: history.slice(0, -1), // exclude the last user message (sent as 'message')
          userId: user?.uid || "guest",
          sessionId,
        }),
      });

      if (!res.ok) {
        // Still try to read the JSON body — the server sends a user-friendly reply even on errors
        const errData = await res.json().catch(() => ({}));
        const errText =
          errData.reply ||
          (res.status === 429
            ? "⏳ Dr. HealthAI is busy right now (rate limit). Please wait a few seconds and try again."
            : "I'm having trouble responding right now. Please try again.");
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            from: "bot",
            text: errText,
            time: getTime(),
          },
        ]);
        return;
      }
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          from: "bot",
          text: data.reply || "I'm sorry, I couldn't generate a response.",
          time: getTime(),
        },
      ]);
    } catch (err) {
      console.error("Agent error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          from: "bot",
          text: "I'm having trouble connecting right now. Please check your connection and try again.",
          time: getTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ ...WELCOME_MESSAGE, time: getTime() }]);
    setInput("");
  };

  return (
    <div className="da-root">
      {/* ── Header ── */}
      <div className="da-header">
        <div className="da-header-left">
          <div className="da-header-avatar">
            <svg
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="22" cy="22" r="22" fill="#0D9488" />
              <circle cx="22" cy="16" r="6" fill="white" />
              <path
                d="M8 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
                fill="white"
              />
              <rect
                x="19"
                y="26"
                width="6"
                height="2.5"
                rx="1.25"
                fill="#0D9488"
              />
              <rect
                x="20.75"
                y="24"
                width="2.5"
                height="7"
                rx="1.25"
                fill="#0D9488"
              />
            </svg>
            <span className="da-online-dot" />
          </div>
          <div className="da-header-info">
            <h2>Dr. HealthAI</h2>
            <p>AI Medical Consultant • Online</p>
          </div>
        </div>
        <div className="da-header-actions">
          {user && (
            <button
              className="da-history-btn"
              onClick={openHistory}
              title="View chat history"
            >
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path
                  d="M12 8v4l3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.05 11a9 9 0 1 1 .5 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 16v-5h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              History
            </button>
          )}
          <button
            className="da-clear-btn"
            onClick={clearChat}
            title="Clear conversation"
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Clear Chat
          </button>
        </div>
      </div>

      {/* ── History Panel ── */}
      {historyOpen && (
        <div
          className="da-history-overlay"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="da-history-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="da-history-header">
              <div className="da-history-title">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path
                    d="M12 8v4l3 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.05 11a9 9 0 1 1 .5 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 16v-5h5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Chat History</span>
              </div>
              <button
                className="da-history-close"
                onClick={() => setHistoryOpen(false)}
                title="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="da-history-body">
              {historyLoading && (
                <div className="da-history-loading">
                  <div className="da-history-spinner" />
                  <p>Loading history…</p>
                </div>
              )}
              {historyError && (
                <div className="da-history-error">
                  <p>⚠ {historyError}</p>
                  <button onClick={fetchHistory}>Retry</button>
                </div>
              )}
              {!historyLoading && !historyError && historyData.length === 0 && (
                <div className="da-history-empty">
                  <svg viewBox="0 0 64 64" fill="none" width="56" height="56">
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="#d1d5db"
                      strokeWidth="2"
                    />
                    <path
                      d="M22 32h20M32 22v20"
                      stroke="#d1d5db"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p>No chat history yet.</p>
                  <p>Start a conversation with Dr. HealthAI!</p>
                </div>
              )}
              {!historyLoading &&
                !historyError &&
                historyData.map((session) => {
                  const isExpanded = expandedSession === session.sessionId;
                  const date = new Date(session.lastUpdated);
                  const dateStr = date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={session.sessionId}
                      className={`da-session-card ${isExpanded ? "da-session-expanded" : ""}`}
                    >
                      <button
                        className="da-session-summary"
                        onClick={() =>
                          setExpandedSession(
                            isExpanded ? null : session.sessionId,
                          )
                        }
                      >
                        <div className="da-session-meta">
                          <span className="da-session-date">
                            {dateStr} · {timeStr}
                          </span>
                          <span className="da-session-count">
                            {session.messages.length} Q&amp;A
                            {session.messages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="da-session-preview">
                          💬 {session.preview}
                          {session.preview.length >= 80 ? "…" : ""}
                        </p>
                        <svg
                          className={`da-session-chevron ${isExpanded ? "da-chevron-up" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          width="16"
                          height="16"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="da-session-detail">
                          <div className="da-session-messages">
                            {session.messages.map((turn, i) => (
                              <div key={i} className="da-session-turn">
                                <div className="da-session-q">
                                  <span className="da-turn-label da-turn-you">
                                    You
                                  </span>
                                  <p>{turn.userMessage}</p>
                                </div>
                                <div className="da-session-a">
                                  <span className="da-turn-label da-turn-ai">
                                    Dr. HealthAI
                                  </span>
                                  <p>
                                    {turn.aiReply.length > 200
                                      ? turn.aiReply.slice(0, 200) + "…"
                                      : turn.aiReply}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            className="da-load-session-btn"
                            onClick={() => loadSession(session)}
                          >
                            ↩ Load this conversation
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer Banner ── */}
      <div className="da-disclaimer-banner">
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
          <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="2" />
          <path
            d="M12 8v4M12 16h.01"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        &nbsp;Dr. HealthAI provides educational guidance only — not a substitute
        for professional medical diagnosis or treatment.
      </div>

      {/* ── Chat Area ── */}
      <div className="da-chat-area">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Prompts ── */}
      {messages.length <= 1 && (
        <div className="da-quick-prompts">
          <p className="da-quick-label">Common concerns:</p>
          <div className="da-quick-chips">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                className="da-chip"
                onClick={() => sendMessage(p)}
                disabled={isTyping}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="da-input-area">
        <div className="da-input-wrapper">
          <textarea
            ref={textareaRef}
            className="da-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms or ask a health question…"
            rows={1}
            disabled={isTyping}
          />
          <button
            className={`da-send-btn ${isTyping || !input.trim() ? "da-send-disabled" : ""}`}
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path
                d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="da-input-hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
