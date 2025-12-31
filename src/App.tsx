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

      <header className="sticky top-0 z-50 border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="trophy-animate text-3xl">🏆</span>
            <span className="text-gold-gradient font-display text-2xl">Friend Awards</span>
          </Link>

          <div className="flex items-center gap-3">
            <Authenticated>
              <Link to="/host" className="btn-ghost hidden items-center gap-2 text-sm sm:flex">
                <Menu className="h-4 w-4" />
                My Lobbies
              </Link>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-8">{children}</main>

      <Toaster
        theme="dark"
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
      <div className="mb-14 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-5 py-2.5 font-medium text-gold-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
          New Year's Edition
        </div>

        <h1 className="mb-6 font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl md:text-8xl">
          <span className="text-white">The</span>{" "}
          <span className="text-gold-gradient">Friend Awards</span>
        </h1>

        <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-slate-400 sm:text-2xl">
          Vote on hilarious awards with your friends. Celebrate the moments that made you laugh,
          cringe, and everything in between.
        </p>
      </div>

      {/* Join Lobby Card */}
      <div className="glass-card-highlight mx-auto mb-8 max-w-md p-8 sm:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/20">
            <span className="text-2xl">🎫</span>
          </div>
          <h2 className="font-display text-2xl text-white sm:text-3xl">Join a Lobby</h2>
        </div>

        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field text-center font-mono text-xl uppercase tracking-[0.3em] placeholder:text-base placeholder:tracking-normal"
              maxLength={6}
            />
          </div>
          <button type="submit" disabled={!joinCode.trim()} className="btn-primary w-full text-lg">
            Join the Party
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="mx-auto my-10 flex max-w-md items-center justify-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-600" />
        <span className="text-sm text-slate-500">or</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-600" />
      </div>

      {/* Host Your Own CTA */}
      <div className="mx-auto max-w-md">
        <button
          onClick={handleHostClick}
          className="glass-card hover-lift group w-full cursor-pointer p-7 text-left sm:p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 transition-all group-hover:from-gold-500/30 group-hover:to-amber-500/30">
                <span className="text-3xl">✨</span>
              </div>
              <div>
                <h3 className="mb-1 font-display text-xl text-white sm:text-2xl">Host Your Own</h3>
                <p className="text-slate-400">Create and run your own award ceremony</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-gold-400" />
          </div>
        </button>
      </div>

      {/* Features */}
      <div className="mx-auto mt-20 grid max-w-3xl gap-6 sm:grid-cols-3">
        {[
          { icon: "🎭", title: "Fun Awards", desc: "Create hilarious categories" },
          { icon: "🗳️", title: "Easy Voting", desc: "Friends vote in seconds" },
          { icon: "🎬", title: "Epic Reveals", desc: "Present winners in style" },
        ].map((feature) => (
          <div key={feature.title} className="p-6 text-center">
            <div className="mb-3 text-4xl">{feature.icon}</div>
            <h4 className="mb-2 font-display text-lg text-white">{feature.title}</h4>
            <p className="text-slate-500">{feature.desc}</p>
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

// Host Page - Lobby Dashboard
function HostPage() {
  const navigate = useNavigate();

  const handleViewPresentation = (lobbyId: string) => {
    navigate(`/present/${lobbyId}`);
  };

  return (
    <div>
      <Link to="/" className="btn-ghost mx-auto mb-6 flex w-fit max-w-5xl items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <LobbyDashboard onViewPresentation={handleViewPresentation} />
    </div>
  );
}
