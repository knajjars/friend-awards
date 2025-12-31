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

    await ctx.db.patch(args.lobbyId, {
      currentSlide: args.slide,
    });
    return null;
  },
});

export const deleteLobby = mutation({
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
      throw new Error("Not authorized to delete this lobby");
    }

    // Delete all votes for this lobby
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_lobby_and_award", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete all awards for this lobby
    const awards = await ctx.db
      .query("awards")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();
    for (const award of awards) {
      await ctx.db.delete(award._id);
    }

    // Delete all friends for this lobby
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();
    for (const friend of friends) {
      // Delete associated image if exists
      if (friend.imageId) {
        await ctx.storage.delete(friend.imageId);
      }
      await ctx.db.delete(friend._id);
    }

    // Delete the lobby itself
    await ctx.db.delete(args.lobbyId);
    
    return null;
  },
});
