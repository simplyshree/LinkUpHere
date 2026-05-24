import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { sharedInterests } from "@/lib/interests";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Your matches — Linkup" }] }),
  component: FriendsPage,
});

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  year: string | null;
  avatar_emoji: string | null;
  interests: string[];
}

interface InterestRow { event_id: string; user_id: string }

function FriendsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profilesQ = useQuery({
    enabled: !!user,
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const eventInterestsQ = useQuery({
    enabled: !!user,
    queryKey: ["all-event-interests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_interests").select("event_id, user_id");
      if (error) throw error;
      return data as InterestRow[];
    },
  });

  const me = profilesQ.data?.find((p) => p.id === user?.id);

  const matches = useMemo(() => {
    if (!me || !profilesQ.data || !eventInterestsQ.data) return [];
    const myEvents = new Set(eventInterestsQ.data.filter((r) => r.user_id === me.id).map((r) => r.event_id));
    const eventsByUser = new Map<string, Set<string>>();
    for (const r of eventInterestsQ.data) {
      if (!eventsByUser.has(r.user_id)) eventsByUser.set(r.user_id, new Set());
      eventsByUser.get(r.user_id)!.add(r.event_id);
    }
    return profilesQ.data
      .filter((p) => p.id !== me.id)
      .map((p) => {
        const shared = sharedInterests(me.interests, p.interests);
        const theirEvents = eventsByUser.get(p.id) ?? new Set();
        const sharedEvents = [...myEvents].filter((id) => theirEvents.has(id));
        const score = shared.length * 2 + sharedEvents.length * 3;
        return { profile: p, sharedInterests: shared, sharedEventCount: sharedEvents.length, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [me, profilesQ.data, eventInterestsQ.data]);

  if (loading || !user) return <main className="px-4 py-20 text-center text-muted-foreground">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-24">
      <h1 className="font-display text-4xl font-bold">Your matches</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        People on campus who share your interests or have signed up for the same events.
      </p>

      {!me?.interests?.length ? (
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
            <li key={m.profile.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-5 flex items-start gap-4">
              <div className="text-4xl bg-warm rounded-2xl w-16 h-16 flex items-center justify-center shrink-0">
                {m.profile.avatar_emoji || "🎓"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-semibold">{m.profile.display_name}</h3>
                  {m.profile.year && <span className="text-xs text-muted-foreground">· {m.profile.year}</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sunset text-primary-foreground">
                    Match {m.score}
                  </span>
                </div>
                {m.profile.bio && <p className="text-sm text-muted-foreground mt-1">{m.profile.bio}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.sharedInterests.map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                  ))}
                </div>
                {m.sharedEventCount > 0 && (
                  <p className="mt-2 text-xs text-foreground/80">
                    🎯 You're both going to {m.sharedEventCount} event{m.sharedEventCount > 1 ? "s" : ""}
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
