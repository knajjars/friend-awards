import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface VotingPageProps {
  shareCode: string;
  onBack: () => void;
}

export function VotingPage({ shareCode, onBack }: VotingPageProps) {
  const [voterName, setVoterName] = useState("");
  const [currentAwardIndex, setCurrentAwardIndex] = useState(0);
  const [hasSetName, setHasSetName] = useState(false);
  const [votedAwards, setVotedAwards] = useState<Set<string>>(new Set());

  const lobby = useQuery(api.lobbies.getLobbyByShareCode, { shareCode });
  const friends = useQuery(api.friends.getFriends, lobby ? { lobbyId: lobby._id } : "skip") || [];
  const awards = useQuery(api.awards.getAwards, lobby ? { lobbyId: lobby._id } : "skip") || [];
  
  const castVote = useMutation(api.votes.castVote);

  // Load voter name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(`voter-name-${shareCode}`);
    if (savedName) {
      setVoterName(savedName);
      setHasSetName(true);
    }
  }, [shareCode]);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim()) return;
    
    localStorage.setItem(`voter-name-${shareCode}`, voterName.trim());
    setHasSetName(true);
  };

  const handleVote = async (friendId: string) => {
    if (!lobby || !hasSetName) return;

    const currentAward = awards[currentAwardIndex];
    if (!currentAward) return;

    try {
      await castVote({
        lobbyId: lobby._id,
        awardId: currentAward._id,
        friendId: friendId as any,
        voterName: voterName.trim(),
      });
      
      setVotedAwards(prev => new Set([...prev, currentAward._id]));
      toast.success("Vote cast!");
      
      // Move to next award
      if (currentAwardIndex < awards.length - 1) {
        setTimeout(() => setCurrentAwardIndex(currentAwardIndex + 1), 300);
      }
    } catch (error) {
      toast.error("Failed to cast vote");
    }
  };

  // Error/Loading States
  if (!lobby) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="font-display text-2xl font-semibold text-white mb-3">Lobby Not Found</h2>
          <p className="text-slate-400 mb-6">
            The lobby code "{shareCode}" doesn't exist or has expired.
          </p>
          <button onClick={onBack} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!lobby.isVotingOpen) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card p-8 text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">{lobby.name}</h2>
          <p className="text-slate-400 mb-6">
            {lobby.isPresentationMode 
              ? "This lobby is revealing winners! Check back later for the next round."
              : "Voting hasn't started yet. The host will open voting soon!"
            }
          </p>
          <button onClick={onBack} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Name Entry
  if (!hasSetName) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card-highlight p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="font-display text-2xl font-semibold text-white mb-1">{lobby.name}</h2>
            <p className="text-slate-400">Welcome! Let's get you set up.</p>
          </div>
          
          <form onSubmit={handleSetName} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What's your name?
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="input-field text-center text-lg"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!voterName.trim()}
              className="btn-primary w-full text-lg"
            >
              Start Voting
            </button>
          </form>
        </div>
      </div>
    );
  }

  // No Awards
  if (awards.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">{lobby.name}</h2>
          <p className="text-slate-400 mb-6">No awards have been set up yet!</p>
          <button onClick={onBack} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentAward = awards[currentAwardIndex];
  const isLastAward = currentAwardIndex === awards.length - 1;
  const isComplete = currentAwardIndex >= awards.length;
  const hasVotedCurrent = votedAwards.has(currentAward?._id);

  // Completion Screen
  if (isComplete) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card-highlight p-8 text-center">
          <div className="text-7xl mb-4 trophy-animate">🎉</div>
          <h2 className="font-display text-3xl font-bold text-white mb-3">All Done!</h2>
          <p className="text-slate-300 mb-2">
            Thanks for voting, <span className="text-gold-400 font-medium">{voterName}</span>!
          </p>
          <p className="text-slate-400 mb-8">
            The host will reveal the results soon.
          </p>
          <button onClick={onBack} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-slate-400">
            Award <span className="text-white font-semibold">{currentAwardIndex + 1}</span> of {awards.length}
          </span>
          <span className="text-gold-400 font-medium">{voterName}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentAwardIndex + 1) / awards.length) * 100}%` }}
          />
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {awards.map((award, i) => (
            <button
              key={award._id}
              onClick={() => setCurrentAwardIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentAwardIndex 
                  ? 'bg-gold-400 scale-125' 
                  : votedAwards.has(award._id)
                  ? 'bg-emerald-500'
                  : 'bg-navy-600 hover:bg-navy-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Award Card */}
      <div className="glass-card-highlight p-8 text-center mb-6">
        <div className="text-5xl mb-6 trophy-animate">🏆</div>
        
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-8 leading-tight">
          {currentAward.question}
        </h2>
        
        {/* Friend Options */}
        <div className="grid gap-3">
          {friends.map((friend) => (
            <button
              key={friend._id}
              onClick={() => handleVote(friend._id)}
              disabled={hasVotedCurrent}
              className={`w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 flex items-center justify-center gap-3 group ${
                hasVotedCurrent
                  ? 'bg-navy-800/50 text-slate-500 cursor-not-allowed'
                  : 'bg-navy-800/80 text-slate-200 hover:bg-gradient-to-r hover:from-gold-500/20 hover:to-amber-500/20 hover:text-white border border-navy-600 hover:border-gold-400/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-500/10'
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 flex items-center justify-center flex-shrink-0 group-hover:from-gold-500/50 group-hover:to-amber-500/50 transition-all">
                {friend.imageUrl ? (
                  <img 
                    src={friend.imageUrl} 
                    alt={friend.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gold-400 font-semibold text-sm">
                    {friend.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <span>{friend.name}</span>
            </button>
          ))}
        </div>
        
        {hasVotedCurrent && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Vote recorded!</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={() => setCurrentAwardIndex(Math.max(0, currentAwardIndex - 1))}
          disabled={currentAwardIndex === 0}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        <button
          onClick={() => setCurrentAwardIndex(Math.min(awards.length, currentAwardIndex + 1))}
          className="btn-primary flex items-center gap-2"
        >
          {isLastAward ? 'Finish' : 'Next'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
