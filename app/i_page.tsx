// app/i/[inviteId]/page.tsx
//
// Porta de entrada por convite — autocontida.
//
// Valida o convite e mostra uma confirmação curta antes de começar.
// Não depende de alterações na landing nem na rota de sessões.
//
// O crédito NÃO é consumido aqui. Só quando a pessoa confirma e a sessão
// é criada de fato — quem abre o link e desiste não gasta nada.

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FormularioInicio from "./form";

export default async function EntradaConvite({ params }: { params: { inviteId: string } }) {
  const convite = await prisma.invite.findUnique({
    where: { id: params.inviteId },
    include: { tenant: true },
  });

  if (!convite) {
    return <Aviso icone="🔍" titulo="Convite não encontrado"
      texto="Este link não corresponde a nenhum convite. Verifique se copiou o endereço completo ou peça um novo link a quem enviou." />;
  }

  if (convite.status === "CANCELED") {
    return <Aviso icone="⛔" titulo="Convite cancelado"
      texto="Este convite não está mais válido. Entre em contato com quem enviou para receber um novo." />;
  }

  // Já concluiu → devolutiva
  if (convite.status === "COMPLETED" && convite.sessionId) {
    redirect(`/devolutiva/${convite.sessionId}`);
  }

  // Já começou → retoma de onde parou
  if (convite.status === "STARTED" && convite.sessionId) {
    redirect(`/assessment/${convite.sessionId}`);
  }

  return (
    <FormularioInicio
      inviteId={convite.id}
      email={convite.email}
      nome={convite.nome ?? ""}
      empresa={convite.tenant.nome}
    />
  );
}

function Aviso({ icone, titulo, texto }: { icone: string; titulo: string; texto: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "2rem 1rem",
      fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 20px rgba(0,0,0,.08)",
        maxWidth: 440, width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: "1rem" }}>{icone}</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#042C53", margin: "0 0 .75rem" }}>{titulo}</h1>
        <p style={{ fontSize: 14.5, color: "#555", lineHeight: 1.7, margin: 0 }}>{texto}</p>
      </div>
    </main>
  );
}
