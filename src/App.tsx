import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { LobbyDashboard } from "./components/LobbyDashboard";
import { VotingPage } from "./components/VotingPage";
import { PresentationMode } from "./components/PresentationMode";

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

export default function App() {
  const [shareCode, setShareCode] = useState("");
  const [currentView, setCurrentView] = useState<"home" | "voting" | "presentation">("home");
  const [lobbyId, setLobbyId] = useState<string>("");

  const handleJoinLobby = (code: string) => {
    setShareCode(code);
    setCurrentView("voting");
  };

  const handleViewPresentation = (id: string) => {
    setLobbyId(id);
    setCurrentView("presentation");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setShareCode("");
    setLobbyId("");
  };

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
          <button 
            onClick={handleBackToHome}
            className="flex items-center gap-3 group"
          >
            <span className="text-2xl trophy-animate">🏆</span>
            <span className="font-display text-xl font-semibold text-gold-gradient tracking-tight">
              Friend Awards
            </span>
          </button>
          <SignOutButton />
        </div>
      </header>
      
      <main className="flex-1 relative z-10 px-4 py-8">
        {currentView === "home" && (
          <Content onJoinLobby={handleJoinLobby} onViewPresentation={handleViewPresentation} />
        )}
        {currentView === "voting" && shareCode && (
          <VotingPage shareCode={shareCode} onBack={handleBackToHome} />
        )}
        {currentView === "presentation" && lobbyId && (
          <PresentationMode lobbyId={lobbyId} onBack={handleBackToHome} />
        )}
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

function Content({ onJoinLobby, onViewPresentation }: { 
  onJoinLobby: (code: string) => void;
  onViewPresentation: (id: string) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [joinCode, setJoinCode] = useState("");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinLobby(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          New Year's Edition
        </div>
        
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold mb-4 leading-tight">
          <span className="text-white">The</span>{" "}
          <span className="text-gold-gradient">Friend Awards</span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
          Vote on hilarious awards with your friends. 
          Celebrate the moments that made you laugh, cringe, and everything in between.
        </p>
      </div>

      {/* Join Lobby Card */}
      <div className="glass-card-highlight p-8 mb-10 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
            <span className="text-xl">🎫</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-white">Join a Lobby</h2>
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

      <Authenticated>
        <LobbyDashboard onViewPresentation={onViewPresentation} />
      </Authenticated>

      <Unauthenticated>
        <div className="glass-card p-8 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Host Your Own</h2>
              <p className="text-sm text-slate-400">Create and manage award ceremonies</p>
            </div>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
