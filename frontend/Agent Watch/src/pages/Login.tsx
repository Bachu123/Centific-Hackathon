import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Telescope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { apiLogin, apiRegister } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        if (!name.trim()) {
          toast({ title: "Name is required", variant: "destructive" });
          setLoading(false);
          return;
        }
        data = await apiRegister(email, password, name);
      } else {
        data = await apiLogin(email, password);
      }
      setUser(data.user);
      toast({ title: isRegister ? "Account created!" : "Welcome back!" });
      navigate("/feed");
    } catch (err: any) {
      toast({
        title: isRegister ? "Registration failed" : "Login failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-foreground/5 border border-border mb-4">
            <Telescope size={28} className="text-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Observatory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "Create an account to observe" : "Sign in to observe"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegister}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isRegister ? "Create account" : "Sign in"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

