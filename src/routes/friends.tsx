import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getMyMatches } from "@/lib/matches.functions";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Your matches — Linkup" }] }),
  component: FriendsPage,
});

interface Match {
  id: string;
  display_name: string;
  avatar_emoji: string | null;
  year: string | null;
  interests: string[];
  shared_interests: string[];
  shared_event_count: number;
  score: number;
}

function FriendsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const meQ = useQuery({
    enabled: !!user,
    queryKey: ["me-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("interests")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const matchesQ = useQuery({
    enabled: !!user,
    queryKey: ["matches", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_matches");
      if (error) throw error;
      return ((data ?? []) as Match[]).map((m) => ({
        ...m,
        shared_event_count: Number(m.shared_event_count),
      }));
    },
  });

  if (loading || !user) return <main className="px-4 py-20 text-center text-muted-foreground">Loading…</main>;

  const matches = matchesQ.data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-24">
      <h1 className="font-display text-4xl font-bold">Your matches</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        People on campus who share your interests or have signed up for the same events.
      </p>

      {!meQ.data?.interests?.length ? (
        <div className="mt-8 rounded-2xl bg-card border border-border/60 p-6 text-center">
          <p className="text-sm text-muted-foreground">Add some interests first so we can find your people.</p>
          <Link to="/profile" className="mt-3 inline-block rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-pop">
            Set up profile
          </Link>
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card border border-border/60 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No matches yet. Register interest in a few events to surface people with the same plans.
          </p>
          <Link to="/" className="mt-3 inline-block rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-pop">
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {matches.map((m) => (
            <li key={m.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-5 flex items-start gap-4">
              <div className="text-4xl bg-warm rounded-2xl w-16 h-16 flex items-center justify-center shrink-0">
                {m.avatar_emoji || "🎓"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-semibold">{m.display_name}</h3>
                  {m.year && <span className="text-xs text-muted-foreground">· {m.year}</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sunset text-primary-foreground">
                    Match {m.score}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.shared_interests.map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                  ))}
                </div>
                {m.shared_event_count > 0 && (
                  <p className="mt-2 text-xs text-foreground/80">
                    🎯 You're both going to {m.shared_event_count} event{m.shared_event_count > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
