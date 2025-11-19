import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'BANCARATA'
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

    // Normalizamos a minúsculas
    const existing = await collection.findOne({ email: email.toLowerCase() })

    await client.close()

    return NextResponse.json(
      { isAlreadySubscribed: !!existing },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { error: 'Error checking email' },
      { status: 500 }
    )
  }
}