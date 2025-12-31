import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

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
    <div className="max-w-5xl mx-auto space-y-8 mt-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-2">Your Lobbies</h2>
          <p className="text-lg text-slate-400">Manage your award ceremonies</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Lobby
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="glass-card-highlight p-8 sm:p-10 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/20 flex items-center justify-center">
                <span className="text-3xl">🎬</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-white">New Lobby</h3>
            </div>
            
            <form onSubmit={handleCreateLobby} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lobby Name
                </label>
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
                <button
                  type="submit"
                  disabled={!lobbyName.trim()}
                  className="btn-primary flex-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-display text-2xl text-white">Delete Lobby</h3>
            </div>
            
            <p className="text-slate-300 mb-2">
              Are you sure you want to delete <span className="text-white font-semibold">"{deletingLobby.name}"</span>?
            </p>
            <p className="text-slate-500 text-sm mb-8">
              This will permanently delete all friends, awards, and votes. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLobby(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLobby}
                className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 font-semibold rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all"
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
            <div className="text-5xl mb-4">🎭</div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">No lobbies yet</h3>
            <p className="text-slate-400 mb-6">Create your first lobby to start the fun!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Lobby
            </button>
          </div>
        )}
      </div>

      {/* Lobby Manager Panel */}
      {selectedLobby && (
        <LobbyManager lobbyId={selectedLobby as Id<"lobbies">} />
      )}
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
      className={`glass-card p-6 cursor-pointer transition-all duration-300 hover-lift ${
        isSelected ? 'ring-2 ring-gold-400/50 bg-navy-800/70' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-semibold text-white mb-3 truncate">
            {lobby.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyShareCode}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900/80 border border-navy-600 hover:border-gold-400/30 transition-colors group"
            >
              <span className="font-mono text-gold-400 tracking-wider">{lobby.shareCode}</span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-gold-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            {lobby.isVotingOpen ? (
              <span className="badge-success">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                Voting Open
              </span>
            ) : lobby.isPresentationMode ? (
              <span className="badge-info">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
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
            {isSelected ? 'Collapse' : 'Manage'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete lobby"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
  const canStartPresentation = !lobby.isVotingOpen && votingProgress.some(p => p.voterCount > 0);

  return (
    <div className="glass-card p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-navy-700/50">
        <div>
          <h3 className="font-display text-2xl font-semibold text-white mb-1">{lobby.name}</h3>
          <p className="text-slate-400 text-sm">Configure your awards ceremony</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleToggleVoting}
            disabled={!canStartVoting}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              lobby.isVotingOpen
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : canStartVoting
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-navy-700/50 text-slate-500 border border-navy-600 cursor-not-allowed'
            }`}
          >
            {lobby.isVotingOpen ? '⏹ Close Voting' : '▶ Open Voting'}
          </button>
          
          <button
            onClick={handleStartPresentation}
            disabled={!canStartPresentation}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              canStartPresentation
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30'
                : 'bg-navy-700/50 text-slate-500 border border-navy-600 cursor-not-allowed'
            }`}
          >
            🎬 Start Presentation
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Friends Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">👥</span>
            <h4 className="font-semibold text-white text-lg">Friends ({friends.length})</h4>
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
                className="btn-primary py-2.5 px-4"
              >
                Add
              </button>
            </div>
          </form>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {friends.map((friend) => (
              <FriendItem
                key={friend._id}
                friend={friend}
                onRemove={() => removeFriend({ friendId: friend._id })}
                onImageUpload={(file) => handleImageUpload(friend._id, file)}
              />
            ))}
            {friends.length === 0 && (
              <p className="text-slate-500 text-sm py-4 text-center">
                Add friends to nominate for awards
              </p>
            )}
          </div>
        </div>

        {/* Awards Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <h4 className="font-semibold text-white text-lg">Awards ({awards.length})</h4>
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
              <button
                type="submit"
                disabled={!newAward.trim()}
                className="btn-primary py-2.5 px-4"
              >
                Add
              </button>
            </div>
          </form>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {awards.map((award) => {
              const progress = votingProgress.find(p => p.awardId === award._id);
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
              <p className="text-slate-500 text-sm py-4 text-center">
                Add awards for people to vote on
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Notice */}
      {!canStartVoting && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-400 text-xl">💡</span>
          <div>
            <p className="text-amber-200 font-medium">Ready to start?</p>
            <p className="text-amber-200/70 text-sm">
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
      onUpdateNominees(nomineeIds.filter(id => id !== friendId));
    } else {
      onUpdateNominees([...nomineeIds, friendId]);
    }
  };

  const selectAll = () => {
    onUpdateNominees([]);
  };

  return (
    <div className="bg-navy-900/50 rounded-xl border border-navy-700/50 overflow-hidden">
      {/* Award Header */}
      <div className="p-4 group">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <span className="text-slate-200">{award.question}</span>
            {voteCount > 0 && (
              <div className="text-sm text-gold-400 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {voteCount} vote{voteCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${
                hasCustomNominees 
                  ? 'text-gold-400 bg-gold-500/10 hover:bg-gold-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700'
              }`}
              title="Select nominees"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Nominee count badge */}
        {hasCustomNominees && !isExpanded && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Nominees:</span>
            <div className="flex -space-x-1">
              {nomineeIds.slice(0, 4).map((id) => {
                const friend = friends.find(f => f._id === id);
                if (!friend) return null;
                return (
                  <div
                    key={id}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 flex items-center justify-center text-[10px] text-gold-400 font-medium ring-1 ring-navy-900"
                    title={friend.name}
                  >
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
              {nomineeIds.length > 4 && (
                <div className="w-5 h-5 rounded-full bg-navy-700 flex items-center justify-center text-[10px] text-slate-400 font-medium ring-1 ring-navy-900">
                  +{nomineeIds.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Nominee Selector */}
      {isExpanded && (
        <div className="border-t border-navy-700/50 p-4 bg-navy-950/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Select Nominees
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
            >
              {hasCustomNominees ? 'Select All' : 'All Selected'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {friends.map((friend) => {
              const isSelected = !hasCustomNominees || nomineeIds.includes(friend._id);
              return (
                <button
                  key={friend._id}
                  onClick={() => toggleNominee(friend._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      : 'bg-navy-800 text-slate-500 border border-navy-700 hover:border-navy-600'
                  }`}
                >
                  {friend.name}
                </button>
              );
            })}
          </div>
          
          {friends.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-2">
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
  onImageUpload 
}: { 
  friend: any; 
  onRemove: () => void;
  onImageUpload: (file: File) => void;
}) {
  return (
    <div className="bg-navy-900/50 p-3 rounded-xl border border-navy-700/50 group hover:border-navy-600 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {friend.imageUrl ? (
            <img 
              src={friend.imageUrl} 
              alt={friend.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-navy-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/30 to-amber-500/30 flex items-center justify-center ring-2 ring-gold-500/20">
              <span className="text-gold-400 font-semibold text-sm">
                {friend.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <span className="flex-1 font-medium text-slate-200 truncate">{friend.name}</span>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <label className="cursor-pointer p-2 rounded-lg hover:bg-navy-700 transition-colors">
            <svg className="w-4 h-4 text-slate-400 hover:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
