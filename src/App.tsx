import { Authenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { LobbyDashboard } from "./components/LobbyDashboard";
import { VotingPage } from "./components/VotingPage";
import { PresentationMode } from "./components/PresentationMode";
import { useConvexAuth } from "convex/react";
import { Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { Menu, ChevronRight, ChevronLeft } from "lucide-react";

// Generate random stars for background
function StarField() {
  const [stars, setStars] = useState<
    Array<{ id: number; left: number; top: number; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 2 + 1,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="stars">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Layout wrapper with header
function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="relative flex min-h-screen flex-col bg-navy-950">
      <StarField />

      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/2 h-full w-full bg-gradient-radial from-gold-500/5 via-transparent to-transparent" />
        <div className="from-amber-500/3 absolute -bottom-1/2 -right-1/4 h-full w-full bg-gradient-radial via-transparent to-transparent" />
      </div>

      <header className="safe-area-top sticky top-0 z-50 border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6">
          <Link to="/" className="group flex items-center gap-2 sm:gap-3">
            <span className="trophy-animate text-2xl sm:text-3xl">🏆</span>
            <span className="text-gold-gradient font-display text-lg sm:text-2xl">
              Petty Honors
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Authenticated>
              <Link
                to="/host"
                className="btn-ghost flex items-center gap-1.5 px-2.5 py-2 text-sm sm:gap-2 sm:px-4"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden xs:inline">My Lobbies</span>
              </Link>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="safe-area-bottom relative z-10 flex-1 px-3 py-6 sm:px-4 sm:py-8">
        {children}
      </main>

      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#161a2e",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            color: "#f1f5f9",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/host" element={<ProtectedHostPage />} />
        <Route path="/host/:lobbyId" element={<ProtectedManageLobbyPage />} />
        <Route path="/vote/:shareCode" element={<VoteRoute />} />
        <Route path="/present/:lobbyId" element={<PresentRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// Protected route wrapper for host page
function ProtectedHostPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <HostPage />;
}

// Protected route wrapper for managing a specific lobby
function ProtectedManageLobbyPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!lobbyId) {
    return <Navigate to="/host" replace />;
  }

  return <ManageLobbyPage lobbyId={lobbyId} />;
}

// Vote route - extracts shareCode from URL
function VoteRoute() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();

  if (!shareCode) {
    return <Navigate to="/" replace />;
  }

  return <VotingPage shareCode={shareCode} onBack={() => navigate("/")} />;
}

// Present route - extracts lobbyId from URL
function PresentRoute() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();

  if (!lobbyId) {
    return <Navigate to="/" replace />;
  }

  return <PresentationMode lobbyId={lobbyId} onBack={() => navigate("/host")} />;
}

// Home Page - Join lobby + Host CTA
function HomePage() {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/vote/${joinCode.trim().toUpperCase()}`);
    }
  };

  const handleHostClick = () => {
    if (isAuthenticated) {
      navigate("/host");
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero Section */}
      <div className="mb-10 text-center sm:mb-14">
        <h1 className="mb-4 font-display text-4xl font-bold leading-none tracking-tight sm:mb-6 sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="text-white">The</span>{" "}
          <span className="text-gold-gradient">Petty Honors</span>
        </h1>

        <p className="mx-auto max-w-2xl px-2 text-base font-light leading-relaxed text-slate-400 sm:text-xl md:text-2xl">
          Vote on hilarious awards with your friends. Celebrate the moments that made you laugh,
          cringe, and everything in between.
        </p>
      </div>

      {/* Join Lobby Card */}
      <div className="glass-card-highlight mx-auto mb-6 max-w-md p-6 sm:mb-8 sm:p-8 md:p-10">
        <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 sm:h-14 sm:w-14 sm:rounded-2xl">
            <span className="text-xl sm:text-2xl">🎫</span>
          </div>
          <h2 className="font-display text-xl text-white sm:text-2xl md:text-3xl">Join a Lobby</h2>
        </div>

        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field text-center font-mono text-lg uppercase tracking-[0.2em] placeholder:text-sm placeholder:tracking-normal sm:text-xl sm:tracking-[0.3em] sm:placeholder:text-base"
              maxLength={6}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="btn-primary touch-target w-full"
          >
            Join the Party
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="mx-auto my-8 flex max-w-md items-center justify-center gap-4 sm:my-10">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-600" />
        <span className="text-sm text-slate-500">or</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-600" />
      </div>

      {/* Host Your Own CTA */}
      <div className="mx-auto max-w-md">
        <button
          onClick={handleHostClick}
          className="glass-card hover-lift group w-full cursor-pointer p-5 text-left sm:p-7 md:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 transition-all group-hover:from-gold-500/30 group-hover:to-amber-500/30 sm:h-14 sm:w-14 sm:rounded-2xl">
                <span className="text-2xl sm:text-3xl">✨</span>
              </div>
              <div className="min-w-0">
                <h3 className="mb-0.5 font-display text-lg text-white sm:mb-1 sm:text-xl md:text-2xl">
                  Host Your Own
                </h3>
                <p className="text-sm text-slate-400 sm:text-base">
                  Create and run your own award ceremony
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-gold-400 sm:h-6 sm:w-6" />
          </div>
        </button>
      </div>

      {/* Features */}
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-2 sm:mt-20 sm:gap-6">
        {[
          { icon: "🎭", title: "Fun Awards", desc: "Create hilarious categories" },
          { icon: "🗳️", title: "Easy Voting", desc: "Vote in seconds" },
          { icon: "🎬", title: "Epic Reveals", desc: "Present winners in style" },
        ].map((feature) => (
          <div key={feature.title} className="p-3 text-center sm:p-6">
            <div className="mb-2 text-2xl sm:mb-3 sm:text-4xl">{feature.icon}</div>
            <h4 className="mb-1 font-display text-sm text-white sm:mb-2 sm:text-lg">
              {feature.title}
            </h4>
            <p className="text-xs text-slate-500 sm:text-base">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sign In Page
function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  // Redirect to host if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/host", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="mx-auto mt-8 max-w-md">
      <Link to="/" className="btn-ghost mb-8 flex w-fit items-center gap-2">
        <ChevronLeft className="h-5 w-5" />
        Back
      </Link>

      <div className="glass-card-highlight p-8 sm:p-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/20">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="mb-3 font-display text-3xl text-white sm:text-4xl">Host Your Own</h1>
          <p className="text-lg text-slate-400">
            Sign in to create and manage your award ceremonies
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}

// Host Page - Lobby List
function HostPage() {
  return (
    <div>
      <Link to="/" className="btn-ghost mx-auto mb-6 flex w-fit max-w-5xl items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <LobbyDashboard />
    </div>
  );
}

// Manage Lobby Page
function ManageLobbyPage({ lobbyId }: { lobbyId: string }) {
  const navigate = useNavigate();

  return (
    <div>
      <Link to="/host" className="btn-ghost mx-auto mb-6 flex w-fit max-w-5xl items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Lobbies
      </Link>

      <LobbyDashboard
        lobbyId={lobbyId}
        onNavigateToPresentation={(id) => navigate(`/present/${id}`)}
      />
    </div>
  );
}
