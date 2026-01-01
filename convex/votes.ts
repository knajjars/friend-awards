import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const castVote = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    awardId: v.id("awards"),
    friendId: v.id("friends"),
    voterName: v.string(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || !lobby.isVotingOpen) {
      throw new Error("Voting is not open");
    }

    // Remove any existing vote from this voter for this award
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) =>
        q.eq("lobbyId", args.lobbyId).eq("awardId", args.awardId)
      )
      .filter((q) => q.eq(q.field("voterName"), args.voterName))
      .first();

    if (existingVote) {
      await ctx.db.delete(existingVote._id);
    }

    return await ctx.db.insert("votes", {
      lobbyId: args.lobbyId,
      awardId: args.awardId,
      friendId: args.friendId,
      voterName: args.voterName.trim(),
    });
  },
});

export const getVoteResults = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    const friends = await ctx.db
      .query("friends")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    const awards = await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    // Get image URLs for friends
    const friendsWithImages = await Promise.all(
      friends.map(async (friend) => ({
        ...friend,
        imageUrl: friend.imageId ? await ctx.storage.getUrl(friend.imageId) : null,
      }))
    );

    // Group votes by award
    const votesByAward: Record<
      string,
      Array<{ friendId: string; friendName: string; friendImageUrl: string | null; votes: number }>
    > = {};

    awards.forEach((award) => {
      const awardVotes = votes.filter((v) => v.awardId === award._id);
      const voteCounts: Record<string, number> = {};

      awardVotes.forEach((vote) => {
        voteCounts[vote.friendId] = (voteCounts[vote.friendId] || 0) + 1;
      });

      votesByAward[award._id] = friendsWithImages
        .map((friend) => ({
          friendId: friend._id,
          friendName: friend.name,
          friendImageUrl: friend.imageUrl,
          votes: voteCounts[friend._id] || 0,
        }))
        .sort((a, b) => b.votes - a.votes);
    });

    return { votesByAward, awards, friends };
  },
});

export const getVotingProgress = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    const awards = await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    // Count unique voters per award
    const votersByAward: Record<string, Set<string>> = {};
    votes.forEach((vote) => {
      if (!votersByAward[vote.awardId]) {
        votersByAward[vote.awardId] = new Set();
      }
      votersByAward[vote.awardId].add(vote.voterName);
    });

    return awards.map((award) => ({
      awardId: award._id,
      question: award.question,
      voterCount: votersByAward[award._id]?.size || 0,
    }));
  },
});

export const getVotersWhoVoted = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    // Return unique voter names who have cast at least one vote
    const voterNames = new Set(votes.map((v) => v.voterName));
    return Array.from(voterNames);
  },
});

export const clearAllVotes = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    // Get all votes for this lobby and delete them
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    return null;
  },
});
