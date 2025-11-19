import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'BANCARATA'
const COLLECTION_NAME = 'SOLICITUDES_CUENTA'

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    const result = await collection.insertOne({
      ...formData,
      estado: 'PENDIENTE',
      fechaSolicitud: new Date(),
      fechaRevision: null,
    })

    await client.close()

    return Response.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}