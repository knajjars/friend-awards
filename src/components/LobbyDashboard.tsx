import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Trash2, Copy, Users, X, ImageIcon, Star, Pencil, Check } from "lucide-react";

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
    <div className="mx-auto mt-4 max-w-5xl space-y-6 sm:mt-8 sm:space-y-8">
      {/* Section Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h2 className="mb-1 font-display text-2xl text-white sm:mb-2 sm:text-3xl md:text-4xl">
            Your Lobbies
          </h2>
          <p className="text-sm text-slate-400 sm:text-lg">Manage your award ceremonies</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary touch-target flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Lobby
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-card-highlight animate-in fade-in slide-in-from-bottom w-full max-w-md rounded-t-3xl p-6 duration-300 sm:rounded-2xl sm:p-8 md:p-10">
            <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 sm:h-14 sm:w-14 sm:rounded-2xl">
                <span className="text-2xl sm:text-3xl">🎬</span>
              </div>
              <h3 className="font-display text-xl text-white sm:text-2xl md:text-3xl">New Lobby</h3>
            </div>

            <form onSubmit={handleCreateLobby} className="space-y-5 sm:space-y-6">
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
                  className="btn-secondary touch-target flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!lobbyName.trim()}
                  className="btn-primary touch-target flex-1"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLobby && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-card animate-in fade-in slide-in-from-bottom w-full max-w-md rounded-t-3xl p-6 duration-300 sm:rounded-2xl sm:p-8">
            <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Trash2 className="h-6 w-6 text-red-400 sm:h-7 sm:w-7" />
              </div>
              <h3 className="font-display text-xl text-white sm:text-2xl">Delete Lobby</h3>
            </div>

            <p className="mb-2 text-sm text-slate-300 sm:text-base">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">"{deletingLobby.name}"</span>?
            </p>
            <p className="mb-6 text-xs text-slate-500 sm:mb-8 sm:text-sm">
              This will permanently delete all friends, awards, and votes. This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLobby(null)}
                className="btn-secondary touch-target flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLobby}
                className="touch-target flex-1 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/30 sm:px-6"
              >
                Delete Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lobbies Grid */}
      <div className="grid gap-3 sm:gap-4">
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
          <div className="glass-card p-8 text-center sm:p-12">
            <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">🎭</div>
            <h3 className="mb-2 font-display text-lg font-semibold text-white sm:text-xl">
              No lobbies yet
            </h3>
            <p className="mb-5 text-sm text-slate-400 sm:mb-6 sm:text-base">
              Create your first lobby to start the fun!
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary touch-target">
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
      className={`glass-card cursor-pointer p-4 transition-all duration-300 active:scale-[0.99] sm:p-6 ${
        isSelected ? "bg-navy-800/70 ring-2 ring-gold-400/50" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 truncate font-display text-lg font-semibold text-white sm:mb-3 sm:text-xl">
            {lobby.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={copyShareCode}
              className="group inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/80 px-3 py-2 transition-colors active:bg-navy-800 sm:py-1.5"
            >
              <span className="font-mono text-sm tracking-wider text-gold-400 sm:text-base">
                {lobby.shareCode}
              </span>
              <Copy className="h-4 w-4 text-slate-500 transition-colors group-hover:text-gold-400" />
            </button>

            {lobby.isVotingOpen ? (
              <span className="badge-success text-xs sm:text-sm">
                <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 sm:mr-2" />
                Voting Open
              </span>
            ) : lobby.isPresentationMode ? (
              <span className="badge-info text-xs sm:text-sm">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 sm:mr-2" />
                Presenting
              </span>
            ) : (
              <span className="badge-neutral text-xs sm:text-sm">Setup Mode</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 self-stretch border-t border-navy-700/50 pt-3 sm:self-start sm:border-0 sm:pt-0">
          {lobby.isPresentationMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPresentation();
              }}
              className="btn-primary flex-1 py-2.5 text-sm sm:flex-none sm:py-2"
            >
              View Show
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="btn-secondary flex-1 py-2.5 text-sm sm:flex-none sm:py-2"
          >
            {isSelected ? "Collapse" : "Manage"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-all active:bg-red-500/20 sm:h-auto sm:w-auto sm:p-2 sm:hover:bg-red-500/10 sm:hover:text-red-400"
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
  const updateAward = useMutation(api.awards.updateAward);
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

  const handleUpdateAward = async (awardId: Id<"awards">, question: string) => {
    try {
      await updateAward({ awardId, question });
      toast.success("Award updated!");
    } catch (error) {
      toast.error("Failed to update award");
    }
  };

  if (!lobby) return null;

  const canStartVoting = friends.length >= 2 && awards.length >= 1;
  const canStartPresentation = !lobby.isVotingOpen && votingProgress.some((p) => p.voterCount > 0);

  return (
    <div className="glass-card animate-in fade-in slide-in-from-top-4 space-y-5 p-4 duration-300 sm:space-y-8 sm:p-6 md:p-8">
      {/* Header with Actions */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-navy-700/50 pb-5 sm:flex-row sm:items-center sm:gap-4 sm:pb-6">
        <div>
          <h3 className="mb-1 font-display text-xl font-semibold text-white sm:text-2xl">
            {lobby.name}
          </h3>
          <p className="text-xs text-slate-400 sm:text-sm">Configure your awards ceremony</p>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
          <button
            onClick={handleToggleVoting}
            disabled={!canStartVoting}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-5 sm:text-base ${
              lobby.isVotingOpen
                ? "border border-red-500/30 bg-red-500/20 text-red-400 active:bg-red-500/30"
                : canStartVoting
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 active:bg-emerald-500/30"
                  : "cursor-not-allowed border border-navy-600 bg-navy-700/50 text-slate-500"
            }`}
          >
            {lobby.isVotingOpen ? "⏹ Close" : "▶ Open Voting"}
          </button>

          <button
            onClick={handleStartPresentation}
            disabled={!canStartPresentation}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-5 sm:text-base ${
              canStartPresentation
                ? "border border-sky-500/30 bg-sky-500/20 text-sky-400 active:bg-sky-500/30"
                : "cursor-not-allowed border border-navy-600 bg-navy-700/50 text-slate-500"
            }`}
          >
            🎬 Present
          </button>
        </div>
      </div>

      {/* Two Column Layout - stacked on mobile */}
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Friends Section */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <span className="text-lg sm:text-xl">👥</span>
            <h4 className="text-base font-semibold text-white sm:text-lg">
              Friends ({friends.length})
            </h4>
          </div>

          <form onSubmit={handleAddFriend} className="mb-3 sm:mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a friend's name"
                value={newFriend}
                onChange={(e) => setNewFriend(e.target.value)}
                className="input-field flex-1 py-3 text-base"
              />
              <button type="submit" disabled={!newFriend.trim()} className="btn-primary px-4 py-3">
                Add
              </button>
            </div>
          </form>

          <div
            className="custom-scrollbar -mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1"
            style={{ maxHeight: "280px" }}
          >
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
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <span className="text-lg sm:text-xl">🏆</span>
            <h4 className="text-base font-semibold text-white sm:text-lg">
              Awards ({awards.length})
            </h4>
          </div>

          <form onSubmit={handleAddAward} className="mb-3 sm:mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Most likely to..."
                value={newAward}
                onChange={(e) => setNewAward(e.target.value)}
                className="input-field flex-1 py-3 text-base"
              />
              <button type="submit" disabled={!newAward.trim()} className="btn-primary px-4 py-3">
                Add
              </button>
            </div>
          </form>

          <div
            className="custom-scrollbar -mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 sm:space-y-3"
            style={{ maxHeight: "280px" }}
          >
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
                  onUpdateQuestion={(question) => handleUpdateAward(award._id, question)}
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
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 sm:gap-3 sm:p-4">
          <span className="text-lg text-amber-400 sm:text-xl">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-200 sm:text-base">Ready to start?</p>
            <p className="text-xs text-amber-200/70 sm:text-sm">
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
  onUpdateQuestion,
}: {
  award: any;
  friends: any[];
  voteCount: number;
  onRemove: () => void;
  onUpdateNominees: (nomineeIds: Id<"friends">[]) => void;
  onUpdateQuestion: (question: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(award.question);
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

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== award.question) {
      onUpdateQuestion(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(award.question);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy-700/50 bg-navy-900/50">
      {/* Award Header */}
      <div className="group p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveEdit}
                  className="w-full rounded-lg border border-gold-500/30 bg-navy-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-gold-500 sm:text-base"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditValue(award.question);
                  setIsEditing(true);
                }}
                className="group/edit text-left"
              >
                <span className="text-sm text-slate-200 group-hover/edit:text-white sm:text-base">
                  {award.question}
                </span>
                <Pencil className="ml-2 inline h-3 w-3 text-slate-500 opacity-0 transition-opacity group-hover/edit:opacity-100 sm:h-3.5 sm:w-3.5" />
              </button>
            )}
            {voteCount > 0 && !isEditing && (
              <div className="mt-1 flex items-center gap-1 text-xs text-gold-400 sm:text-sm">
                <Star className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" />
                {voteCount} vote{voteCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-colors active:bg-emerald-500/20 sm:h-8 sm:w-8"
                  title="Save"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors active:bg-red-500/20 sm:h-8 sm:w-8"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8 ${
                    hasCustomNominees
                      ? "bg-gold-500/10 text-gold-400 active:bg-gold-500/20"
                      : "text-slate-500 active:bg-navy-700 sm:hover:bg-navy-700 sm:hover:text-slate-300"
                  }`}
                  title="Select nominees"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={onRemove}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 opacity-100 transition-colors active:bg-red-500/20 sm:h-8 sm:w-8 sm:opacity-0 sm:hover:bg-red-500/10 sm:hover:text-red-400 sm:group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Nominee count badge */}
        {hasCustomNominees && !isExpanded && !isEditing && (
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
        <div className="border-t border-navy-700/50 bg-navy-950/30 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Select Nominees
            </span>
            <button
              onClick={selectAll}
              className="rounded-lg px-2 py-1 text-xs text-gold-400 transition-colors active:bg-gold-500/10"
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
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95 sm:py-1.5 ${
                    isSelected
                      ? "border border-gold-500/30 bg-gold-500/20 text-gold-400"
                      : "border border-navy-700 bg-navy-800 text-slate-500 active:border-navy-600"
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
    <div className="group rounded-xl border border-navy-700/50 bg-navy-900/50 p-3 transition-colors active:bg-navy-800/50 sm:hover:border-navy-600">
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

        <span className="flex-1 truncate text-sm font-medium text-slate-200 sm:text-base">
          {friend.name}
        </span>

        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors active:bg-navy-600 sm:h-8 sm:w-8 sm:hover:bg-navy-700">
            <ImageIcon className="h-5 w-5 text-slate-400 sm:h-4 sm:w-4" />
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
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:bg-red-500/30 sm:h-8 sm:w-8 sm:hover:bg-red-500/20"
          >
            <Trash2 className="h-5 w-5 text-slate-400 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
