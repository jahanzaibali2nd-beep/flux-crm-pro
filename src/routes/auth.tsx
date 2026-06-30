import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapFirstAdmin, checkBootstrapNeeded } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "bootstrap">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    checkBootstrapNeeded().then((r) => {
      if (r.needed) setMode("bootstrap");
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "bootstrap") {
        await bootstrapFirstAdmin({ data: { email, password, name } });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        toast.success("Admin account created");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-strong w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Flux Marketing CRM</h1>
            <p className="text-xs text-white/60">
              {mode === "bootstrap" ? "Create the first admin" : "Sign in to your account"}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "bootstrap" && (
            <div className="space-y-2">
              <Label className="text-white/80">Full name</Label>
              <Input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-white/80">Email</Label>
            <Input type="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Password</Label>
            <Input type="password" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-90">
            {busy ? "Please wait..." : mode === "bootstrap" ? "Create admin account" : "Sign in"}
          </Button>
        </form>
        {mode === "signin" && (
          <p className="mt-4 text-center text-xs text-white/50">
            Only admins can create new users — ask your admin if you need access.
          </p>
        )}
      </div>
    </div>
  );
}