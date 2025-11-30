import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'BANCARRATA'
const COLLECTION_NAME = 'SUSCRIPCIONES_BOLETIN'
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    const normalizedEmail = email.toLower
    const existing = await collection.findOne({ email: normalizedEmail })
    if (existing) {
      await client.close()
      return NextResponse.json(
        { error: 'Este correo ya está suscrito' },
        { status: 409 }
      )
    }
    const result = await collection.insertOne({
      email: normalizedEmail,
      estado: 'ACTIVO',
      fechaSuscripcion: new Date(),
      ultimoEnvio: null,
    })
    await client.close()
    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error subscribe:', error)
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Este correo ya está suscrito' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    )
  }
}