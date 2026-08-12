"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";

interface AssistantAnswer {
  answer: string;
  sources: { title: string; slug: string; excerpt: string; relevance: string }[];
  model: string;
}

export function KnowledgeAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("/api/admin/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const data = (await res.json()) as AssistantAnswer;
      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="panel-head">
        <h3><Bot size={16} /> ถาม Knowledge Assistant</h3>
        <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>ถามคำถามจากคลังความรู้ของคุณ</span>
      </div>
      <div className="panel-body">
        <form onSubmit={ask} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="ถามอะไรก็ได้เกี่ยวกับเนื้อหาในคลังความรู้..."
            style={{
              flex: 1,
              height: "44px",
              padding: "0 14px",
              border: "1px solid #dedfe4",
              borderRadius: "10px",
              fontSize: ".82rem",
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={loading || question.trim().length < 3}
            style={{ minHeight: "44px" }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {loading ? "กำลังค้นหา..." : "ถาม"}
          </button>
        </form>

        {error && (
          <div className="admin-notice error" style={{ marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {answer && (
          <div>
            <div style={{
              padding: "16px",
              border: "1px solid #e3e4e8",
              borderRadius: "12px",
              background: "#fafafb",
              marginBottom: "12px",
              fontSize: ".82rem",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
            }}>
              {answer.answer}
            </div>

            {answer.sources.length > 0 && (
              <div>
                <small style={{ color: "var(--muted)", fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase" }}>
                  แหล่งอ้างอิง ({answer.sources.length})
                </small>
                <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
                  {answer.sources.map((source) => (
                    <Link
                      key={source.slug}
                      href={`/knowledge/${source.slug}`}
                      target="_blank"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        border: "1px solid #e3e4e8",
                        borderRadius: "9px",
                        fontSize: ".78rem",
                      }}
                    >
                      <div>
                        <strong>{source.title}</strong>
                        {source.excerpt && (
                          <span style={{ display: "block", color: "var(--muted)", fontSize: ".7rem", marginTop: "2px" }}>
                            {source.excerpt.slice(0, 120)}
                          </span>
                        )}
                      </div>
                      <span style={{ color: "var(--muted)", fontSize: ".65rem" }}>
                        {(Number(source.relevance) * 100).toFixed(0)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: ".65rem" }}>
              🤖 ตอบโดย {answer.model} · คำตอบอ้างอิงจากคลังความรู้เท่านั้น
            </p>
          </div>
        )}

        {!answer && !loading && !error && (
          <div className="empty-state" style={{ padding: "30px" }}>
            <Sparkles size={24} />
            <p style={{ margin: "8px 0 0" }}>
              ถามคำถามเกี่ยวกับเนื้อหาในคลังความรู้ของคุณ
              <br />
              <small style={{ color: "var(--muted)" }}>เช่น &ldquo;SQL JOIN มีกี่แบบ&rdquo; หรือ &ldquo;สรุปเรื่อง Power BI Dashboard&rdquo;</small>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}