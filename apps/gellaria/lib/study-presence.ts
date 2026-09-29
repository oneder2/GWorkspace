import type { PublicPlayer } from "./protocol";

export const studySeats = [
  { position: [-2.25, .5, 2.6], rotation: -Math.PI / 2 },
  { position: [2.25, .5, 2.6], rotation: Math.PI / 2 },
  { position: [-2.25, .5, 0], rotation: -Math.PI / 2 },
  { position: [2.25, .5, 0], rotation: Math.PI / 2 },
  { position: [-2.25, .5, -2.6], rotation: -Math.PI / 2 },
  { position: [2.25, .5, -2.6], rotation: Math.PI / 2 },
] satisfies { position: [number, number, number]; rotation: number }[];

// Five remote seats; seat zero is always the local traveler, even when offline.
// Keep occupants in place and randomly fill vacancies only when membership changes.
export function selectStudyCompanions(previous: readonly (string | null)[], players: Record<string, PublicPlayer>, selfId: string | null, random = Math.random): (string | null)[] {
  const eligible = new Set(Object.values(players).filter((player) => player.id !== selfId && player.room === "night-study").map((player) => player.id));
  const used = new Set<string>();
  const seats = Array.from({ length: 5 }, (_, index) => {
    const id = previous[index];
    if (!id || !eligible.has(id) || used.has(id)) return null;
    used.add(id);
    return id;
  });
  const pool = [...eligible].filter((id) => !used.has(id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return seats.map((id) => id ?? pool.pop() ?? null);
}
