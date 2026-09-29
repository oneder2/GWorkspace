type Point = [number, number];
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

// Bridson 2D sampling: r/sqrt(2) grid, area-uniform annulus, 30 attempts.
export function forestSamples(seed = 8471, radius = 3.3): Point[] {
  const random = seededRandom(seed), cell = radius / Math.SQRT2;
  const points: Point[] = [[-10, -15]], active = [0], grid = new Map<string, number>();
  const coord = (p: Point) => [Math.floor((p[0] + 16) / cell), Math.floor((p[1] + 41) / cell)];
  grid.set(coord(points[0]).join(','), 0);
  while (active.length) {
    const slot = Math.floor(random() * active.length), source = points[active[slot]];
    let found = false;
    for (let k = 0; k < 30; k++) {
      const angle = random() * Math.PI * 2, distance = radius * Math.sqrt(1 + 3 * random());
      const point: Point = [source[0] + Math.cos(angle) * distance, source[1] + Math.sin(angle) * distance];
      if (point[0] < -16 || point[0] > 16 || point[1] < -41 || point[1] > 7) continue;
      const [gx, gz] = coord(point);
      let clear = true;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        const index = grid.get(`${gx + dx},${gz + dz}`);
        if (index !== undefined && Math.hypot(point[0] - points[index][0], point[1] - points[index][1]) < radius) clear = false;
      }
      if (!clear) continue;
      grid.set(`${gx},${gz}`, points.length); active.push(points.length); points.push(point); found = true; break;
    }
    if (!found) active.splice(slot, 1);
  }
  // Keep a quiet text clearing and leave collision-safe margins at walk boundaries.
  return points.filter(([x, z]) => Math.abs(x) > 6 && (Math.abs(x) < 11.8 || Math.abs(x) > 14.2) && (z < -41 || z > -38.7) && z < 5.5);
}

export type Branch = { from: [number, number, number]; to: [number, number, number]; radius: number; topRadius?: number };
export function treeSkeleton(seed: number, height: number, radius: number) {
  const random = seededRandom(seed), branches: Branch[] = [];
  const tips: [number, number, number][] = [];
  const trunkTop: [number, number, number] = [(random() - .5) * .4, height * .72, (random() - .5) * .4];
  let previous: [number, number, number] = [0, 0, 0];
  for (let i = 1; i <= 5; i++) {
    const t = i / 5;
    const next: [number, number, number] = [trunkTop[0] * t + Math.sin(t * Math.PI) * .18, trunkTop[1] * t, trunkTop[2] * t + Math.sin(t * Math.PI * 1.5) * .12];
    branches.push({ from: previous, to: next, radius: radius * (1.12 - (i - 1) / 5 * .45), topRadius: radius * (1.12 - t * .45) }); previous = next;
  }
  function grow(from: [number, number, number], angle: number, length: number, thickness: number, depth: number) {
    const to: [number, number, number] = [from[0] + Math.cos(angle) * length * .78, from[1] + length * .58, from[2] + Math.sin(angle) * length * .78];
    branches.push({ from, to, radius: thickness });
    if (depth === 0) { tips.push(to); return; }
    for (const turn of [-.7, .65]) grow(to, angle + turn + random() * .2, length * .58, thickness * .57, depth - 1);
  }
  for (let i = 0; i < 6; i++) {
    const y = height * (.57 + i * .052);
    grow([trunkTop[0] * y / trunkTop[1], y, trunkTop[2] * y / trunkTop[1]], i * 2.399963 + random() * .4, 1.35 + random() * .85, radius * .43, 2);
  }
  // Flared root buttresses anchor the silhouette without crossing the clearing.
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * .4; branches.push({ from: [0, .6, 0], to: [Math.cos(a) * .8, .015, Math.sin(a) * .8], radius: radius * .43 }); }
  return { branches, tips };
}
