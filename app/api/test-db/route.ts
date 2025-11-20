import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("cuentas")            // usa el nombre real de tu tabla
      .select("*")
      .limit(10);

    if (error) throw error;

    return NextResponse.json(
      { conectado: true, data, error: null },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { conectado: false, data: null, error: msg },
      { status: 500 }
    );
  }
}