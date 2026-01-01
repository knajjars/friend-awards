import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PresentationMode } from "./PresentationMode";

interface VotingPageProps {
  shareCode: string;
  onBack?: () => void; // Deprecated: use React Router navigation instead
}

export function VotingPage({ shareCode }: VotingPageProps) {
  const navigate = useNavigate();
  const [voterId, setVoterId] = useState<string | null>(null);
  const [voterName, setVoterName] = useState("");
  const [currentAwardIndex, setCurrentAwardIndex] = useState(0);
  const [hasSelectedIdentity, setHasSelectedIdentity] = useState(false);
  const [votedAwards, setVotedAwards] = useState<Set<string>>(new Set());
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // awardId -> friendId
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(true);

  const lobby = useQuery(api.lobbies.getLobbyByShareCode, { shareCode });
  const friendsQuery = useQuery(api.friends.getFriends, lobby ? { lobbyId: lobby._id } : "skip");
  const awardsQuery = useQuery(api.awards.getAwards, lobby ? { lobbyId: lobby._id } : "skip");
  const votersWhoVoted = useQuery(
    api.votes.getVotersWhoVoted,
    lobby ? { lobbyId: lobby._id } : "skip"
  );

  const friends = friendsQuery || [];
  const awards = awardsQuery || [];
  const votedVoterNames = new Set(votersWhoVoted || []);

  // Check if data is still loading
  const isLoading =
    lobby === undefined || (lobby && (friendsQuery === undefined || awardsQuery === undefined));

  const castVote = useMutation(api.votes.castVote);

  // Load voter identity from localStorage
  useEffect(() => {
    const savedVoterId = localStorage.getItem(`voter-id-${shareCode}`);
    const savedVoterName = localStorage.getItem(`voter-name-${shareCode}`);
    if (savedVoterId && savedVoterName) {
      setVoterId(savedVoterId);
      setVoterName(savedVoterName);
      setHasSelectedIdentity(true);
    }
    setIsCheckingIdentity(false);
  }, [shareCode]);

  // Verify that saved voter is still in the friends list
  useEffect(() => {
    if (hasSelectedIdentity && voterId && friends.length > 0) {
      const voterStillExists = friends.some((f) => f._id === voterId);
      if (!voterStillExists) {
        // Clear saved identity if friend was removed
        localStorage.removeItem(`voter-id-${shareCode}`);
        localStorage.removeItem(`voter-name-${shareCode}`);
        setVoterId(null);
        setVoterName("");
        setHasSelectedIdentity(false);
      }
    }
  }, [hasSelectedIdentity, voterId, friends, shareCode]);

  const handleSelectIdentity = (friendId: string, friendName: string) => {
    localStorage.setItem(`voter-id-${shareCode}`, friendId);
    localStorage.setItem(`voter-name-${shareCode}`, friendName);
    setVoterId(friendId);
    setVoterName(friendName);
    setHasSelectedIdentity(true);
  };

  const handleVote = async (friendId: string) => {
    if (!lobby || !hasSelectedIdentity) return;

    const currentAward = awards[currentAwardIndex];
    if (!currentAward) return;

    // Optimistic UI: update state immediately
    const previousVotedAwards = new Set(votedAwards);
    const previousSelectedVotes = { ...selectedVotes };
    const previousIndex = currentAwardIndex;

    setVotedAwards((prev) => new Set([...prev, currentAward._id]));
    setSelectedVotes((prev) => ({ ...prev, [currentAward._id]: friendId }));

    // Move to next award after 1 second to show selection
    if (currentAwardIndex < awards.length - 1) {
      setTimeout(() => setCurrentAwardIndex(currentAwardIndex + 1), 1000);
    }

    try {
      await castVote({
        lobbyId: lobby._id,
        awardId: currentAward._id,
        friendId: friendId as any,
        voterName: voterName.trim(),
      });
      // Vote succeeded - no need to do anything, state already updated
    } catch (error) {
      // Revert optimistic update on failure
      setVotedAwards(previousVotedAwards);
      setSelectedVotes(previousSelectedVotes);
      setCurrentAwardIndex(previousIndex);
      toast.error("Failed to cast vote. Please try again.");
    }
  };

  // Loading State
  if (isLoading || isCheckingIdentity) {
    return (
      <div className="mx-auto mt-16 max-w-md px-4 sm:mt-24 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 text-5xl sm:text-6xl">🎫</div>
          <div className="spinner mb-4 h-8 w-8" />
          <p className="text-sm text-slate-400 sm:text-base">Loading lobby...</p>
        </div>
      </div>
    );
  }

  // Error State - Lobby not found (after loading completes)
  if (lobby === null) {
    return (
      <div className="mx-auto mt-8 max-w-md px-4 sm:mt-12 sm:px-6">
        <div className="glass-card p-6 text-center sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">🔍</div>
          <h2 className="mb-3 font-display text-xl font-semibold text-white sm:text-2xl">
            Lobby Not Found
          </h2>
          <p className="mb-6 text-sm text-slate-400 sm:text-base">
            The lobby code "{shareCode}" doesn't exist or has expired.
          </p>
          <Link to="/" className="btn-primary inline-block px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show presentation viewer when host has finished presenting
  if (lobby.isPresentationMode && lobby.isPresentationFinished) {
    return <PresentationMode lobbyId={lobby._id} isHost={false} />;
  }

  // Show waiting screen when presentation is in progress but not finished
  if (lobby.isPresentationMode && !lobby.isPresentationFinished) {
    return (
      <div className="mx-auto mt-8 max-w-md px-4 sm:mt-12 sm:px-6">
        <div className="glass-card p-6 text-center sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">🎬</div>
          <h2 className="mb-2 font-display text-xl font-semibold text-white sm:text-2xl">
            {lobby.name}
          </h2>
          <p className="mb-4 text-sm text-slate-400 sm:text-base">
            The host is presenting the results live!
          </p>
          <div className="mb-6 flex items-center justify-center gap-2 text-xs text-gold-400 sm:text-sm">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-gold-400" />
            <span>Presentation in progress...</span>
          </div>
          <p className="mb-6 text-xs text-slate-500 sm:text-sm">
            You'll be able to view the results once the host finishes.
          </p>
          <Link to="/" className="btn-secondary inline-block px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!lobby.isVotingOpen) {
    return (
      <div className="mx-auto mt-8 max-w-md px-4 sm:mt-12 sm:px-6">
        <div className="glass-card p-6 text-center sm:p-8">
          <div className="mb-4 animate-pulse text-5xl sm:text-6xl">⏳</div>
          <h2 className="mb-2 font-display text-xl font-semibold text-white sm:text-2xl">
            {lobby.name}
          </h2>
          <p className="mb-6 text-sm text-slate-400 sm:text-base">
            Voting hasn't started yet. The host will open voting soon!
          </p>
          <Link to="/" className="btn-secondary inline-block px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Identity Selection - Pick from friends list
  if (!hasSelectedIdentity) {
    return (
      <div className="mx-auto mt-4 max-w-md px-4 sm:mt-8 sm:px-6">
        <div className="glass-card-highlight p-5 sm:p-6 md:p-8">
          <div className="mb-5 text-center sm:mb-6">
            <div className="mb-3 text-4xl sm:text-5xl">👋</div>
            <h2 className="mb-1 font-display text-lg font-semibold text-white sm:text-xl md:text-2xl">
              {lobby.name}
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              Who are you? Select yourself to start voting.
            </p>
          </div>

          {friends.length === 0 ? (
            <div className="py-6 text-center sm:py-8">
              <div className="mb-3 text-3xl sm:text-4xl">🤷</div>
              <p className="text-sm text-slate-400 sm:text-base">
                No nominees added to this lobby yet.
              </p>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                Ask the host to add participants first!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400 sm:mb-3 sm:text-sm">
                Select yourself:
              </label>
              <div className="custom-scrollbar -mx-1 max-h-[55vh] space-y-2 overflow-y-auto px-1 sm:max-h-[50vh]">
                {friends.map((friend) => {
                  const hasAlreadyVoted = votedVoterNames.has(friend.name);

                  return (
                    <button
                      key={friend._id}
                      onClick={() => handleSelectIdentity(friend._id, friend.name)}
                      disabled={hasAlreadyVoted}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 sm:gap-4 sm:p-4 ${
                        hasAlreadyVoted
                          ? "cursor-not-allowed border-navy-700 bg-navy-800/40"
                          : "border-navy-600 bg-navy-800/80 active:scale-[0.98] active:bg-gold-500/10 sm:hover:border-gold-400/30 sm:hover:bg-gradient-to-r sm:hover:from-gold-500/20 sm:hover:to-amber-500/20"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12 ${
                          hasAlreadyVoted
                            ? "bg-slate-700/50"
                            : "bg-gradient-to-br from-gold-500/30 to-amber-500/30 group-hover:from-gold-500/50 group-hover:to-amber-500/50"
                        }`}
                      >
                        {friend.imageUrl ? (
                          <img
                            src={friend.imageUrl}
                            alt={friend.name}
                            className={`h-full w-full rounded-full object-cover ${hasAlreadyVoted ? "opacity-50 grayscale" : ""}`}
                          />
                        ) : (
                          <span
                            className={`text-base font-semibold sm:text-lg ${hasAlreadyVoted ? "text-slate-500" : "text-gold-400"}`}
                          >
                            {friend.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-medium sm:text-base ${hasAlreadyVoted ? "text-slate-500" : "text-slate-200 group-hover:text-white"}`}
                        >
                          {friend.name}
                        </span>
                        <span
                          className={`text-xs ${hasAlreadyVoted ? "text-emerald-500/70" : "text-slate-500"}`}
                        >
                          {hasAlreadyVoted ? "Already voted ✓" : "Tap to continue"}
                        </span>
                      </div>

                      {hasAlreadyVoted ? (
                        <Check className="h-5 w-5 flex-shrink-0 text-emerald-500/70" />
                      ) : (
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-gold-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No Awards
  if (awards.length === 0) {
    return (
      <div className="mx-auto mt-8 max-w-md px-4 sm:mt-12 sm:px-6">
        <div className="glass-card p-6 text-center sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">📋</div>
          <h2 className="mb-2 font-display text-xl font-semibold text-white sm:text-2xl">
            {lobby.name}
          </h2>
          <p className="mb-6 text-sm text-slate-400 sm:text-base">
            No awards have been set up yet!
          </p>
          <Link to="/" className="btn-secondary inline-block px-6 py-3">
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
  // Exclude the voter from the nominees list (can't vote for yourself)
  const nomineeIds = currentAward?.nomineeIds || [];
  const allNominees =
    nomineeIds.length > 0 ? friends.filter((f) => nomineeIds.includes(f._id)) : friends;
  const currentNominees = allNominees.filter((f) => f._id !== voterId);

  // Completion Screen
  if (isComplete) {
    return (
      <div className="mx-auto mt-8 max-w-md px-4 sm:mt-12 sm:px-6">
        <div className="glass-card-highlight p-6 text-center sm:p-8 md:p-10">
          <div className="trophy-animate mb-4 text-6xl sm:mb-6 sm:text-7xl md:text-8xl">🎉</div>
          <h2 className="mb-3 font-display text-3xl text-white sm:mb-4 sm:text-4xl md:text-5xl">
            All Done!
          </h2>
          <p className="mb-2 text-base text-slate-300 sm:text-lg md:text-xl">
            Thanks for voting, <span className="font-semibold text-gold-400">{voterName}</span>!
          </p>
          <p className="mb-6 text-sm text-slate-400 sm:mb-8 sm:text-base md:text-lg">
            The host will reveal the results soon.
          </p>
          <Link to="/" className="btn-primary inline-block px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6 sm:pb-8">
      {/* Progress Header */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-2 flex items-center justify-between text-xs sm:mb-3 sm:text-sm">
          <span className="text-slate-400">
            Award <span className="font-semibold text-white">{currentAwardIndex + 1}</span> of{" "}
            {awards.length}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem(`voter-id-${shareCode}`);
              localStorage.removeItem(`voter-name-${shareCode}`);
              setVoterId(null);
              setVoterName("");
              setHasSelectedIdentity(false);
              setVotedAwards(new Set());
              setSelectedVotes({});
              setCurrentAwardIndex(0);
            }}
            className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors active:bg-navy-800 sm:hover:bg-navy-800"
            title="Change identity"
          >
            <span className="max-w-[90px] truncate text-sm font-medium text-gold-400 sm:max-w-[150px]">
              {voterName}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 sm:text-xs">
              change
            </span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-navy-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${((currentAwardIndex + 1) / awards.length) * 100}%` }}
          />
        </div>

        {/* Progress Dots - wrap to new lines */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-4 sm:gap-1.5">
          {awards.map((award, i) => (
            <button
              key={award._id}
              onClick={() => setCurrentAwardIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 sm:h-2 sm:w-2 ${
                i === currentAwardIndex
                  ? "scale-125 bg-gold-400"
                  : votedAwards.has(award._id)
                    ? "bg-emerald-500"
                    : "active:bg-navy-500 sm:hover:bg-navy-500 bg-navy-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Award Card */}
      <div className="glass-card-highlight mb-4 p-4 text-center sm:mb-6 sm:p-6 md:p-8">
        <div className="trophy-animate mb-3 text-4xl sm:mb-4 sm:text-5xl md:text-6xl">🏆</div>

        <h2 className="mb-4 font-display text-xl leading-tight text-white sm:mb-6 sm:text-2xl md:text-3xl lg:text-4xl">
          {currentAward.question}
        </h2>

        {/* Nominee Options */}
        <div className="grid gap-2 sm:gap-3">
          {currentNominees.map((friend) => {
            const isSelected = selectedVotes[currentAward._id] === friend._id;

            return (
              <button
                key={friend._id}
                onClick={() => handleVote(friend._id)}
                disabled={hasVotedCurrent}
                className={`group flex w-full items-center justify-center gap-2.5 rounded-xl p-3 text-sm font-medium transition-all duration-200 sm:gap-3 sm:p-4 sm:text-base ${
                  isSelected
                    ? "scale-[1.02] border-2 border-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-white shadow-lg shadow-emerald-500/20"
                    : hasVotedCurrent
                      ? "cursor-not-allowed border border-navy-700 bg-navy-800/50 text-slate-500"
                      : "border border-navy-600 bg-navy-800/80 text-slate-200 active:scale-[0.98] active:bg-gold-500/10 sm:hover:scale-[1.02] sm:hover:border-gold-400/30 sm:hover:bg-gradient-to-r sm:hover:from-gold-500/20 sm:hover:to-amber-500/20 sm:hover:text-white sm:hover:shadow-lg sm:hover:shadow-gold-500/10"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all sm:h-10 sm:w-10 ${
                    isSelected
                      ? "bg-gradient-to-br from-emerald-500/50 to-green-500/50"
                      : "bg-gradient-to-br from-gold-500/30 to-amber-500/30 group-hover:from-gold-500/50 group-hover:to-amber-500/50"
                  }`}
                >
                  {friend.imageUrl ? (
                    <img
                      src={friend.imageUrl}
                      alt={friend.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={`text-xs font-semibold sm:text-sm ${isSelected ? "text-emerald-300" : "text-gold-400"}`}
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <span className="truncate">{friend.name}</span>

                {isSelected && <Check className="ml-auto h-5 w-5 flex-shrink-0 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {currentNominees.length === 0 && (
          <p className="py-4 text-sm text-slate-500 sm:text-base">
            {allNominees.length === 0
              ? "No nominees assigned for this award."
              : "No other nominees to vote for in this category."}
          </p>
        )}

        {hasVotedCurrent && (
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm font-medium sm:text-base">Vote recorded!</span>
          </div>
        )}
      </div>

      {/* Navigation - fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-between gap-3 border-t border-navy-800/50 bg-navy-950/95 px-4 py-3 backdrop-blur-lg sm:relative sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          onClick={() => setCurrentAwardIndex(Math.max(0, currentAwardIndex - 1))}
          disabled={currentAwardIndex === 0 || hasVotedCurrent}
          className="btn-secondary flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm sm:flex-none sm:gap-2 sm:py-3 sm:text-base"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => setCurrentAwardIndex(Math.min(awards.length, currentAwardIndex + 1))}
          disabled={hasVotedCurrent}
          className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm sm:flex-none sm:gap-2 sm:py-3 sm:text-base"
        >
          <span>{isLastAward ? "Finish" : "Skip"}</span>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
