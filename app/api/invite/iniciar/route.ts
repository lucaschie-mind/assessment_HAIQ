// app/api/invite/iniciar/route.ts
//
// Cria a sessão a partir de um convite e consome o crédito.
//
// Rota nova e autocontida: não altera /api/sessions, que continua servindo
// o fluxo antigo (quem entra pela landing sem convite) sem nenhuma mudança.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pickRandomCase } from "@/lib/cases";

export async function POST(req: NextRequest) {
  try {
    const { inviteId, nome } = await req.json();

    if (!inviteId) return NextResponse.json({ error: "Convite não informado." }, { status: 400 });
    if (!nome || !String(nome).trim()) {
      return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    }

    const convite = await prisma.invite.findUnique({ where: { id: inviteId } });

    if (!convite) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }
    if (convite.status === "CANCELED") {
      return NextResponse.json({ error: "Este convite foi cancelado." }, { status: 400 });
    }
    // Já tem sessão: devolve a existente em vez de criar outra.
    // Protege contra duplo clique e contra reabrir o link numa segunda aba.
    if (convite.sessionId) {
      return NextResponse.json({ sessionId: convite.sessionId, retomada: true });
    }

    const caso = pickRandomCase();

    // A sessão e a marcação do convite andam juntas: ou as duas acontecem,
    // ou nenhuma. Evita sessão órfã ou crédito consumido sem sessão.
    const sessionId = await prisma.$transaction(async (tx: any) => {
      const sessao = await tx.session.create({
        data: {
          candidateName:  String(nome).trim(),
          candidateEmail: convite.email,
          caseId:     caso.id,
          caseTitle:  caso.title,
          caseDomain: caso.domain,
          tenantId:   convite.tenantId,
        },
      });

      await tx.invite.update({
        where: { id: convite.id },
        data: {
          status: "STARTED",
          iniciadoEm: new Date(),
          sessionId: sessao.id,
          nome: convite.nome ?? String(nome).trim(),
        },
      });

      return sessao.id as string;
    });

    return NextResponse.json({ sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao iniciar o assessment.";
    console.error("[invite/iniciar]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
