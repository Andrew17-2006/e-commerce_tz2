import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { apiErrorMessage } from "@/api/client";
import { cn } from "@/components/ui/utils";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;

  const validate = () => {
    const e: typeof errors = {};
    if (mode === "register" && !name.trim()) e.name = "Вкажіть ім'я";
    if (!email.includes("@")) e.email = "Введіть коректну електронну адресу";
    if (password.length < 8) e.password = "Щонайменше 8 символів";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";
    const onSuccess = () => {
      toast.success(`Welcome${name ? `, ${name}` : ""}!`);
      navigate(from, { replace: true });
    };
    const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Помилка автентифікації"));

    if (mode === "login") {
      login.mutate({ email, password }, { onSuccess, onError });
    } else {
      register.mutate({ email, password, name }, { onSuccess, onError });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue" : "Start shopping today"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex bg-muted p-1 rounded-xl mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label>Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Olena Kovalenko" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto mt-4 transition-colors">
          <ArrowLeft size={14} /> Back to catalog
        </button>
      </div>
    </div>
  );
}
