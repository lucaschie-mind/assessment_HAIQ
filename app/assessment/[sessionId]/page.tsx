"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { CASES } from "@/lib/cases";

interface Message { role: "CANDIDATE" | "AI"; content: string; }

export default function AssessmentPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"briefing" | "chat">("briefing");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [showFinish, setShowFinish] = useState(false);
  const [showFinalField, setShowFinalField] = useState(false);
  const [finalOutput, setFinalOutput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/results/${sessionId}`).then(r => r.json()).then(d => setCaseId(d.session?.caseId)).catch(() => router.push("/"));
  }, [sessionId, router]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (turnCount >= 8) setShowFinish(true); }, [turnCount]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const caseData = caseId ? CASES[caseId] : null;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timerColor = elapsed > 25 * 60 ? "#D85A30" : elapsed > 20 * 60 ? "#EF9F27" : "#9FE1CB";

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    const next: Message[] = [...messages, { role: "CANDIDATE", content: msg }];
    setMessages(next);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message: msg }) });
      const data = await res.json();
      setMessages([...next, { role: "AI", content: data.message }]);
      setTurnCount(data.turnCount);
    } catch { setMessages([...next, { role: "AI", content: "Erro de conexão. Tente novamente." }]); }
    finally { setSending(false); }
  }

  async function handleFinish() {
    if (!finalOutput.trim()) { setShowFinalField(true); return; }
    await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message: `[PLANO FINAL]\n\n${finalOutput}` }) });
    router.push(`/complete/${sessionId}`);
  }

  if (!caseData) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#555" }}>Carregando...</div>;

  if (phase === "briefing") {
    return (
      <main style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", maxWidth: 680, width: "100%", overflow: "hidden" }}>
          <div style={{ background: "#042C53", padding: "2rem", color: "#fff" }}>
            <div style={{ fontSize: 11, color: "#85B7EB", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{caseData.id} · {caseData.domain}</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{caseData.title}</h1>
            <p style={{ fontSize: 14, color: "#9FE1CB", margin: 0 }}>{caseData.subtitle}</p>
          </div>
          <div style={{ padding: "1.5rem 2rem 2rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#185FA5", margin: "0 0 0.75rem" }}>A situação</h2>
            {caseData.briefing.split("\n\n").map((para, i) => <p key={i} style={{ fontSize: 15, color: "#333", lineHeight: 1.7, margin: "0 0 0.75rem" }}>{para}</p>)}
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#185FA5", margin: "1.25rem 0 0.75rem" }}>Sua missão</h2>
            {caseData.mission.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", margin: "0.5rem 0" }}>
                <span style={{ background: "#185FA5", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 15, color: "#333", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
            <div style={{ background: "#E1F5EE", borderLeft: "3px solid #0F6E56", padding: "12px 16px", borderRadius: "0 8px 8px 0", fontSize: 14, color: "#333", lineHeight: 1.6, margin: "1.5rem 0" }}>
              <strong>Como usar este espaço:</strong> A IA pode te ajudar a estruturar o raciocínio e explorar hipóteses. Use-a como parceira — as conclusões são suas.
            </div>
            <button style={{ width: "100%", padding: 14, background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }} onClick={() => setPhase("chat")}>
              Entendi, vamos começar →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ display: "flex", height: "100vh", fontFamily: "system-ui" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#042C53", display: "flex", flexDirection: "column", padding: "1.25rem", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#378ADD", letterSpacing: 2, marginBottom: 4 }}>HAI-Q</div>
          <div style={{ fontSize: 11, color: "#85B7EB", textTransform: "uppercase", letterSpacing: 1 }}>{caseData.id}</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{caseData.title}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: 12, marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: "#85B7EB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Tempo</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: "#85B7EB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Missão</div>
          {caseData.mission.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ background: "#185FA5", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: "#ccc", lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
        {showFinish && (
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
            <p style={{ fontSize: 12, color: "#9FE1CB", lineHeight: 1.5, marginBottom: "0.75rem" }}>Quando pronto, registre seu plano e encerre.</p>
            {!showFinalField ? (
              <button style={{ width: "100%", padding: 10, background: "#0F6E56", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }} onClick={() => setShowFinalField(true)}>
                Encerrar e registrar plano →
              </button>
            ) : (
              <>
                <textarea style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box", minHeight: 100 }} placeholder="Escreva aqui sua hipótese de diagnóstico e perspectiva final..." value={finalOutput} onChange={e => setFinalOutput(e.target.value)} />
                <button style={{ width: "100%", padding: 10, background: finalOutput.trim() ? "#185FA5" : "#555", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: finalOutput.trim() ? "pointer" : "not-allowed", marginTop: 8 }} onClick={handleFinish} disabled={!finalOutput.trim()}>
                  Enviar e concluir →
                </button>
              </>
            )}
          </div>
        )}
      </aside>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", border: "1px solid #e0e7ef" }}>
              <p style={{ fontSize: 15, color: "#555", lineHeight: 1.6, margin: 0 }}>Olá! Estou aqui para te ajudar a explorar esse desafio. Por onde você quer começar?</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ maxWidth: "80%", borderRadius: 12, padding: "12px 16px", ...(msg.role === "CANDIDATE" ? { background: "#185FA5", color: "#fff", alignSelf: "flex-end" } : { background: "#fff", color: "#222", alignSelf: "flex-start", border: "1px solid #e0e7ef" }) }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>{msg.role === "CANDIDATE" ? "Você" : "IA"}</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</div>
            </div>
          ))}
          {sending && (
            <div style={{ maxWidth: "80%", borderRadius: 12, padding: "12px 16px", background: "#fff", border: "1px solid #e0e7ef", alignSelf: "flex-start" }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.7, textTransform: "uppercase" }}>IA</div>
              <div style={{ fontSize: 15, color: "#888" }}>Pensando...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ background: "#fff", borderTop: "1px solid #e0e7ef", padding: "1rem 1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <textarea style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, resize: "none", fontFamily: "system-ui", outline: "none" }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Digite sua mensagem... (Enter envia, Shift+Enter nova linha)" rows={3} disabled={sending} />
          <button style={{ padding: "10px 20px", background: sending || !input.trim() ? "#93b8d8" : "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: sending || !input.trim() ? "not-allowed" : "pointer", fontSize: 15, whiteSpace: "nowrap" }} onClick={sendMessage} disabled={sending || !input.trim()}>
            Enviar
          </button>
        </div>
      </div>
    </main>
  );
}
