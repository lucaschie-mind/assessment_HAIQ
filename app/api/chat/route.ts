import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CASES } from "@/lib/cases";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { sessionId, message } = await req.json();
  if (!sessionId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { logs: { orderBy: { sequenceNumber: "asc" } } } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.completedAt) return NextResponse.json({ error: "Session completed" }, { status: 400 });

  const caseData = CASES[session.caseId];
  if (!caseData) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const nextSeq = session.logs.length + 1;
  await prisma.log.create({ data: { sessionId, sequenceNumber: nextSeq, role: "CANDIDATE", content: message } });

  const history = session.logs.map((l: { role: string; content: string }) => ({
    role: l.role === "CANDIDATE" ? "user" as const : "assistant" as const,
    content: l.content,
  }));
  history.push({ role: "user", content: message });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 2000,
    system: caseData.systemPrompt, messages: history,
  });

  const aiContent = response.content[0].type === "text" ? response.content[0].text : "";
  await prisma.log.create({ data: { sessionId, sequenceNumber: nextSeq + 1, role: "AI", content: aiContent } });

  return NextResponse.json({ message: aiContent, turnCount: nextSeq + 1 });
}
