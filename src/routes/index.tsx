import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linkup — Campus events & friend matching" },
      { name: "description", content: "Discover workshops and events on campus, register your interest, and get matched with students who share your vibe." },
      { property: "og:title", content: "Linkup — Campus events & friend matching" },
      { property: "og:description", content: "Find your people on campus." },
    ],
  }),
  component: HomePage,
});

interface EventRow {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  starts_at: string;
  host: string;
  emoji: string;
  interests: string[];
}

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">Loading…</main>
    );
  }
  return <EventsFeed />;
}

function EventsFeed() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const eventsQ = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const interestsQ = useQuery({
    queryKey: ["my-interests", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_interests").select("event_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.event_id));
    },
  });

  const countsQ = useQuery({
    queryKey: ["event-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_interests").select("event_id");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.event_id, (map.get(row.event_id) ?? 0) + 1);
      return map;
    },
  });

  const profileQ = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ eventId, on }: { eventId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("event_interests")
          .insert({ event_id: eventId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_interests")
          .delete().eq("event_id", eventId).eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-interests", user!.id] });
      qc.invalidateQueries({ queryKey: ["event-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const needsProfile = profileQ.data && (profileQ.data.interests?.length ?? 0) === 0;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      {/* Hero */}
      <section className="pt-10 sm:pt-16 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Campus, live this week
        </div>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
          Find your people. <span className="bg-sunset bg-clip-text text-transparent">Show up together.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base sm:text-lg text-muted-foreground">
          Browse what's happening on campus, tap the events you're into, and we'll match you with classmates who share your interests.
        </p>
        {needsProfile && (
          <Link to="/profile" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-pop hover:opacity-90">
            Pick your interests → unlock matches
          </Link>
        )}
      </section>

      {/* Events grid */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold">This week on campus</h2>
          <Link to="/friends" className="text-sm font-medium text-primary hover:underline">
            See your matches →
          </Link>
        </div>

        {eventsQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-card animate-pulse shadow-soft" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsQ.data?.map((ev) => {
              const registered = interestsQ.data?.has(ev.id) ?? false;
              const count = countsQ.data?.get(ev.id) ?? 0;
              return (
                <article key={ev.id} className="group flex flex-col rounded-2xl bg-card border border-border/60 shadow-soft hover:shadow-pop transition overflow-hidden">
                  <div className="bg-warm p-5 flex items-center justify-between">
                    <span className="text-4xl">{ev.emoji}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-foreground/60">{ev.category}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display text-xl font-semibold leading-snug">{ev.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                    <dl className="mt-3 space-y-1 text-xs text-foreground/70">
                      <div className="flex gap-2"><dt>📍</dt><dd>{ev.location}</dd></div>
                      <div className="flex gap-2"><dt>🗓️</dt><dd>{new Date(ev.starts_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</dd></div>
                      <div className="flex gap-2"><dt>👤</dt><dd>{ev.host}</dd></div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {ev.interests.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{count} interested</span>
                      <button
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ eventId: ev.id, on: !registered })}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          registered
                            ? "bg-foreground text-background"
                            : "bg-primary text-primary-foreground shadow-pop hover:opacity-90"
                        }`}
                      >
                        {registered ? "✓ Interested" : "I'm in"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
