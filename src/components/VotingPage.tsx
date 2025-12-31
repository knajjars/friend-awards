import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface VotingPageProps {
  shareCode: string;
  onBack?: () => void; // Deprecated: use React Router navigation instead
}

export function VotingPage({ shareCode }: VotingPageProps) {
  const navigate = useNavigate();
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

      setVotedAwards((prev) => new Set([...prev, currentAward._id]));
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
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card p-8 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="mb-3 font-display text-2xl font-semibold text-white">Lobby Not Found</h2>
          <p className="mb-6 text-slate-400">
            The lobby code "{shareCode}" doesn't exist or has expired.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!lobby.isVotingOpen) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card p-8 text-center">
          <div className="mb-4 animate-pulse text-6xl">⏳</div>
          <h2 className="mb-2 font-display text-2xl font-semibold text-white">{lobby.name}</h2>
          <p className="mb-6 text-slate-400">
            {lobby.isPresentationMode
              ? "This lobby is revealing winners! Check back later for the next round."
              : "Voting hasn't started yet. The host will open voting soon!"}
          </p>
          <Link to="/" className="btn-secondary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Name Entry
  if (!hasSetName) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card-highlight p-8">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">👋</div>
            <h2 className="mb-1 font-display text-2xl font-semibold text-white">{lobby.name}</h2>
            <p className="text-slate-400">Welcome! Let's get you set up.</p>
          </div>

          <form onSubmit={handleSetName} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
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
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card p-8 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h2 className="mb-2 font-display text-2xl font-semibold text-white">{lobby.name}</h2>
          <p className="mb-6 text-slate-400">No awards have been set up yet!</p>
          <Link to="/" className="btn-secondary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentAward = awards[currentAwardIndex];
  const isLastAward = currentAwardIndex === awards.length - 1;
  const isComplete = currentAwardIndex >= awards.length;
  const hasVotedCurrent = votedAwards.has(currentAward?._id);

  // Get nominees for current award (if specific nominees are set, use them; otherwise all friends)
  const nomineeIds = currentAward?.nomineeIds || [];
  const currentNominees =
    nomineeIds.length > 0 ? friends.filter((f) => nomineeIds.includes(f._id)) : friends;

  // Completion Screen
  if (isComplete) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card-highlight p-10 text-center sm:p-12">
          <div className="trophy-animate mb-6 text-8xl">🎉</div>
          <h2 className="mb-4 font-display text-4xl text-white sm:text-5xl">All Done!</h2>
          <p className="mb-2 text-xl text-slate-300">
            Thanks for voting, <span className="font-semibold text-gold-400">{voterName}</span>!
          </p>
          <p className="mb-10 text-lg text-slate-400">The host will reveal the results soon.</p>
          <Link to="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Award <span className="font-semibold text-white">{currentAwardIndex + 1}</span> of{" "}
            {awards.length}
          </span>
          <span className="font-medium text-gold-400">{voterName}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-navy-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${((currentAwardIndex + 1) / awards.length) * 100}%` }}
          />
        </div>

        {/* Progress Dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {awards.map((award, i) => (
            <button
              key={award._id}
              onClick={() => setCurrentAwardIndex(i)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === currentAwardIndex
                  ? "scale-125 bg-gold-400"
                  : votedAwards.has(award._id)
                    ? "bg-emerald-500"
                    : "hover:bg-navy-500 bg-navy-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Award Card */}
      <div className="glass-card-highlight mb-6 p-8 text-center sm:p-10">
        <div className="trophy-animate mb-6 text-6xl">🏆</div>

        <h2 className="mb-10 font-display text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
          {currentAward.question}
        </h2>

        {/* Nominee Options */}
        <div className="grid gap-3">
          {currentNominees.map((friend) => (
            <button
              key={friend._id}
              onClick={() => handleVote(friend._id)}
              disabled={hasVotedCurrent}
              className={`group flex w-full items-center justify-center gap-3 rounded-xl p-4 text-lg font-medium transition-all duration-300 ${
                hasVotedCurrent
                  ? "cursor-not-allowed bg-navy-800/50 text-slate-500"
                  : "border border-navy-600 bg-navy-800/80 text-slate-200 hover:scale-[1.02] hover:border-gold-400/30 hover:bg-gradient-to-r hover:from-gold-500/20 hover:to-amber-500/20 hover:text-white hover:shadow-lg hover:shadow-gold-500/10"
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 transition-all group-hover:from-gold-500/50 group-hover:to-amber-500/50">
                {friend.imageUrl ? (
                  <img
                    src={friend.imageUrl}
                    alt={friend.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gold-400">
                    {friend.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <span>{friend.name}</span>
            </button>
          ))}
        </div>

        {currentNominees.length === 0 && (
          <p className="py-4 text-slate-500">No nominees assigned for this award.</p>
        )}

        {hasVotedCurrent && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400">
            <Check className="h-5 w-5" />
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
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          onClick={() => setCurrentAwardIndex(Math.min(awards.length, currentAwardIndex + 1))}
          className="btn-primary flex items-center gap-2"
        >
          {isLastAward ? "Finish" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
