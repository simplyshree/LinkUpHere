import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getEventInterestCounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_event_interest_counts");
    if (error) throw new Error(error.message);
    return (data ?? []) as { event_id: string; count: number }[];
  },
);

export const getMyMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_matches_for", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as {
      id: string;
      display_name: string;
      avatar_emoji: string | null;
      year: string | null;
      interests: string[];
      shared_interests: string[];
      shared_event_count: number;
      score: number;
    }[];
  });
