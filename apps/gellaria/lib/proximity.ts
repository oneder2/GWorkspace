export type GroundPoint = readonly [x: number, z: number];

export function isWithinInteractionRange(
  position: GroundPoint,
  target: GroundPoint,
  enterRadius: number,
  releaseRadius: number,
  wasNearby: boolean,
) {
  const radius = wasNearby ? releaseRadius : enterRadius;
  return Math.hypot(position[0] - target[0], position[1] - target[1]) <= radius;
}
