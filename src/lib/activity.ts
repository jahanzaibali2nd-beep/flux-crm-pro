import { supabase } from "@/integrations/supabase/client";

export async function logActivity(opts: {
  user_id: string;
  user_name: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
}) {
  await supabase.from("activity_logs").insert(opts);
}