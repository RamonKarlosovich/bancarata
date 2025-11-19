import { NextRequest, NextResponse } from 'next/server'

// Simulando base de datos en memoria (en producción usarías MongoDB)
const accountRequests = new Map()

export async function POST(request: NextRequest) {
  try {
    const { nombreCompleto, numeroINE } = await request.json()

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = Array.from(accountRequests.values()).find(
      (req: any) => req.numeroINE === numeroINE && req.status === 'pending'
    )

    if (existingRequest) {
      return NextResponse.json(
        { hasPendingRequest: true },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { hasPendingRequest: false },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error checking requests' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { numeroINE, formData } = await request.json()
    const requestId = Math.random().toString(36).substring(7)
    
    accountRequests.set(requestId, {
      id: requestId,
      ...formData,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json(
      { success: true, requestId },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating request' },
      { status: 500 }
    )
  }
}
