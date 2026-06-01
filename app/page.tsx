"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/assessment/${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar.");
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", maxWidth: 520, width: "100%", overflow: "hidden" }}>
        <div style={{ background: "#042C53", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: "#378ADD", letterSpacing: 3 }}>HAI-Q</div>
          <div style={{ fontSize: 14, color: "#85B7EB", marginTop: 4 }}>Human–AI Intelligence Quotient</div>
        </div>
        <div style={{ padding: "1.5rem 2rem" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#042C53", margin: "0 0 0.5rem" }}>Assessment de Colaboração com IA</h1>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            Você vai interagir com uma IA para resolver um desafio organizacional real. Não existe resposta certa — o que importa é como você pensa e colabora.
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {["⏱ ~30 minutos", "💬 Chat com IA", "📋 Problema aberto"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#555" }}>{t}</span>
            ))}
          </div>
          <form onSubmit={handleStart}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>Nome completo</label>
              <input style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required disabled={loading} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>E-mail</label>
              <input style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
            </div>
            {error && <p style={{ color: "#D85A30", fontSize: 14, marginBottom: "0.75rem" }}>{error}</p>}
            <button style={{ width: "100%", padding: 13, background: loading ? "#93b8d8" : "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }} type="submit" disabled={loading}>
              {loading ? "Iniciando..." : "Começar o assessment →"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 12, color: "#888", marginTop: "1rem" }}>Sua interação será gravada e avaliada. Resultados são confidenciais.</p>
        </div>
      </div>
    </main>
  );
}
