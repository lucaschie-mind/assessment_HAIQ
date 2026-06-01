import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pickRandomCase } from "@/lib/cases";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  const c = pickRandomCase();
  const session = await prisma.session.create({
    data: { candidateName: name.trim(), candidateEmail: email.trim().toLowerCase(), caseId: c.id, caseTitle: c.title, caseDomain: c.domain },
  });
  return NextResponse.json({ sessionId: session.id, caseId: c.id });
}
