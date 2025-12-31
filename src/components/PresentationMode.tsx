import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import confetti from "canvas-confetti";

interface PresentationModeProps {
  lobbyId: string;
  onBack: () => void;
}

export function PresentationMode({ lobbyId, onBack }: PresentationModeProps) {

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
          colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff']
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, totalSlides]);

  if (!lobby || !voteResults) {
    return (
      <div className="min-h-screen bg-navy-950 flex justify-center items-center">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (awards.length === 0) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">No Awards Yet</h2>
          <p className="text-slate-400 mb-6">Add some awards to start the presentation!</p>
          <button onClick={onBack} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentAward = awards[currentAwardIndex];
  const awardResults = voteResults.votesByAward[currentAward._id] || [];
  const winner = awardResults[0];

  return (
    <div className="min-h-screen bg-navy-950 text-white relative overflow-hidden flex flex-col">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Star particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-30 animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6">
        <button
          onClick={onBack}
          className="btn-ghost flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Exit
        </button>
        
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gold-gradient hidden sm:block">
          {lobby.name}
        </h1>
        
        <div className="text-sm bg-navy-800/80 backdrop-blur px-4 py-2 rounded-full border border-navy-700">
          <span className="text-gold-400 font-semibold">{currentSlide + 1}</span>
          <span className="text-slate-400"> / {totalSlides}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-4xl w-full text-center">
          {!isResultSlide ? (
            // Question Slide
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-8xl sm:text-9xl mb-8 trophy-animate">🏆</div>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-none text-white">
                {currentAward.question}
              </h2>
              <div className="text-2xl sm:text-3xl text-slate-400 font-light">
                And the winner is...
              </div>
              
              {/* Dramatic pause indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-gold-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Result Slide
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="text-7xl sm:text-8xl mb-6">🎉</div>
              
              <h2 className="font-display text-3xl sm:text-4xl mb-4 text-slate-300">
                {currentAward.question}
              </h2>
              
              {winner ? (
                <div className="space-y-8">
                  {/* Winner Name */}
                  <div className="relative inline-block">
                    <div className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gold-gradient py-4">
                      {winner.friendName}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gold-400/20 blur-3xl -z-10" />
                  </div>
                  
                  {/* Vote count */}
                  <div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl text-slate-300">
                    <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>
                      <span className="text-white font-semibold">{winner.votes}</span>
                      {' '}vote{winner.votes !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Runner-ups */}
                  {awardResults.length > 1 && (
                    <div className="mt-12 pt-8 border-t border-navy-700/50">
                      <div className="text-sm uppercase tracking-wider text-slate-500 mb-4">Runner-ups</div>
                      <div className="flex flex-wrap justify-center gap-6">
                        {awardResults.slice(1, 3).map((result, index) => (
                          <div 
                            key={result.friendId} 
                            className="bg-navy-800/50 backdrop-blur px-6 py-3 rounded-xl border border-navy-700/50"
                          >
                            <span className="text-slate-400 mr-2">#{index + 2}</span>
                            <span className="text-white font-medium">{result.friendName}</span>
                            <span className="text-slate-500 ml-2">({result.votes})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl text-slate-500 font-light">
                  No votes yet!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6">
        <button
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress dots */}
        <div className="flex gap-2 max-w-xs overflow-x-auto px-4">
          {[...Array(totalSlides)].map((_, i) => (
            <button
              key={i}
              onClick={async () => {
                await updateSlide({ lobbyId: lobbyId as Id<"lobbies">, slide: i });
              }}
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300 ${
                i === currentSlide 
                  ? 'bg-gold-400 scale-125' 
                  : i < currentSlide 
                  ? 'bg-gold-400/50'
                  : 'bg-navy-600 hover:bg-navy-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlide >= totalSlides - 1}
          className="btn-primary flex items-center gap-2"
        >
          <span className="hidden sm:inline">
            {currentSlide >= totalSlides - 1 ? 'Finished' : 'Next'}
          </span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Keyboard hints */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-slate-600 hidden sm:block">
        Use <kbd className="px-1.5 py-0.5 bg-navy-800 rounded border border-navy-700">←</kbd>{' '}
        <kbd className="px-1.5 py-0.5 bg-navy-800 rounded border border-navy-700">→</kbd> or{' '}
        <kbd className="px-1.5 py-0.5 bg-navy-800 rounded border border-navy-700">Space</kbd> to navigate
      </div>
    </div>
  );
}
