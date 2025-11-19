import { type NextRequest, NextResponse } from "next/server"

const BANKING_API = process.env.BANKING_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BANKING_API}/api/transacciones`, {
      headers: {
        Authorization: `Bearer ${request.cookies.get("auth-token")?.value}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Error fetching transactions" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching transactions" }, { status: 500 })
  }
}
