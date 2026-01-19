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

    const existingAwards = await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    return await ctx.db.insert("awards", {
      lobbyId: args.lobbyId,
      question: args.question.trim(),
      order: existingAwards.length,
    });
  },
});

export const addAwardsBulk = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    questions: v.array(v.string()),
  },
  returns: v.object({
    added: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    // Get existing awards to determine order and avoid duplicates
    const existingAwards = await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    const existingQuestions = new Set(
      existingAwards.map((a) => a.question.toLowerCase().trim())
    );

    let currentOrder = existingAwards.length;
    let added = 0;
    let skipped = 0;

    for (const question of args.questions) {
      const trimmedQuestion = question.trim();
      // Skip empty questions or duplicates
      if (!trimmedQuestion || existingQuestions.has(trimmedQuestion.toLowerCase())) {
        skipped++;
        continue;
      }

      await ctx.db.insert("awards", {
        lobbyId: args.lobbyId,
        question: trimmedQuestion,
        order: currentOrder,
      });

      existingQuestions.add(trimmedQuestion.toLowerCase());
      currentOrder++;
      added++;
    }

    return { added, skipped };
  },
});

export const getAwards = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
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

export const updateAward = mutation({
  args: {
    awardId: v.id("awards"),
    question: v.string(),
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

    await ctx.db.patch(args.awardId, {
      question: args.question.trim(),
    });

    return null;
  },
});
