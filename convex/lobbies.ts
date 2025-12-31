import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const createLobby = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create a lobby");
    }

    let shareCode = generateShareCode();
    // Ensure unique share code
    while (await ctx.db.query("lobbies").withIndex("by_share_code", q => q.eq("shareCode", shareCode)).first()) {
      shareCode = generateShareCode();
    }

    const lobbyId = await ctx.db.insert("lobbies", {
      name: args.name,
      shareCode,
      creatorId: userId,
      isVotingOpen: false,
      currentSlide: 0,
      isPresentationMode: false,
    });

    return { lobbyId, shareCode };
  },
});

export const getLobbyByShareCode = query({
  args: {
    shareCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("lobbies")
      .withIndex("by_share_code", q => q.eq("shareCode", args.shareCode))
      .first();
  },
});

export const getLobby = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lobbyId);
  },
});

export const getUserLobbies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db.query("lobbies")
      .filter(q => q.eq(q.field("creatorId"), userId))
      .collect();
  },
});

export const toggleVoting = mutation({
  args: {
    lobbyId: v.id("lobbies"),
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

    await ctx.db.patch(args.lobbyId, {
      isVotingOpen: !lobby.isVotingOpen,
    });
  },
});

export const startPresentation = mutation({
  args: {
    lobbyId: v.id("lobbies"),
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

    await ctx.db.patch(args.lobbyId, {
      isPresentationMode: true,
      isVotingOpen: false,
      currentSlide: 0,
    });
  },
});

export const updateSlide = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    slide: v.number(),
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

    await ctx.db.patch(args.lobbyId, {
      currentSlide: args.slide,
    });
  },
});
