import { Authenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, useRef } from "react";
import { LobbyDashboard } from "./components/LobbyDashboard";
import { VotingPage } from "./components/VotingPage";
import { PresentationMode } from "./components/PresentationMode";
import { useConvexAuth } from "convex/react";
import { Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { Menu, ChevronRight, ChevronLeft, Sparkles, Users, Vote, Trophy, Zap, PartyPopper, Star, ArrowRight } from "lucide-react";

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

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Home Page - Join lobby + Host CTA
function HomePage() {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  // Scroll animation refs
  const howItWorksSection = useInView(0.2);
  const featuresSection = useInView(0.2);
  const ctaSection = useInView(0.3);

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

  const howItWorksSteps = [
    {
      step: 1,
      icon: Sparkles,
      title: "Create Your Ceremony",
      description: "Set up custom award categories that fit your group's inside jokes and memorable moments",
    },
    {
      step: 2,
      icon: Users,
      title: "Invite Your Friends",
      description: "Share a simple 6-digit code. No downloads, no sign-ups required for voters",
    },
    {
      step: 3,
      icon: Vote,
      title: "Cast Your Votes",
      description: "Everyone votes anonymously on who deserves each honor (or dishonor)",
    },
    {
      step: 4,
      icon: Trophy,
      title: "Reveal the Winners",
      description: "Present results with dramatic reveals and celebrate together",
    },
  ];

  const features = [
    {
      icon: PartyPopper,
      title: "Perfect for Any Group",
      description: "Friendsgivings, work parties, family reunions, game nights — make any gathering memorable",
      gradient: "from-pink-500/20 to-rose-500/20",
    },
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      description: "Create a ceremony in under 2 minutes. Pre-made templates get you started instantly",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
      icon: Star,
      title: "Real-Time Updates",
      description: "Watch votes roll in live. Results update instantly as friends submit their picks",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero Section */}
      <div className="mb-16 text-center sm:mb-20">
        <div className="hero-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2">
          <Star className="h-4 w-4 text-gold-400" />
          <span className="text-sm font-medium text-gold-400">Award ceremonies for the rest of us</span>
        </div>

        <h1 className="hero-title mb-6 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:mb-8 sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="block text-white">The</span>
          <span className="text-gold-gradient">Petty Honors</span>
        </h1>

        <p className="hero-subtitle mx-auto max-w-2xl px-4 text-lg font-light leading-relaxed text-slate-400 sm:text-xl md:text-2xl">
          Vote on hilarious awards with your friends. Celebrate the moments that
          made you laugh, cringe, and everything in between.
        </p>

        {/* Floating decorative elements */}
        <div className="pointer-events-none absolute left-1/4 top-32 hidden lg:block">
          <div className="floating-element animation-delay-1">🏆</div>
        </div>
        <div className="pointer-events-none absolute right-1/4 top-48 hidden lg:block">
          <div className="floating-element animation-delay-2">⭐</div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="mb-20 grid gap-6 sm:mb-28 sm:grid-cols-2">
        {/* Join Lobby Card */}
        <div className="action-card glass-card-highlight p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/20">
              <span className="text-2xl">🎫</span>
            </div>
            <div>
              <h2 className="font-display text-xl text-white sm:text-2xl">Join a Lobby</h2>
              <p className="text-sm text-slate-400">Got a code? Jump right in</p>
            </div>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field text-center font-mono text-xl uppercase tracking-[0.3em] placeholder:text-sm placeholder:tracking-normal"
              maxLength={6}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="btn-primary touch-target group w-full"
            >
              <span className="flex items-center justify-center gap-2">
                Join the Party
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </form>
        </div>

        {/* Host Your Own Card */}
        <button
          onClick={handleHostClick}
          className="action-card glass-card hover-lift group cursor-pointer p-6 text-left sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 transition-all group-hover:from-purple-500/40 group-hover:to-indigo-500/30">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="font-display text-xl text-white sm:text-2xl">Host Your Own</h2>
              <p className="text-sm text-slate-400">Create custom award ceremonies</p>
            </div>
          </div>

          <p className="mb-6 text-slate-300">
            Set up your own award categories, invite friends with a simple code, and reveal winners with style.
          </p>

          <div className="flex items-center gap-2 font-display text-gold-400 transition-all group-hover:gap-3">
            <span>{isAuthenticated ? "Go to Dashboard" : "Get Started Free"}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      {/* How It Works Section */}
      <div
        ref={howItWorksSection.ref}
        className={`mb-20 sm:mb-28 ${howItWorksSection.isInView ? "section-visible" : "section-hidden"}`}
      >
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-gold-400">
            How it works
          </span>
          <h2 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">
            Four Simple Steps
          </h2>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connection line - hidden on mobile */}
          <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent lg:block" />

          {howItWorksSteps.map((item, index) => (
            <div
              key={item.step}
              className="step-card group relative"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="glass-card h-full p-6 transition-all hover:border-gold-500/30">
                {/* Step number */}
                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-amber-500 font-display text-lg font-bold text-navy-950 shadow-lg shadow-gold-500/25 transition-transform group-hover:scale-110">
                  {item.step}
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-gold-400" />
                  <h3 className="font-display text-lg text-white">{item.title}</h3>
                </div>

                <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div
        ref={featuresSection.ref}
        className={`mb-20 sm:mb-28 ${featuresSection.isInView ? "section-visible" : "section-hidden"}`}
      >
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-gold-400">
            Why Petty Honors
          </span>
          <h2 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">
            Made for Real Friendships
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="glass-card h-full p-6 transition-all hover:border-gold-500/20 sm:p-8">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="mb-3 font-display text-xl text-white">{feature.title}</h3>
                <p className="leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Awards Section */}
      <div className="mb-20 sm:mb-28">
        <div className="glass-card overflow-hidden p-8 sm:p-12">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-gold-400">
              Award Ideas
            </span>
            <h2 className="font-display text-2xl text-white sm:text-3xl">
              Get Inspired
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              "🎭 Most Dramatic Exit",
              "⏰ Fashionably Late Champion",
              "🍕 Food Snob of the Year",
              "📱 Most Likely to Ghost",
              "🎤 Main Character Energy",
              "😴 Sleepiest Party Guest",
              "🔥 Hottest Take Award",
              "📸 Instagram vs Reality",
              "🎯 Biggest Overthinker",
              "💅 Most Chaotic Good",
            ].map((award, index) => (
              <span
                key={award}
                className="award-tag inline-block rounded-full border border-navy-600 bg-navy-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:border-gold-500/30 hover:bg-gold-500/10 hover:text-gold-400"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {award}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div
        ref={ctaSection.ref}
        className={`text-center ${ctaSection.isInView ? "section-visible" : "section-hidden"}`}
      >
        <div className="glass-card-highlight relative overflow-hidden p-8 sm:p-12 md:p-16">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold-500/30 to-amber-500/20">
              <Trophy className="h-10 w-10 text-gold-400" />
            </div>

            <h2 className="mb-4 font-display text-3xl text-white sm:text-4xl md:text-5xl">
              Ready to Honor Your Friends?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-slate-400">
              Start your first award ceremony in minutes. No credit card required, free forever.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={handleHostClick} className="btn-primary touch-target group px-8">
                <span className="flex items-center gap-2">
                  Create Your First Ceremony
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                </span>
              </button>
            </div>
          </div>
        </div>
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
