import { z } from "zod";
import type { SpiritAppearance } from "./spirit-identity";

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("move"),
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.number(),
  }),
  z.object({
    type: z.literal("signal"),
    landmarkId: z.string().min(1).max(40),
  }),
  z.object({
    type: z.literal("tag"),
    landmarkId: z.string().min(1).max(40),
    value: z.string().min(1).max(20),
  }),
  z.object({
    type: z.literal("appearance"),
    appearance: z.object({
      palette: z.number().int().min(0).max(4),
      form: z.number().int().min(0).max(2),
    }),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type PublicPlayer = {
  id: string;
  color: string;
  appearance?: SpiritAppearance;
  position: [number, number, number];
  rotation: number;
};

export type WorldState = {
  signals: Record<string, number>;
  tags: Record<string, Record<string, number>>;
};

export type ServerMessage =
  | { type: "welcome"; id: string; color: string; players: PublicPlayer[]; world: WorldState }
  | { type: "joined"; player: PublicPlayer }
  | { type: "moved"; id: string; position: [number, number, number]; rotation: number }
  | { type: "appearance"; id: string; appearance: SpiritAppearance; color: string }
  | { type: "left"; id: string }
  | { type: "signal"; landmarkId: string; count: number; actorId: string }
  | { type: "tag"; landmarkId: string; value: string; count: number; actorId: string }
  | { type: "error"; message: string };
