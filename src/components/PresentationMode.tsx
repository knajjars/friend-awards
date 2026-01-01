import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface PresentationModeProps {
  lobbyId: string;
  isHost?: boolean; // If true, shows "Exit" button to host dashboard. Defaults to true.
  onBack?: () => void; // Deprecated: use React Router navigation instead
}

export function PresentationMode({ lobbyId, isHost = true }: PresentationModeProps) {
  const navigate = useNavigate();

  const lobby = useQuery(api.lobbies.getLobby, { lobbyId: lobbyId as Id<"lobbies"> });
  const voteResults = useQuery(api.votes.getVoteResults, { lobbyId: lobbyId as Id<"lobbies"> });
  const finishPresentation = useMutation(api.lobbies.finishPresentation);

  // Local state for slide navigation - each user controls their own view
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasFinishedRef = useRef(false);

  const awards = voteResults?.awards || [];

  // Calculate total slides: 2 per award (question + result)
  const totalSlides = awards.length * 2;
  const currentAwardIndex = Math.floor(currentSlide / 2);
  const isResultSlide = currentSlide % 2 === 1;
  const isLastSlide = currentSlide === totalSlides - 1;

  // When host reaches the last slide, mark presentation as finished
  useEffect(() => {
    if (isHost && isLastSlide && totalSlides > 0 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      console.log("Finishing presentation");
      finishPresentation({ lobbyId: lobbyId as Id<"lobbies"> });
    }
  }, [isHost, isLastSlide, totalSlides, lobbyId, finishPresentation]);

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

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleExit = () => {
    if (isHost) {
      navigate("/host");
    } else {
      navigate(-1); // Go back to previous page (voting page)
    }
  };

  // Keyboard navigation - available for everyone
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
    <div className="presentation-mode relative flex min-h-[100dvh] flex-col overflow-hidden bg-navy-950 text-white">
      {/* Animated background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-48 w-48 animate-pulse-slow rounded-full bg-gold-500/10 blur-3xl sm:h-72 sm:w-72 md:h-96 md:w-96" />
        <div
          className="absolute bottom-0 right-1/4 h-48 w-48 animate-pulse-slow rounded-full bg-amber-500/10 blur-3xl sm:h-72 sm:w-72 md:h-96 md:w-96"
          style={{ animationDelay: "2s" }}
        />

        {/* Star particles - fewer on mobile */}
        {[...Array(12)].map((_, i) => (
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
      <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
        <button
          onClick={handleExit}
          className="btn-ghost flex items-center gap-1.5 px-2 py-1.5 text-sm sm:gap-2 sm:px-3 sm:py-2 sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{isHost ? "Exit" : "Back"}</span>
        </button>

        <h1 className="text-gold-gradient absolute left-1/2 hidden -translate-x-1/2 font-display text-base font-bold sm:block sm:text-lg md:text-xl lg:text-2xl">
          {lobby.name}
        </h1>

        <div className="rounded-full border border-navy-700 bg-navy-800/80 px-2.5 py-1 text-xs backdrop-blur sm:px-3 sm:py-1.5 sm:text-sm">
          <span className="font-semibold text-gold-400">{currentSlide + 1}</span>
          <span className="text-slate-400"> / {totalSlides}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-2 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <div className="w-full max-w-4xl text-center">
          {!isResultSlide ? (
            // Question Slide
            <div className="slide-content animate-in fade-in slide-in-from-bottom-4 space-y-3 duration-700 ease-out sm:space-y-6">
              <div className="trophy-animate text-5xl sm:text-7xl md:text-8xl lg:text-9xl">🏆</div>
              <h2 className="font-display text-2xl leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {currentAward.question}
              </h2>
              <div className="pt-2 text-base font-light text-slate-400 sm:pt-4 sm:text-xl md:text-2xl">
                And the winner is...
              </div>

              {/* Dramatic pause indicator */}
              <div className="flex justify-center gap-1.5 pt-2 sm:gap-2 sm:pt-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-gold-400 sm:h-2.5 sm:w-2.5"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Result Slide
            <div className="slide-content animate-in fade-in zoom-in space-y-3 duration-700 ease-out sm:space-y-4">
              <h2 className="font-display text-base text-slate-300 sm:text-xl md:text-2xl">
                {currentAward.question}
              </h2>

              {hasWinner ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Tie indicator */}
                  {isTie && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 sm:px-4 sm:py-2 sm:text-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 sm:h-2 sm:w-2" />
                      It's a {winners.length}-way tie!
                    </div>
                  )}

                  {/* Winner Avatar(s) + Name(s) */}
                  <div className="relative">
                    {isTie ? (
                      // Multiple winners - show avatars in a row
                      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
                        {winners.map((winner, index) => (
                          <div
                            key={winner.friendId}
                            className="flex flex-col items-center gap-2 sm:gap-3"
                            style={{ animationDelay: `${index * 0.15}s` }}
                          >
                            {/* Winner Avatar */}
                            <div className="relative">
                              {winner.friendImageUrl ? (
                                <img
                                  src={winner.friendImageUrl}
                                  alt={winner.friendName}
                                  className="h-20 w-20 rounded-full object-cover ring-[3px] ring-gold-400/50 sm:h-28 sm:w-28 sm:ring-4 md:h-36 md:w-36 md:ring-[5px]"
                                />
                              ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/40 to-amber-500/40 ring-[3px] ring-gold-400/50 sm:h-28 sm:w-28 sm:ring-4 md:h-36 md:w-36 md:ring-[5px]">
                                  <span className="font-display text-2xl text-gold-400 sm:text-4xl md:text-5xl">
                                    {winner.friendName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {/* Glow effect behind avatar */}
                              <div className="absolute inset-0 -z-10 rounded-full bg-gold-400/30 blur-xl sm:blur-2xl" />
                            </div>
                            {/* Winner Name */}
                            <div className="text-gold-gradient font-display text-lg sm:text-2xl md:text-3xl">
                              {winner.friendName}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Single winner - BIG avatar
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        {/* Winner Avatar */}
                        <div className="relative">
                          {winners[0].friendImageUrl ? (
                            <img
                              src={winners[0].friendImageUrl}
                              alt={winners[0].friendName}
                              className="h-32 w-32 rounded-full object-cover ring-4 ring-gold-400/50 sm:h-44 sm:w-44 sm:ring-[5px] md:h-56 md:w-56 md:ring-[6px] lg:h-64 lg:w-64 lg:ring-8"
                            />
                          ) : (
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/40 to-amber-500/40 ring-4 ring-gold-400/50 sm:h-44 sm:w-44 sm:ring-[5px] md:h-56 md:w-56 md:ring-[6px] lg:h-64 lg:w-64 lg:ring-8">
                              <span className="font-display text-4xl text-gold-400 sm:text-5xl md:text-6xl lg:text-7xl">
                                {winners[0].friendName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Glow effect behind avatar */}
                          <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-gold-400/30 blur-2xl sm:blur-3xl" />
                        </div>
                        {/* Winner Name */}
                        <div className="text-gold-gradient font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
                          {winners[0].friendName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote count */}
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-300 sm:text-base md:text-lg">
                    <Star className="h-4 w-4 fill-current text-gold-400 sm:h-5 sm:w-5" />
                    <span>
                      <span className="font-semibold text-white">{topVoteCount}</span> vote
                      {topVoteCount !== 1 ? "s" : ""} {isTie && "each"}
                    </span>
                  </div>

                  {/* Runner-ups (only show if there are people with fewer votes) */}
                  {runnerUps.length > 0 && (
                    <div className="mt-3 border-t border-navy-700/50 pt-3 sm:mt-6 sm:pt-4">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500 sm:mb-3 sm:text-xs">
                        Runner-ups
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {runnerUps.slice(0, 3).map((result, index) => (
                          <div
                            key={result.friendId}
                            className="rounded-lg border border-navy-700/50 bg-navy-800/50 px-2.5 py-1.5 text-xs backdrop-blur sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
                          >
                            <span className="mr-1 text-slate-400 sm:mr-1.5">
                              #{index + winners.length + 1}
                            </span>
                            <span className="font-medium text-white">{result.friendName}</span>
                            <span className="ml-1 text-slate-500 sm:ml-1.5">({result.votes})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-lg font-light text-slate-500 sm:text-2xl md:text-3xl">
                  No votes yet!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation - fixed at bottom */}
      <div className="relative z-10 flex flex-shrink-0 flex-col gap-2 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
        {/* Progress dots - wrapped into rows */}
        {totalSlides <= 20 ? (
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {[...Array(totalSlides)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 w-2 flex-shrink-0 rounded-full transition-all duration-300 sm:h-2.5 sm:w-2.5 ${
                  i === currentSlide
                    ? "scale-125 bg-gold-400"
                    : i < currentSlide
                      ? "bg-gold-400/50"
                      : "active:bg-navy-500 sm:hover:bg-navy-500 bg-navy-600"
                }`}
              />
            ))}
          </div>
        ) : (
          /* Compact progress bar for many slides */
          <div className="mx-auto w-full max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-navy-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="btn-secondary flex h-10 items-center gap-1 px-3 text-sm sm:h-11 sm:gap-1.5 sm:px-4 sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentSlide >= totalSlides - 1}
            className="btn-primary flex h-10 items-center gap-1 px-3 text-sm sm:h-11 sm:gap-1.5 sm:px-4 sm:text-base"
          >
            <span className="hidden xs:inline">
              {currentSlide >= totalSlides - 1 ? "Done" : "Next"}
            </span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Keyboard hints - desktop only */}
      <div className="absolute bottom-16 left-1/2 hidden -translate-x-1/2 text-[10px] text-slate-600 lg:bottom-20 lg:block lg:text-xs">
        Use <kbd className="rounded border border-navy-700 bg-navy-800 px-1 py-0.5">←</kbd>{" "}
        <kbd className="rounded border border-navy-700 bg-navy-800 px-1 py-0.5">→</kbd> or{" "}
        <kbd className="rounded border border-navy-700 bg-navy-800 px-1 py-0.5">Space</kbd> to
        navigate
      </div>
    </div>
  );
}
