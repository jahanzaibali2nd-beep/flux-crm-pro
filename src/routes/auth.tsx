import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    supabase.rpc("is_bootstrap_needed")
      .then(({ data: needed, error }) => {
        if (error) {
          console.error("Error checking if bootstrap is needed:", error);
          return;
        }
        if (needed) setMode("bootstrap");
      })
      .catch((err) => {
        console.error("Failed to check bootstrap status:", err);
      });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "bootstrap") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (signUpError) throw new Error(signUpError.message);
        
        if (signUpData.session) {
          toast.success("Admin account created");
          navigate({ to: "/dashboard" });
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw new Error(signInError.message);
          toast.success("Admin account created");
          navigate({ to: "/dashboard" });
        }
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
      <div className="glass-strong w-full max-w-md rounded-2xl p-8 border border-border/10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Flux CRM</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "bootstrap" ? "Create the first admin account" : "Sign in to your account"}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "bootstrap" && (
            <div className="space-y-2">
              <Label className="text-foreground/80 font-medium">Full name</Label>
              <Input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-foreground/80 font-medium">Email</Label>
            <Input type="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/80 font-medium">Password</Label>
            <Input type="password" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all mt-6">
            {busy ? "Please wait..." : mode === "bootstrap" ? "Create admin account" : "Sign in"}
          </Button>
        </form>
        {mode === "signin" && (
          <div className="mt-6 text-center space-y-3">
            <button 
              type="button" 
              onClick={() => setMode("bootstrap")}
              className="text-xs text-primary hover:underline font-semibold block mx-auto cursor-pointer"
            >
              Create first admin account
            </button>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Only administrators can create new user accounts. Ask your admin if you need access.
            </p>
          </div>
        )}
        {mode === "bootstrap" && (
          <button 
            type="button" 
            onClick={() => setMode("signin")}
            className="mt-6 text-xs text-primary hover:underline font-semibold block mx-auto text-center cursor-pointer"
          >
            Back to Sign in
          </button>
        )}
      </div>
    </div>
  );
}