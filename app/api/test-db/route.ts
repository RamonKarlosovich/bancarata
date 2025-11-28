import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export async function GET() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("cuentas")   // nombre real de la tabla
    .select("*")
    .limit(10);

  return NextResponse.json({
    conectado: !error,
    data,
    error,
  });
}