import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { MascotPeach, MascotStar, MascotCloud, MascotHeart, Sparkle } from "@/components/mascots";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linkup — Campus events & friend matching" },
      { name: "description", content: "Discover workshops, events and meetups on campus, register your interest, and get matched with classmates who share your vibe." },
      { property: "og:title", content: "Linkup — Find your campus crew" },
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
  return (
    <>
      <Hero />
      <EventsSection />
      <MatchTeaser />
      <FooterCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Floating blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-coral/40 animate-blob blur-2xl" />
        <div className="absolute top-32 right-0 w-80 h-80 bg-primary/25 animate-blob blur-3xl" style={{ animationDelay: "-3s" }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cream animate-blob blur-2xl" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-12 sm:pt-20 pb-12 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 items-center">
        <div className="animate-pop-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live on your campus this week
          </div>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl font-bold leading-[1] tracking-tight">
            Find your <span className="shimmer-sunset">people.</span><br />
            Show up <em className="not-italic shimmer-sunset">together.</em>
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground">
            Browse what's happening on campus, tap the events you're into, and we'll match you with classmates who share your vibe. <span className="font-semibold text-foreground">Free to explore — no sign-in needed.</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#events" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90 transition inline-flex items-center gap-2">
              <Sparkle className="w-4 h-4" /> Explore events
            </a>
            <a href="#match" className="rounded-full bg-card border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition">
              Find friends →
            </a>
          </div>
        </div>

        {/* Mascot cluster */}
        <div className="relative h-72 md:h-80" aria-hidden>
          <div className="absolute top-0 right-8 w-32 animate-float">
            <MascotPeach className="w-full drop-shadow-xl" />
          </div>
          <div className="absolute bottom-4 left-2 w-28 animate-float" style={{ animationDelay: "-1.5s" }}>
            <MascotStar className="w-full drop-shadow-xl" />
          </div>
          <div className="absolute top-20 left-16 w-36 animate-float" style={{ animationDelay: "-2.8s" }}>
            <MascotCloud className="w-full drop-shadow-xl" />
          </div>
          <div className="absolute bottom-10 right-0 w-20 animate-heartbeat">
            <MascotHeart className="w-full drop-shadow-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function EventsSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("all");

  const eventsQ = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data as EventRow[];
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

  const interestsQ = useQuery({
    enabled: !!user,
    queryKey: ["my-interests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_interests").select("event_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.event_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ eventId, on }: { eventId: string; on: boolean }) => {
      if (!user) throw new Error("auth");
      if (on) {
        const { error } = await supabase.from("event_interests")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_interests")
          .delete().eq("event_id", eventId).eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["my-interests", user!.id] });
      qc.invalidateQueries({ queryKey: ["event-counts"] });
      toast.success(v.on ? "You're in! 🎉" : "Removed from your list");
    },
    onError: (e: Error) => {
      if (e.message === "auth") return;
      toast.error(e.message);
    },
  });

  const categories = ["all", ...new Set((eventsQ.data ?? []).map((e) => e.category))];
  const filtered = (eventsQ.data ?? []).filter((e) => category === "all" || e.category === category);

  return (
    <section id="events" className="mx-auto max-w-5xl px-4 py-12 scroll-mt-20">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">This week on campus</h2>
          <p className="mt-1 text-muted-foreground text-sm">Tap an event to show interest — we'll surface people going to the same ones.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${category === c ? "bg-foreground text-background" : "bg-card border border-border hover:bg-secondary"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {eventsQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-card animate-pulse shadow-soft" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev, i) => (
            <EventCard
              key={ev.id}
              ev={ev}
              index={i}
              count={countsQ.data?.get(ev.id) ?? 0}
              registered={interestsQ.data?.has(ev.id) ?? false}
              signedIn={!!user}
              onToggle={(on) => toggle.mutate({ eventId: ev.id, on })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({
  ev, index, count, registered, signedIn, onToggle,
}: {
  ev: EventRow; index: number; count: number; registered: boolean; signedIn: boolean; onToggle: (on: boolean) => void;
}) {
  return (
    <article
      className="group flex flex-col rounded-2xl bg-card border border-border/60 shadow-soft hover-pop overflow-hidden animate-pop-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="bg-warm p-5 flex items-center justify-between relative overflow-hidden">
        <span className="text-5xl group-hover:animate-wobble inline-block">{ev.emoji}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/60 bg-background/60 backdrop-blur px-2 py-1 rounded-full">{ev.category}</span>
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
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{count}</span> interested
          </span>
          {signedIn ? (
            <button
              onClick={() => onToggle(!registered)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                registered ? "bg-foreground text-background" : "bg-primary text-primary-foreground shadow-pop hover:opacity-90"
              }`}
            >
              {registered ? "✓ I'm in" : "I'm in"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-pop hover:opacity-90"
            >
              Sign in to join
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function MatchTeaser() {
  const { user } = useAuth();
  return (
    <section id="match" className="mx-auto max-w-5xl px-4 py-12 scroll-mt-20">
      <div className="relative overflow-hidden rounded-3xl bg-sunset p-8 sm:p-12 text-primary-foreground shadow-pop">
        <div aria-hidden className="absolute -right-6 -top-6 w-40 animate-float">
          <MascotHeart className="w-full drop-shadow-2xl" />
        </div>
        <div aria-hidden className="absolute -left-4 bottom-0 w-32 animate-float" style={{ animationDelay: "-1.5s" }}>
          <MascotStar className="w-full drop-shadow-2xl" />
        </div>
        <div className="relative max-w-xl">
          <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
            Match with people who get you.
          </h2>
          <p className="mt-4 text-base sm:text-lg opacity-95">
            Pick a few interests, sign up for events that look fun, and we'll rank classmates by what you share — interests, plans, energy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link to="/friends" className="rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition">
                See your matches →
              </Link>
            ) : (
              <Link to="/auth" className="rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition">
                Sign in to get matched
              </Link>
            )}
            <a href="#events" className="rounded-full bg-foreground/15 backdrop-blur px-6 py-3 text-sm font-semibold hover:bg-foreground/25 transition">
              Keep browsing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 text-center">
      <div className="inline-flex gap-4 mb-4">
        <div className="w-12 animate-float"><MascotPeach className="w-full" /></div>
        <div className="w-12 animate-float" style={{ animationDelay: "-1s" }}><MascotCloud className="w-full" /></div>
        <div className="w-12 animate-float" style={{ animationDelay: "-2s" }}><MascotStar className="w-full" /></div>
      </div>
      <h3 className="font-display text-2xl sm:text-3xl font-bold">Campus is more fun with friends.</h3>
      <p className="mt-2 text-muted-foreground text-sm">Free to explore — sign in only when you want to join an event or get matched.</p>
    </section>
  );
}
