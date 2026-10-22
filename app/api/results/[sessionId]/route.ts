// app/api/results/[sessionId]/route.ts
//
// Devolve os dados da devolutiva mais a config de exibição do tenant.
//
// Sessões sem tenant (fluxo antigo, antes do multi-tenant) recebem a
// configuração padrão — ou seja, veem tudo. Nada quebra.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { configDoTenant, PADRAO } from "@/lib/report-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      evaluation: true,
      logs: { orderBy: { sequenceNumber: "asc" } },
      tenant: true,
    },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = session.tenant
    ? configDoTenant(session.tenant.reportConfig)
    : { ...PADRAO };

  return NextResponse.json({
    session: {
      id:              session.id,
      candidateName:   session.candidateName,
      caseId:          session.caseId,
      caseTitle:       session.caseTitle,
      caseDomain:      session.caseDomain,
      startedAt:       session.startedAt,
      completedAt:     session.completedAt,
      durationSeconds: session.durationSeconds,
    },
    evaluation: session.evaluation,
    logCount:   session.logs.length,
    config,
  });
}
