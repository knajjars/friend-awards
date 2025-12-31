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
  const [stars, setStars] = useState<Array<{ id: number; left: number; top: number; delay: number; size: number }>>([]);

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
    <div className="min-h-screen flex flex-col bg-navy-950 relative">
      <StarField />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-gold-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-radial from-amber-500/3 via-transparent to-transparent" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy-950/80 border-b border-navy-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <span className="text-3xl trophy-animate">🏆</span>
            <span className="font-display text-2xl text-gold-gradient">
              Friend Awards
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Authenticated>
              <Link
                to="/host"
                className="btn-ghost text-sm hidden sm:flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                My Lobbies
              </Link>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 px-4 py-8">
        {children}
      </main>

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
      <div className="flex justify-center items-center min-h-[400px]">
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
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          New Year's Edition
        </div>

        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-bold mb-6 leading-none tracking-tight">
          <span className="text-white">The</span>{" "}
          <span className="text-gold-gradient">Friend Awards</span>
        </h1>

        <p className="text-xl sm:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
          Vote on hilarious awards with your friends.
          Celebrate the moments that made you laugh, cringe, and everything in between.
        </p>
      </div>

      {/* Join Lobby Card */}
      <div className="glass-card-highlight p-8 sm:p-10 mb-8 max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/20 flex items-center justify-center">
            <span className="text-2xl">🎫</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-white">Join a Lobby</h2>
        </div>

        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field text-center text-xl tracking-[0.3em] font-mono uppercase placeholder:tracking-normal placeholder:text-base"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="btn-primary w-full text-lg"
          >
            Join the Party
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 my-10 max-w-md mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-navy-600" />
        <span className="text-slate-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-navy-600" />
      </div>

      {/* Host Your Own CTA */}
      <div className="max-w-md mx-auto">
        <button
          onClick={handleHostClick}
          className="w-full glass-card p-7 sm:p-8 text-left group hover-lift cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 flex items-center justify-center group-hover:from-gold-500/30 group-hover:to-amber-500/30 transition-all">
                <span className="text-3xl">✨</span>
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-white mb-1">Host Your Own</h3>
                <p className="text-slate-400">Create and run your own award ceremony</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
        {[
          { icon: "🎭", title: "Fun Awards", desc: "Create hilarious categories" },
          { icon: "🗳️", title: "Easy Voting", desc: "Friends vote in seconds" },
          { icon: "🎬", title: "Epic Reveals", desc: "Present winners in style" },
        ].map((feature) => (
          <div key={feature.title} className="text-center p-6">
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h4 className="font-display text-lg text-white mb-2">{feature.title}</h4>
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
    <div className="max-w-md mx-auto mt-8">
      <Link
        to="/"
        className="btn-ghost flex items-center gap-2 mb-8 w-fit"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </Link>

      <div className="glass-card-highlight p-8 sm:p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-3">Host Your Own</h1>
          <p className="text-lg text-slate-400">Sign in to create and manage your award ceremonies</p>
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
      <Link
        to="/"
        className="btn-ghost flex items-center gap-2 mb-6 max-w-5xl mx-auto w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <LobbyDashboard onViewPresentation={handleViewPresentation} />
    </div>
  );
}
