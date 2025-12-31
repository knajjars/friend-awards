import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  lobbies: defineTable({
    name: v.string(),
    shareCode: v.string(),
    creatorId: v.optional(v.id("users")),
    isVotingOpen: v.boolean(),
    currentSlide: v.number(), // For presentation mode
    isPresentationMode: v.boolean(),
  }).index("by_share_code", ["shareCode"]),

  friends: defineTable({
    lobbyId: v.id("lobbies"),
    name: v.string(),
    imageId: v.optional(v.id("_storage")),
  }).index("by_lobby", ["lobbyId"]),

  awards: defineTable({
    lobbyId: v.id("lobbies"),
    question: v.string(),
    order: v.number(),
  }).index("by_lobby", ["lobbyId"]),

  votes: defineTable({
    lobbyId: v.id("lobbies"),
    awardId: v.id("awards"),
    friendId: v.id("friends"),
    voterName: v.string(), // Anonymous voter name
  }).index("by_lobby_and_award", ["lobbyId", "awardId"])
    .index("by_award", ["awardId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
