"use client";
// app/i/[inviteId]/form.tsx
//
// Confirmação antes de começar. Mantém o contexto que a landing dá
// (o que é, como funciona, quanto tempo leva) para quem chega por convite.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioInicio({
  inviteId, email, nome, empresa,
}: { inviteId: string; email: string; nome: string; empresa: string }) {
  const router = useRouter();
  const [nomeInput, setNome] = useState(nome);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function comecar(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeInput.trim()) return;
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch("/api/invite/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, nome: nomeInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Não foi possível começar."); setCarregando(false); return; }
      router.push(`/assessment/${d.sessionId}`);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  const passos = [
    "Leia o problema apresentado. Você poderá consultá-lo durante todo o desafio.",
    "Converse livremente com a IA e explore as informações disponíveis.",
    "Use os aprendizados da conversa para elaborar seu plano de ação.",
    "Envie seu plano de ação e pronto — sua sessão é avaliada.",
  ];

  return (
    <main style={S.main}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.logo}>HAI-Q</div>
          <div style={S.logoSub}>Human–AI Intelligence Quotient</div>
        </div>

        <div style={{ padding: "1.5rem 2rem 2rem" }}>
          <h1 style={S.titulo}>Assessment de Colaboração com IA</h1>

          <p style={S.texto}>
            A <strong>{empresa}</strong> convidou você para este desafio. Você vai trabalhar
            junto com uma IA para analisar um problema organizacional real e construir
            um <strong>plano de ação</strong>.
          </p>
          <p style={S.texto}>
            Não existe resposta certa. O que se observa é como você <strong>colabora</strong> com
            a IA — como investiga o problema, usa as informações disponíveis e constrói sua proposta.
          </p>

          <h2 style={S.subtitulo}>Como funciona</h2>
          <div style={{ marginBottom: "1.25rem" }}>
            {passos.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", margin: ".5rem 0" }}>
                <span style={S.num}>{i + 1}</span>
                <span style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{p}</span>
              </div>
            ))}
          </div>

          <p style={S.texto}>
            Não há tempo limite. A média é de aproximadamente 30 minutos.
          </p>
          <p style={{ ...S.texto, color: "#042C53", fontWeight: 700 }}>Bom desafio!</p>

          <form onSubmit={comecar}>
            <label style={S.label}>Nome completo</label>
            <input
              style={S.input} type="text" value={nomeInput} required disabled={carregando}
              onChange={(e) => setNome(e.target.value)} placeholder="Seu nome"
            />

            <label style={S.label}>E-mail</label>
            <input style={{ ...S.input, background: "#f5f7fa", color: "#666" }}
              type="email" value={email} readOnly />
            <p style={S.nota}>Este é o e-mail do seu convite e não pode ser alterado.</p>

            {erro && <p style={S.erro}>{erro}</p>}

            <button type="submit" disabled={carregando || !nomeInput.trim()}
              style={{ ...S.btn, ...(carregando || !nomeInput.trim() ? S.btnOff : {}) }}>
              {carregando ? "Preparando seu desafio..." : "Começar o assessment →"}
            </button>
          </form>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
            {["⏱ ~30 minutos", "💬 Chat com IA", "📋 Problema aberto"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#555" }}>{t}</span>
            ))}
          </div>
          <p style={S.rodape}>Sua interação será gravada e avaliada. Resultados são confidenciais.</p>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main:      { minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", background: "#f0f4f8", padding: "2rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" },
  card:      { background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", maxWidth: 520, width: "100%", overflow: "hidden" },
  header:    { background: "#042C53", padding: "2rem", textAlign: "center" },
  logo:      { fontSize: 52, fontWeight: 700, color: "#378ADD", letterSpacing: 3 },
  logoSub:   { fontSize: 14, color: "#85B7EB", marginTop: 4 },
  titulo:    { fontSize: 20, fontWeight: 600, color: "#042C53", margin: "0 0 .75rem" },
  subtitulo: { fontSize: 15, fontWeight: 600, color: "#042C53", margin: "1.25rem 0 .6rem" },
  texto:     { fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 .85rem" },
  num:       { background: "#D6E8F9", color: "#185FA5", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  label:     { display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6, marginTop: ".5rem" },
  input:     { width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" },
  nota:      { fontSize: 12, color: "#888", margin: "5px 0 .5rem" },
  erro:      { color: "#D85A30", fontSize: 14, margin: ".5rem 0" },
  btn:       { width: "100%", padding: 13, background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: ".75rem" },
  btnOff:    { background: "#93b8d8", cursor: "not-allowed" },
  rodape:    { textAlign: "center", fontSize: 12, color: "#888", marginTop: "1rem" },
};
