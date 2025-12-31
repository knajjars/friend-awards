import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface PresentationModeProps {
  lobbyId: string;
  onBack?: () => void; // Deprecated: use React Router navigation instead
}

export function PresentationMode({ lobbyId }: PresentationModeProps) {
  const navigate = useNavigate();

  const lobby = useQuery(api.lobbies.getLobby, { lobbyId: lobbyId as Id<"lobbies"> });
  const voteResults = useQuery(api.votes.getVoteResults, { lobbyId: lobbyId as Id<"lobbies"> });
  const updateSlide = useMutation(api.lobbies.updateSlide);

  const awards = voteResults?.awards || [];
  const currentSlide = lobby?.currentSlide || 0;

  // Calculate total slides: 2 per award (question + result)
  const totalSlides = awards.length * 2;
  const currentAwardIndex = Math.floor(currentSlide / 2);
  const isResultSlide = currentSlide % 2 === 1;

  useEffect(() => {
    if (isResultSlide) {
      const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#ffffff", "#fef3c7"];

      // Initial BIG burst from center
      const fireBurst = () => {
        // Center explosion
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors,
          startVelocity: 45,
          gravity: 0.8,
          ticks: 200,
          zIndex: 1000,
        });

        // Left cannon
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors,
          startVelocity: 55,
          gravity: 1,
          ticks: 200,
          zIndex: 1000,
        });

        // Right cannon
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors,
          startVelocity: 55,
          gravity: 1,
          ticks: 200,
          zIndex: 1000,
        });
      };

      // Fire initial burst immediately
      fireBurst();

      // Secondary burst after a short delay
      const secondBurst = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { x: 0.5, y: 0.4 },
          colors,
          startVelocity: 35,
          gravity: 0.9,
          ticks: 150,
          zIndex: 1000,
        });
      }, 300);

      // Continuous rain of confetti
      const duration = 4000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 30 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors,
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors,
        });
      }, 200);

      return () => {
        clearInterval(interval);
        clearTimeout(secondBurst);
      };
    }
  }, [isResultSlide, currentSlide]);

  const handleNext = async () => {
    if (currentSlide < totalSlides - 1) {
      await updateSlide({ lobbyId: lobbyId as Id<"lobbies">, slide: currentSlide + 1 });
    }
  };

  const handlePrevious = async () => {
    if (currentSlide > 0) {
      await updateSlide({ lobbyId: lobbyId as Id<"lobbies">, slide: currentSlide - 1 });
    }
  };

  const handleExit = () => {
    navigate("/host");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, totalSlides]);

  if (!lobby || !voteResults) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="spinner h-10 w-10" />
      </div>
    );
  }

  if (awards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
        <div className="glass-card max-w-md p-8 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h2 className="mb-2 font-display text-2xl font-semibold text-white">No Awards Yet</h2>
          <p className="mb-6 text-slate-400">Add some awards to start the presentation!</p>
          <Link to="/host" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentAward = awards[currentAwardIndex];
  const awardResults = voteResults.votesByAward[currentAward._id] || [];

  // Handle ties - find all people with the highest vote count
  const topVoteCount = awardResults[0]?.votes || 0;
  const winners = awardResults.filter((r) => r.votes === topVoteCount && r.votes > 0);
  const isTie = winners.length > 1;
  const hasWinner = winners.length > 0;

  // Runner-ups are people who are not in the winners list
  const runnerUps = awardResults.filter((r) => r.votes < topVoteCount && r.votes > 0);

  return (
    <div className="presentation-mode safe-area-inset relative flex min-h-screen flex-col overflow-hidden bg-navy-950 text-white">
      {/* Animated background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-64 w-64 animate-pulse-slow rounded-full bg-gold-500/10 blur-3xl sm:h-96 sm:w-96" />
        <div
          className="absolute bottom-0 right-1/4 h-64 w-64 animate-pulse-slow rounded-full bg-amber-500/10 blur-3xl sm:h-96 sm:w-96"
          style={{ animationDelay: "2s" }}
        />

        {/* Star particles - fewer on mobile */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 animate-sparkle rounded-full bg-gold-400 opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 md:p-6">
        <button
          onClick={handleExit}
          className="btn-ghost flex items-center gap-1.5 px-2.5 py-2 text-sm sm:gap-2 sm:px-4 sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Exit</span>
        </button>

        <h1 className="text-gold-gradient hidden font-display text-lg font-bold sm:block sm:text-xl md:text-2xl">
          {lobby.name}
        </h1>

        <div className="rounded-full border border-navy-700 bg-navy-800/80 px-3 py-1.5 text-xs backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
          <span className="font-semibold text-gold-400">{currentSlide + 1}</span>
          <span className="text-slate-400"> / {totalSlides}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl text-center">
          {!isResultSlide ? (
            // Question Slide
            <div className="slide-content animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700 ease-out sm:space-y-8">
              <div className="trophy-animate mb-4 text-6xl sm:mb-8 sm:text-8xl md:text-9xl">🏆</div>
              <h2 className="mb-4 font-display text-3xl leading-tight text-white sm:mb-8 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                {currentAward.question}
              </h2>
              <div className="text-lg font-light text-slate-400 sm:text-2xl md:text-3xl">
                And the winner is...
              </div>

              {/* Dramatic pause indicator */}
              <div className="mt-4 flex justify-center gap-1.5 sm:mt-8 sm:gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-gold-400 sm:h-3 sm:w-3"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Result Slide
            <div className="slide-content animate-in fade-in zoom-in space-y-4 duration-700 ease-out sm:space-y-6">
              <h2 className="mb-2 font-display text-xl text-slate-300 sm:mb-4 sm:text-2xl md:text-3xl">
                {currentAward.question}
              </h2>

              {hasWinner ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Tie indicator */}
                  {isTie && (
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 sm:text-base">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                      It's a {winners.length}-way tie!
                    </div>
                  )}

                  {/* Winner Avatar(s) + Name(s) */}
                  <div className="relative">
                    {isTie ? (
                      // Multiple winners - show avatars in a row
                      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                        {winners.map((winner, index) => (
                          <div
                            key={winner.friendId}
                            className="flex flex-col items-center gap-3 sm:gap-4"
                            style={{ animationDelay: `${index * 0.15}s` }}
                          >
                            {/* Winner Avatar */}
                            <div className="relative">
                              {winner.friendImageUrl ? (
                                <img
                                  src={winner.friendImageUrl}
                                  alt={winner.friendName}
                                  className="h-28 w-28 rounded-full object-cover ring-4 ring-gold-400/50 sm:h-40 sm:w-40 sm:ring-[6px] md:h-48 md:w-48"
                                />
                              ) : (
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/40 to-amber-500/40 ring-4 ring-gold-400/50 sm:h-40 sm:w-40 sm:ring-[6px] md:h-48 md:w-48">
                                  <span className="font-display text-4xl text-gold-400 sm:text-5xl md:text-6xl">
                                    {winner.friendName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {/* Glow effect behind avatar */}
                              <div className="absolute inset-0 -z-10 rounded-full bg-gold-400/30 blur-2xl" />
                            </div>
                            {/* Winner Name */}
                            <div className="text-gold-gradient font-display text-2xl sm:text-3xl md:text-4xl">
                              {winner.friendName}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Single winner - BIG avatar
                      <div className="flex flex-col items-center gap-4 sm:gap-6">
                        {/* Winner Avatar */}
                        <div className="relative">
                          {winners[0].friendImageUrl ? (
                            <img
                              src={winners[0].friendImageUrl}
                              alt={winners[0].friendName}
                              className="h-40 w-40 rounded-full object-cover ring-4 ring-gold-400/50 sm:h-56 sm:w-56 sm:ring-[6px] md:h-72 md:w-72 md:ring-8 lg:h-80 lg:w-80"
                            />
                          ) : (
                            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/40 to-amber-500/40 ring-4 ring-gold-400/50 sm:h-56 sm:w-56 sm:ring-[6px] md:h-72 md:w-72 md:ring-8 lg:h-80 lg:w-80">
                              <span className="font-display text-5xl text-gold-400 sm:text-6xl md:text-7xl lg:text-8xl">
                                {winners[0].friendName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Glow effect behind avatar */}
                          <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-gold-400/30 blur-3xl" />
                        </div>
                        {/* Winner Name */}
                        <div className="text-gold-gradient py-2 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                          {winners[0].friendName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote count */}
                  <div className="flex items-center justify-center gap-2 text-lg text-slate-300 sm:gap-3 sm:text-xl md:text-2xl">
                    <Star className="h-5 w-5 fill-current text-gold-400 sm:h-6 sm:w-6" />
                    <span>
                      <span className="font-semibold text-white">{topVoteCount}</span> vote
                      {topVoteCount !== 1 ? "s" : ""} {isTie && "each"}
                    </span>
                  </div>

                  {/* Runner-ups (only show if there are people with fewer votes) */}
                  {runnerUps.length > 0 && (
                    <div className="mt-6 border-t border-navy-700/50 pt-6 sm:mt-12 sm:pt-8">
                      <div className="mb-3 text-xs uppercase tracking-wider text-slate-500 sm:mb-4 sm:text-sm">
                        Runner-ups
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                        {runnerUps.slice(0, 3).map((result, index) => (
                          <div
                            key={result.friendId}
                            className="rounded-lg border border-navy-700/50 bg-navy-800/50 px-3 py-2 text-sm backdrop-blur sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
                          >
                            <span className="mr-1.5 text-slate-400 sm:mr-2">
                              #{index + winners.length + 1}
                            </span>
                            <span className="font-medium text-white">{result.friendName}</span>
                            <span className="ml-1.5 text-slate-500 sm:ml-2">({result.votes})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-light text-slate-500 sm:text-3xl md:text-4xl">
                  No votes yet!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation - fixed at bottom */}
      <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:gap-4 sm:p-4 md:p-6">
        <button
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="btn-secondary flex h-11 items-center gap-1.5 px-3 sm:h-auto sm:gap-2 sm:px-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress dots - scrollable */}
        <div className="custom-scrollbar flex max-w-[40vw] gap-1.5 overflow-x-auto px-2 sm:max-w-xs sm:gap-2 sm:px-4">
          {[...Array(totalSlides)].map((_, i) => (
            <button
              key={i}
              onClick={async () => {
                await updateSlide({ lobbyId: lobbyId as Id<"lobbies">, slide: i });
              }}
              className={`h-3 w-3 flex-shrink-0 rounded-full transition-all duration-300 sm:h-2.5 sm:w-2.5 ${
                i === currentSlide
                  ? "scale-110 bg-gold-400 sm:scale-125"
                  : i < currentSlide
                    ? "bg-gold-400/50"
                    : "active:bg-navy-500 sm:hover:bg-navy-500 bg-navy-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlide >= totalSlides - 1}
          className="btn-primary flex h-11 items-center gap-1.5 px-3 sm:h-auto sm:gap-2 sm:px-4"
        >
          <span className="hidden sm:inline">
            {currentSlide >= totalSlides - 1 ? "Finished" : "Next"}
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Keyboard hints - desktop only */}
      <div className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 text-xs text-slate-600 lg:block">
        Use <kbd className="rounded border border-navy-700 bg-navy-800 px-1.5 py-0.5">←</kbd>{" "}
        <kbd className="rounded border border-navy-700 bg-navy-800 px-1.5 py-0.5">→</kbd> or{" "}
        <kbd className="rounded border border-navy-700 bg-navy-800 px-1.5 py-0.5">Space</kbd> to
        navigate
      </div>
    </div>
  );
}
