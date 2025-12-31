import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

    // Group votes by award
    const votesByAward: Record<
      string,
      Array<{ friendId: string; friendName: string; votes: number }>
    > = {};

    awards.forEach((award) => {
      const awardVotes = votes.filter((v) => v.awardId === award._id);
      const voteCounts: Record<string, number> = {};

      awardVotes.forEach((vote) => {
        voteCounts[vote.friendId] = (voteCounts[vote.friendId] || 0) + 1;
      });

      votesByAward[award._id] = friends
        .map((friend) => ({
          friendId: friend._id,
          friendName: friend.name,
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
