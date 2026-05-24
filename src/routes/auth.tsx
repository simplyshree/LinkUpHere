import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Linkup" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Linkup!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold">
          {mode === "signup" ? "Join your campus" : "Welcome back"}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          {mode === "signup" ? "Sign up to discover events and meet people who share your interests." : "Sign in to your Linkup account."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card border border-border/60 shadow-soft p-6">
        {mode === "signup" && (
          <Field label="Display name">
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        )}
        <Field label="Campus email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Password">
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <button
          type="submit" disabled={loading}
          className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow-pop hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Just a sec…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Already on Linkup? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
