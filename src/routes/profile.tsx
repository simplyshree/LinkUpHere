import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ALL_INTERESTS } from "@/lib/interests";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — Linkup" }] }),
  component: ProfilePage,
});

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad", "Other"];
const AVATARS = ["🎓","🌸","🚀","🎨","⚡","🌊","🔥","🪐","🍵","🎧","📚","🌻"];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profileQ = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [year, setYear] = useState("");
  const [avatar, setAvatar] = useState("🎓");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (profileQ.data) {
      setName(profileQ.data.display_name ?? "");
      setBio(profileQ.data.bio ?? "");
      setYear(profileQ.data.year ?? "");
      setAvatar(profileQ.data.avatar_emoji ?? "🎓");
      setSelected(profileQ.data.interests ?? []);
    }
  }, [profileQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        display_name: name, bio, year, avatar_emoji: avatar, interests: selected,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved!");
      qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      qc.invalidateQueries({ queryKey: ["matches", user!.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || !user) return <main className="px-4 py-20 text-center text-muted-foreground">Loading…</main>;

  const toggle = (t: string) => setSelected((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-24">
      <h1 className="font-display text-4xl font-bold">Your profile</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Pick the interests that describe you — we'll use them to match you with people and events.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="mt-6 rounded-2xl bg-card border border-border/60 shadow-soft p-6 space-y-5"
      >
        <div className="flex gap-4 items-start">
          <div className="text-6xl bg-warm rounded-2xl w-20 h-20 flex items-center justify-center shrink-0">{avatar}</div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">Pick an avatar</span>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)}
                className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition ${avatar === a ? "bg-primary shadow-pop scale-110" : "bg-secondary hover:bg-accent"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="One sentence about you."
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">Year</span>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <button key={y} type="button" onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${year === y ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                {y}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">
            Interests <span className="text-muted-foreground normal-case font-normal">({selected.length} picked)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map((t) => {
              const on = selected.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggle(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${on ? "bg-primary text-primary-foreground shadow-pop" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                  {on ? "✓ " : ""}{t}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={save.isPending}
          className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow-pop hover:opacity-90 disabled:opacity-60">
          {save.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
