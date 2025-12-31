import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addAward = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    const existingAwards = await ctx.db.query("awards")
      .withIndex("by_lobby", q => q.eq("lobbyId", args.lobbyId))
      .collect();

    return await ctx.db.insert("awards", {
      lobbyId: args.lobbyId,
      question: args.question.trim(),
      order: existingAwards.length,
    });
  },
});

export const getAwards = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("awards")
      .withIndex("by_lobby", q => q.eq("lobbyId", args.lobbyId))
      .collect();
  },
});

export const removeAward = mutation({
  args: {
    awardId: v.id("awards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const award = await ctx.db.get(args.awardId);
    if (!award) {
      throw new Error("Award not found");
    }

    const lobby = await ctx.db.get(award.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.awardId);
    return null;
  },
});

export const updateNominees = mutation({
  args: {
    awardId: v.id("awards"),
    nomineeIds: v.array(v.id("friends")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const award = await ctx.db.get(args.awardId);
    if (!award) {
      throw new Error("Award not found");
    }

    const lobby = await ctx.db.get(award.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    // If empty array, set to undefined (means all friends are nominees)
    await ctx.db.patch(args.awardId, {
      nomineeIds: args.nomineeIds.length > 0 ? args.nomineeIds : undefined,
    });
    
    return null;
  },
});
