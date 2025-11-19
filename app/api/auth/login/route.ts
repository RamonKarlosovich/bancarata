import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    // Mock authentication - Reemplaza con tu API real
    if (email && password) {
      const token = Buffer.from(`${email}:${role}`).toString("base64")

      return NextResponse.json(
        {
          token,
          user: { email, role },
        },
        {
          headers: {
            "Set-Cookie": `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          },
        },
      )
    }

    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: "Error en autenticación" }, { status: 500 })
  }
}
