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
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#ffffff"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#ffffff"],
        });
      }, 250);

      return () => clearInterval(interval);
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
  const winner = awardResults[0];

  return (
    <div className="presentation-mode relative flex min-h-screen flex-col overflow-hidden bg-navy-950 text-white safe-area-inset">
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
        <button onClick={handleExit} className="btn-ghost flex items-center gap-1.5 px-2.5 py-2 text-sm sm:gap-2 sm:px-4 sm:text-base">
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
              <div className="mb-4 text-5xl sm:mb-6 sm:text-7xl md:text-8xl">🎉</div>

              <h2 className="mb-3 font-display text-xl text-slate-300 sm:mb-4 sm:text-3xl md:text-4xl">
                {currentAward.question}
              </h2>

              {winner ? (
                <div className="space-y-4 sm:space-y-8">
                  {/* Winner Name */}
                  <div className="relative inline-block">
                    <div className="text-gold-gradient py-2 font-display text-4xl sm:py-4 sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
                      {winner.friendName}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 -z-10 bg-gold-400/20 blur-3xl" />
                  </div>

                  {/* Vote count */}
                  <div className="flex items-center justify-center gap-2 text-lg text-slate-300 sm:gap-3 sm:text-2xl md:text-3xl">
                    <Star className="h-5 w-5 fill-current text-gold-400 sm:h-6 sm:w-6" />
                    <span>
                      <span className="font-semibold text-white">{winner.votes}</span> vote
                      {winner.votes !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Runner-ups */}
                  {awardResults.length > 1 && (
                    <div className="mt-6 border-t border-navy-700/50 pt-6 sm:mt-12 sm:pt-8">
                      <div className="mb-3 text-xs uppercase tracking-wider text-slate-500 sm:mb-4 sm:text-sm">
                        Runner-ups
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                        {awardResults.slice(1, 3).map((result, index) => (
                          <div
                            key={result.friendId}
                            className="rounded-lg border border-navy-700/50 bg-navy-800/50 px-3 py-2 text-sm backdrop-blur sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
                          >
                            <span className="mr-1.5 text-slate-400 sm:mr-2">#{index + 2}</span>
                            <span className="font-medium text-white">{result.friendName}</span>
                            <span className="ml-1.5 text-slate-500 sm:ml-2">({result.votes})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-light text-slate-500 sm:text-3xl md:text-4xl">No votes yet!</div>
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
                    : "bg-navy-600 active:bg-navy-500 sm:hover:bg-navy-500"
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
