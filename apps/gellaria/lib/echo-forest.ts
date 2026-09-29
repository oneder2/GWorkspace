import type { Exhibit, MuseumPlan } from "./exhibition";
import { stableModelSeed } from "./project-model";
import { forestSamples } from './forest-generation';

export const forestColors = { night: "#071f26", moss: "#295549", leaf: "#497c67", text: "#d1e8ce", echo: "#bdafdd", bark: "#ac9169" };
export const forestPlan: MuseumPlan = {
  rooms: [{ id: "forest", title: "回声林地", kind: "echo-fragment", layout: "garden", centerZ: -17, width: 30, depth: 50, startIndex: 0, count: 0 }],
  slots: [], entranceZ: 6, backZ: -42, length: 49,
};
export function randomUnit(seed: string) { return stableModelSeed(seed) / 100000; }
export const FOREST_PERIOD = 48;
export function forestLoopCoordinate(z: number) { return ((z + 41) % FOREST_PERIOD + FOREST_PERIOD) % FOREST_PERIOD - 41; }
export function nearestForestEcho(z: number, observerZ: number) { return z + Math.round((observerZ - z) / FOREST_PERIOD) * FOREST_PERIOD; }
export function forestPathX(z: number) { return Math.sin((z - 7) / FOREST_PERIOD * Math.PI * 2) * 1.8; }
export function forestTreeVisible(tree: typeof forestTrees[number], index: number, variant: number) {
  return Math.abs(tree.position[2] + 18) > 5 || (index + variant) % 3 === 0;
}
export function constrainLoopForest(x: number, z: number, lap = 0): [number, number] {
  let safeX = Math.max(-13, Math.min(13, x)), safeZ = forestLoopCoordinate(z);
  const variant = lap + Math.round((safeZ - z) / FOREST_PERIOD);
  for (const [index, tree] of forestTrees.entries()) {
    const treeZ = nearestForestEcho(tree.position[2], safeZ);
    if (!forestTreeVisible(tree, index, variant - Math.round((treeZ - tree.position[2]) / FOREST_PERIOD))) continue;
    const dx = safeX - tree.position[0], dz = safeZ - treeZ, distance = Math.hypot(dx, dz), radius = tree.radius + .48;
    if (distance < radius) { safeX = tree.position[0] + (distance ? dx / distance : 1) * radius; safeZ = treeZ + (distance ? dz / distance : 0) * radius; }
  }
  return [Math.max(-13, Math.min(13, safeX)), forestLoopCoordinate(safeZ)];
}
export function echoGraphemes(text: string) {
  return [...new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(text)].map(item => item.segment);
}
export function echoText(exhibit: Exhibit) {
  const text = exhibit.presentation === "audio-echo" ? `${exhibit.title} · ${exhibit.summary}` : exhibit.summary || exhibit.title;
  return text.replace(/\s+/g, " ").trim();
}
export function echoPlacement(id: string, index: number, cycle = 0) {
  const r = (key: string) => randomUnit(`${id}:${cycle}:${key}`);
  // Zones remain near the same walkable clearing; only inactive-cycle positions
  // change. Depth, height, width and delay vary independently.
  return {
    position: [(index % 2 ? 1 : -1) * (2.2 + r("x") * 2.9), 1.6 + r("y") * 2.4, 1 - Math.floor(index / 2) * 5.4 - r("z") * 3.4] as [number, number, number],
    size: .22 + r("size") * .18,
    delay: index * 2.1 + r("delay") * 1.8,
  };
}
export function echoPhase(seconds: number, count: number, delay: number, reduced = false) {
  const reveal = count * .095;
  const hold = Math.max(5, count * .13);
  const erase = count * .055 + 2;
  const duration = reveal + hold + erase + 4;
  const time = Math.max(0, seconds - delay);
  const phase = time % duration;
  return reduced ? { cycle: 0, visible: count + 1, erased: -1, opacity: .9 } : {
    cycle: Math.floor(time / duration),
    visible: seconds < delay ? -1 : Math.min(count + 1, phase / .095),
    erased: phase < reveal + hold ? -1 : (phase - reveal - hold) / .055,
    opacity: seconds < delay || phase > reveal + hold + erase ? 0 : .9,
  };
}
export function advanceEchoTime(current: number, elapsed: number, count: number, delay: number, distance: number, reduced = false) {
  const phase = echoPhase(current, count, delay, reduced);
  const held = distance < 4.5 && phase.visible >= count && phase.erased < 0;
  return current + (held || reduced ? 0 : Math.max(0, elapsed));
}
export function echoVisualScale(base: number, distance: number, depth: number, projectionX: number, count: number, mobile: boolean) {
  const columns = Math.max(1, Math.min(mobile ? 8 : 12, count));
  // Cap projected width as echoes pass close to the camera, rather than letting
  // a nearby phrase grow beyond the screen edges.
  return Math.min(Math.max(base, distance * (mobile ? .022 : .024)), Math.max(0, depth) * 1.65 / (columns * projectionX));
}
export const forestTrees = forestSamples().map(([x, z], i) => {
  return {
    position: [x, 0, z] as [number, number, number],
    height: 7.2 + randomUnit(`tree-height:${i}`) * 3.2,
    radius: .18 + randomUnit(`tree-radius:${i}`) * .16,
  };
});

export function constrainForestPosition(x: number, z: number): [number, number] {
  let safeX = Math.max(-13, Math.min(13, x));
  let safeZ = Math.max(-40, Math.min(6.8, z));
  for (const tree of forestTrees) {
    const dx = safeX - tree.position[0], dz = safeZ - tree.position[2];
    const distance = Math.hypot(dx, dz), radius = tree.radius + .48;
    if (distance < radius) {
      safeX = tree.position[0] + (distance ? dx / distance : 1) * radius;
      safeZ = tree.position[2] + (distance ? dz / distance : 0) * radius;
    }
  }
  return [Math.max(-13, Math.min(13, safeX)), Math.max(-40, Math.min(6.8, safeZ))];
}
