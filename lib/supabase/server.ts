import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The setAll method was called from a Server Component.
          }
        },
      },
    }
  );
}

// Admin client for server-side system tasks (migrations/system logs).
// MUST NOT be used for patient-facing data operations.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stores one biomarker reading + its embedding into biomarker_history table
export async function storeBiomarkerEmbedding(
  patientId: string,
  reportId: string,
  reportDate: string,
  biomarkerName: string,
  value: number,
  unit: string,
  status: string,
  embedding: number[]
) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("biomarker_history").insert({
    patient_id: patientId,
    report_id: reportId,
    report_date: reportDate,
    biomarker_name: biomarkerName,
    value,
    unit,
    status,
    embedding,
  });
  if (error) {
    console.error("Error storing biomarker embedding:", error);
    throw error;
  }
}

// Retrieves past readings for a biomarker using vector search
export async function searchBiomarkerHistory(
  patientId: string,
  biomarkerName: string,
  embedding: number[]
) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("search_biomarker_history", {
    query_embedding: embedding,
    match_patient_id: patientId,
    match_biomarker: biomarkerName,
    match_count: 10,
  });
  if (error) {
    console.error("Error searching biomarker history:", error);
    throw error;
  }
  return data || [];
}
