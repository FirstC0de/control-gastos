// src/app/api/users/[userId]/expenses/income/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const income = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { monthlyIncome: true }
    });
    
    return NextResponse.json(income?.monthlyIncome || 0);
  } catch (error) {
    console.error("Error al obtener ingresos:", error);
    return NextResponse.json(
      { error: "Error al obtener ingresos" },
      { status: 500 }
    );
  }
}
