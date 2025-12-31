import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Trash2, Copy, Users, X, ImageIcon, Star } from "lucide-react";

interface LobbyDashboardProps {
  onViewPresentation: (lobbyId: string) => void;
}

export function LobbyDashboard({ onViewPresentation }: LobbyDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [selectedLobby, setSelectedLobby] = useState<string>("");
  const [deletingLobby, setDeletingLobby] = useState<{ id: string; name: string } | null>(null);

  const lobbies = useQuery(api.lobbies.getUserLobbies) || [];
  const createLobby = useMutation(api.lobbies.createLobby);
  const deleteLobby = useMutation(api.lobbies.deleteLobby);

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyName.trim()) return;

    try {
      const result = await createLobby({ name: lobbyName.trim() });
      toast.success(`Lobby created! Share code: ${result.shareCode}`);
      setLobbyName("");
      setShowCreateForm(false);
      setSelectedLobby(result.lobbyId);
    } catch (error) {
      toast.error("Failed to create lobby");
    }
  };

  const handleDeleteLobby = async () => {
    if (!deletingLobby) return;

    try {
      await deleteLobby({ lobbyId: deletingLobby.id as Id<"lobbies"> });
      toast.success("Lobby deleted");
      if (selectedLobby === deletingLobby.id) {
        setSelectedLobby("");
      }
      setDeletingLobby(null);
    } catch (error) {
      toast.error("Failed to delete lobby");
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-5xl space-y-8">
      {/* Section Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="mb-2 font-display text-3xl text-white sm:text-4xl">Your Lobbies</h2>
          <p className="text-lg text-slate-400">Manage your award ceremonies</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Lobby
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card-highlight animate-in fade-in zoom-in w-full max-w-md p-8 duration-200 sm:p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/20">
                <span className="text-3xl">🎬</span>
              </div>
              <h3 className="font-display text-2xl text-white sm:text-3xl">New Lobby</h3>
            </div>

            <form onSubmit={handleCreateLobby} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Lobby Name</label>
                <input
                  type="text"
                  placeholder="e.g., Summer Trip Awards 2024"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={!lobbyName.trim()} className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLobby && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card animate-in fade-in zoom-in w-full max-w-md p-8 duration-200">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
                <Trash2 className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="font-display text-2xl text-white">Delete Lobby</h3>
            </div>

            <p className="mb-2 text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">"{deletingLobby.name}"</span>?
            </p>
            <p className="mb-8 text-sm text-slate-500">
              This will permanently delete all friends, awards, and votes. This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setDeletingLobby(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDeleteLobby}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/20 px-6 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/30"
              >
                Delete Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lobbies Grid */}
      <div className="grid gap-4">
        {lobbies.map((lobby) => (
          <LobbyCard
            key={lobby._id}
            lobby={lobby}
            isSelected={selectedLobby === lobby._id}
            onSelect={() => setSelectedLobby(selectedLobby === lobby._id ? "" : lobby._id)}
            onViewPresentation={() => onViewPresentation(lobby._id)}
            onDelete={() => setDeletingLobby({ id: lobby._id, name: lobby.name })}
          />
        ))}

        {lobbies.length === 0 && !showCreateForm && (
          <div className="glass-card p-12 text-center">
            <div className="mb-4 text-5xl">🎭</div>
            <h3 className="mb-2 font-display text-xl font-semibold text-white">No lobbies yet</h3>
            <p className="mb-6 text-slate-400">Create your first lobby to start the fun!</p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary">
              Create Your First Lobby
            </button>
          </div>
        )}
      </div>

      {/* Lobby Manager Panel */}
      {selectedLobby && <LobbyManager lobbyId={selectedLobby as Id<"lobbies">} />}
    </div>
  );
}

function LobbyCard({
  lobby,
  isSelected,
  onSelect,
  onViewPresentation,
  onDelete,
}: {
  lobby: any;
  isSelected: boolean;
  onSelect: () => void;
  onViewPresentation: () => void;
  onDelete: () => void;
}) {
  const copyShareCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lobby.shareCode);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div
      className={`glass-card hover-lift cursor-pointer p-6 transition-all duration-300 ${
        isSelected ? "bg-navy-800/70 ring-2 ring-gold-400/50" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <h3 className="mb-3 truncate font-display text-xl font-semibold text-white">
            {lobby.name}
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyShareCode}
              className="group inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/80 px-3 py-1.5 transition-colors hover:border-gold-400/30"
            >
              <span className="font-mono tracking-wider text-gold-400">{lobby.shareCode}</span>
              <Copy className="h-4 w-4 text-slate-500 transition-colors group-hover:text-gold-400" />
            </button>

            {lobby.isVotingOpen ? (
              <span className="badge-success">
                <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Voting Open
              </span>
            ) : lobby.isPresentationMode ? (
              <span className="badge-info">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                Presenting
              </span>
            ) : (
              <span className="badge-neutral">Setup Mode</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 self-start">
          {lobby.isPresentationMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPresentation();
              }}
              className="btn-primary py-2 text-sm"
            >
              View Show
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="btn-secondary py-2 text-sm"
          >
            {isSelected ? "Collapse" : "Manage"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-xl p-2 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
            title="Delete lobby"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LobbyManager({ lobbyId }: { lobbyId: Id<"lobbies"> }) {
  const [newFriend, setNewFriend] = useState("");
  const [newAward, setNewAward] = useState("");

  const lobby = useQuery(api.lobbies.getLobby, { lobbyId });
  const friends = useQuery(api.friends.getFriends, { lobbyId }) || [];
  const awards = useQuery(api.awards.getAwards, { lobbyId }) || [];
  const votingProgress = useQuery(api.votes.getVotingProgress, { lobbyId }) || [];

  const addFriend = useMutation(api.friends.addFriend);
  const removeFriend = useMutation(api.friends.removeFriend);
  const generateUploadUrl = useMutation(api.friends.generateUploadUrl);
  const updateFriendImage = useMutation(api.friends.updateFriendImage);
  const addAward = useMutation(api.awards.addAward);
  const removeAward = useMutation(api.awards.removeAward);
  const updateNominees = useMutation(api.awards.updateNominees);
  const toggleVoting = useMutation(api.lobbies.toggleVoting);
  const startPresentation = useMutation(api.lobbies.startPresentation);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriend.trim()) return;

    try {
      await addFriend({ lobbyId, name: newFriend.trim() });
      setNewFriend("");
      toast.success("Friend added!");
    } catch (error) {
      toast.error("Failed to add friend");
    }
  };

  const handleAddAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAward.trim()) return;

    try {
      await addAward({ lobbyId, question: newAward.trim() });
      setNewAward("");
      toast.success("Award added!");
    } catch (error) {
      toast.error("Failed to add award");
    }
  };

  const handleToggleVoting = async () => {
    try {
      await toggleVoting({ lobbyId });
      toast.success(lobby?.isVotingOpen ? "Voting closed" : "Voting opened!");
    } catch (error) {
      toast.error("Failed to toggle voting");
    }
  };

  const handleStartPresentation = async () => {
    try {
      await startPresentation({ lobbyId });
      toast.success("Presentation mode started!");
    } catch (error) {
      toast.error("Failed to start presentation");
    }
  };

  const handleImageUpload = async (friendId: string, file: File) => {
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      await updateFriendImage({ friendId: friendId as any, imageId: storageId });
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleUpdateNominees = async (awardId: Id<"awards">, nomineeIds: Id<"friends">[]) => {
    try {
      await updateNominees({ awardId, nomineeIds });
    } catch (error) {
      toast.error("Failed to update nominees");
    }
  };

  if (!lobby) return null;

  const canStartVoting = friends.length >= 2 && awards.length >= 1;
  const canStartPresentation = !lobby.isVotingOpen && votingProgress.some((p) => p.voterCount > 0);

  return (
    <div className="glass-card animate-in fade-in slide-in-from-top-4 space-y-8 p-6 duration-300 sm:p-8">
      {/* Header with Actions */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-navy-700/50 pb-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="mb-1 font-display text-2xl font-semibold text-white">{lobby.name}</h3>
          <p className="text-sm text-slate-400">Configure your awards ceremony</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleToggleVoting}
            disabled={!canStartVoting}
            className={`rounded-xl px-5 py-2.5 font-semibold transition-all duration-300 ${
              lobby.isVotingOpen
                ? "border border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : canStartVoting
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "cursor-not-allowed border border-navy-600 bg-navy-700/50 text-slate-500"
            }`}
          >
            {lobby.isVotingOpen ? "⏹ Close Voting" : "▶ Open Voting"}
          </button>

          <button
            onClick={handleStartPresentation}
            disabled={!canStartPresentation}
            className={`rounded-xl px-5 py-2.5 font-semibold transition-all duration-300 ${
              canStartPresentation
                ? "border border-sky-500/30 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                : "cursor-not-allowed border border-navy-600 bg-navy-700/50 text-slate-500"
            }`}
          >
            🎬 Start Presentation
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Friends Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h4 className="text-lg font-semibold text-white">Friends ({friends.length})</h4>
          </div>

          <form onSubmit={handleAddFriend} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a friend's name"
                value={newFriend}
                onChange={(e) => setNewFriend(e.target.value)}
                className="input-field flex-1 py-2.5"
              />
              <button
                type="submit"
                disabled={!newFriend.trim()}
                className="btn-primary px-4 py-2.5"
              >
                Add
              </button>
            </div>
          </form>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
            {friends.map((friend) => (
              <FriendItem
                key={friend._id}
                friend={friend}
                onRemove={() => removeFriend({ friendId: friend._id })}
                onImageUpload={(file) => handleImageUpload(friend._id, file)}
              />
            ))}
            {friends.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">
                Add friends to nominate for awards
              </p>
            )}
          </div>
        </div>

        {/* Awards Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h4 className="text-lg font-semibold text-white">Awards ({awards.length})</h4>
          </div>

          <form onSubmit={handleAddAward} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Most likely to..."
                value={newAward}
                onChange={(e) => setNewAward(e.target.value)}
                className="input-field flex-1 py-2.5"
              />
              <button type="submit" disabled={!newAward.trim()} className="btn-primary px-4 py-2.5">
                Add
              </button>
            </div>
          </form>

          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
            {awards.map((award) => {
              const progress = votingProgress.find((p) => p.awardId === award._id);
              return (
                <AwardItem
                  key={award._id}
                  award={award}
                  friends={friends}
                  voteCount={progress?.voterCount || 0}
                  onRemove={() => removeAward({ awardId: award._id })}
                  onUpdateNominees={(nomineeIds) => handleUpdateNominees(award._id, nomineeIds)}
                />
              );
            })}
            {awards.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">
                Add awards for people to vote on
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Notice */}
      {!canStartVoting && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <span className="text-xl text-amber-400">💡</span>
          <div>
            <p className="font-medium text-amber-200">Ready to start?</p>
            <p className="text-sm text-amber-200/70">
              Add at least 2 friends and 1 award to open voting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function AwardItem({
  award,
  friends,
  voteCount,
  onRemove,
  onUpdateNominees,
}: {
  award: any;
  friends: any[];
  voteCount: number;
  onRemove: () => void;
  onUpdateNominees: (nomineeIds: Id<"friends">[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nomineeIds: Id<"friends">[] = award.nomineeIds || [];
  const hasCustomNominees = nomineeIds.length > 0;

  const toggleNominee = (friendId: Id<"friends">) => {
    if (nomineeIds.includes(friendId)) {
      onUpdateNominees(nomineeIds.filter((id) => id !== friendId));
    } else {
      onUpdateNominees([...nomineeIds, friendId]);
    }
  };

  const selectAll = () => {
    onUpdateNominees([]);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy-700/50 bg-navy-900/50">
      {/* Award Header */}
      <div className="group p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-slate-200">{award.question}</span>
            {voteCount > 0 && (
              <div className="mt-1 flex items-center gap-1 text-sm text-gold-400">
                <Star className="h-3.5 w-3.5 fill-current" />
                {voteCount} vote{voteCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-lg p-1.5 transition-colors ${
                hasCustomNominees
                  ? "bg-gold-500/10 text-gold-400 hover:bg-gold-500/20"
                  : "text-slate-500 hover:bg-navy-700 hover:text-slate-300"
              }`}
              title="Select nominees"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={onRemove}
              className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nominee count badge */}
        {hasCustomNominees && !isExpanded && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Nominees:</span>
            <div className="flex -space-x-1">
              {nomineeIds.slice(0, 4).map((id) => {
                const friend = friends.find((f) => f._id === id);
                if (!friend) return null;
                return (
                  <div
                    key={id}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 text-[10px] font-medium text-gold-400 ring-1 ring-navy-900"
                    title={friend.name}
                  >
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
              {nomineeIds.length > 4 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-700 text-[10px] font-medium text-slate-400 ring-1 ring-navy-900">
                  +{nomineeIds.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Nominee Selector */}
      {isExpanded && (
        <div className="border-t border-navy-700/50 bg-navy-950/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Select Nominees
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-gold-400 transition-colors hover:text-gold-300"
            >
              {hasCustomNominees ? "Select All" : "All Selected"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {friends.map((friend) => {
              const isSelected = !hasCustomNominees || nomineeIds.includes(friend._id);
              return (
                <button
                  key={friend._id}
                  onClick={() => toggleNominee(friend._id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    isSelected
                      ? "border border-gold-500/30 bg-gold-500/20 text-gold-400"
                      : "border border-navy-700 bg-navy-800 text-slate-500 hover:border-navy-600"
                  }`}
                >
                  {friend.name}
                </button>
              );
            })}
          </div>

          {friends.length === 0 && (
            <p className="py-2 text-center text-sm text-slate-500">
              Add friends first to assign nominees
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FriendItem({
  friend,
  onRemove,
  onImageUpload,
}: {
  friend: any;
  onRemove: () => void;
  onImageUpload: (file: File) => void;
}) {
  return (
    <div className="group rounded-xl border border-navy-700/50 bg-navy-900/50 p-3 transition-colors hover:border-navy-600">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {friend.imageUrl ? (
            <img
              src={friend.imageUrl}
              alt={friend.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-navy-600"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 ring-2 ring-gold-500/20">
              <span className="text-sm font-semibold text-gold-400">
                {friend.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <span className="flex-1 truncate font-medium text-slate-200">{friend.name}</span>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <label className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-navy-700">
            <ImageIcon className="h-4 w-4 text-slate-400 hover:text-gold-400" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
              }}
            />
          </label>
          <button
            onClick={onRemove}
            className="rounded-lg p-2 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
