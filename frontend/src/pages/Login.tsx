import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Zap, User, Mail, Lock, Sparkles } from "lucide-react";

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username) {
          setError("Username is required");
          setIsSubmitting(false);
          return;
        }
        await register(username, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const devUsers = [
    {
      email: "admin@sonictrivia.com",
      displayName: "Admin User",
      role: "admin",
      color: "red",
    },
    {
      email: "mod@sonictrivia.com",
      displayName: "Moderator",
      role: "moderator",
      color: "orange",
    },
    {
      email: "sonic@sonictrivia.com",
      displayName: "Sonic Fan",
      role: "player",
      color: "blue",
    },
    {
      email: "tails@sonictrivia.com",
      displayName: "Tails Lover",
      role: "player",
      color: "yellow",
    },
    {
      email: "knuckles@sonictrivia.com",
      displayName: "Knuckles Master",
      role: "player",
      color: "red",
    },
    {
      email: "shadow@sonictrivia.com",
      displayName: "Shadow Edge",
      role: "player",
      color: "purple",
    },
  ];

  const devPassword = import.meta.env.VITE_DEV_PASSWORD || "admin123";
  const showDevMode = import.meta.env.VITE_SHOW_DEV_MODE !== "false";

  const fillDevCredentials = (email: string) => {
    setEmail(email);
    setPassword(devPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Rings decoration */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-yellow-400/30 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-4 border-blue-300/30 rounded-full animate-spin-slow animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo/Title Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/50 animate-bounce-slow">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Sonic Trivia
          </h1>
          <p className="text-blue-200 text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Gotta answer fast!
            <Sparkles className="w-4 h-4" />
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 animate-slide-up">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isLogin ? "Welcome Back!" : "Join the Race"}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {isLogin
                ? "Sign in to continue your trivia adventure"
                : "Create your account and start playing"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2 animate-fade-in">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="sonic_speedster"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    disabled={isSubmitting}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sonic@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-blue-600" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isLogin && showDevMode && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Access (Dev Mode)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {devUsers.map((user) => (
                      <Button
                        key={user.email}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillDevCredentials(user.email)}
                        disabled={isSubmitting}
                        className={`text-xs border-blue-300 hover:bg-blue-100 hover:border-blue-400 flex flex-col items-center gap-1 h-auto py-2 ${
                          user.role === "admin"
                            ? "border-red-300 hover:bg-red-50"
                            : user.role === "moderator"
                              ? "border-orange-300 hover:bg-orange-50"
                              : "border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <span className="font-medium">{user.displayName}</span>
                        <span
                          className={`text-xs opacity-75 ${
                            user.role === "admin"
                              ? "text-red-600"
                              : user.role === "moderator"
                                ? "text-orange-600"
                                : "text-blue-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    All dev accounts use password:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      {devPassword}
                    </code>
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Sign In" : "Create Account"}
                    <Zap className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  disabled={isSubmitting}
                >
                  {isLogin ? "Create one now" : "Sign in instead"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-200 text-sm">
          <p>🎮 Ready to test your Sonic knowledge? 🎮</p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
