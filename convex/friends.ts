import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addFriend = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    name: v.string(),
    imageId: v.optional(v.id("_storage")),
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

    return await ctx.db.insert("friends", {
      lobbyId: args.lobbyId,
      name: args.name.trim(),
      imageId: args.imageId,
    });
  },
});

export const getFriends = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .collect();

    return Promise.all(
      friends.map(async (friend) => ({
        ...friend,
        imageUrl: friend.imageId ? await ctx.storage.getUrl(friend.imageId) : null,
      }))
    );
  },
});

export const removeFriend = mutation({
  args: {
    friendId: v.id("friends"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("Friend not found");
    }

    const lobby = await ctx.db.get(friend.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.friendId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateFriendImage = mutation({
  args: {
    friendId: v.id("friends"),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("Friend not found");
    }

    const lobby = await ctx.db.get(friend.lobbyId);
    if (!lobby || lobby.creatorId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.friendId, {
      imageId: args.imageId,
    });
  },
});
