import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { hash } from "bcryptjs";


export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, password } = data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hash(password, 10),
        monthlyIncome: 0
      },
      select: { id: true, name: true, email: true }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el registro" },
      { status: 500 }
    );
  }
}