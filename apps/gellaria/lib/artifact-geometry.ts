import type { ArtifactDesign } from './artifact';

// All curves fit the exhibit's fixed footprint; no executable expressions cross the API.
export function sculpturePoint(t: number, geometry: ArtifactDesign['geometry']): [number, number, number] {
  const a = t * Math.PI * 2, { p, q, lobes, phase, family } = geometry;
  if (family === 'torus-knot') {
    const r = .54 + .19 * Math.cos(q * a);
    return [r * Math.cos(p * a), .68 + .27 * Math.sin(q * a), r * Math.sin(p * a)];
  }
  if (family === 'superformula') {
    const r = .62 * Math.pow(Math.pow(Math.abs(Math.cos(lobes * a / 4)), 1.7) + Math.pow(Math.abs(Math.sin(lobes * a / 4)), 1.7), -.7);
    return [r * Math.cos(a), .68 + .32 * Math.sin(3 * a), r * Math.sin(a)];
  }
  return [.72 * Math.sin(p * a + phase), .68 + .43 * Math.sin(q * a), .58 * Math.sin(3 * a + phase)];
}

export function designDetail(level: number) {
  return { segments: Math.min(224, 32 + level * 10), ornaments: Math.min(56, 2 + level * 3) };
}
