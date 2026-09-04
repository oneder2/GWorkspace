export type WorldPosition = readonly [x: number, y: number, z: number];
export type GroundPoint = readonly [x: number, z: number];

export const centralCourtyard: GroundPoint = [0, 1];

export function yawToward(position: WorldPosition, target: GroundPoint = centralCourtyard) {
  return Math.atan2(target[0] - position[0], target[1] - position[2]);
}

export function groundPointToward(
  position: WorldPosition,
  distance: number,
  target: GroundPoint = centralCourtyard,
): GroundPoint {
  const deltaX = target[0] - position[0];
  const deltaZ = target[1] - position[2];
  const length = Math.hypot(deltaX, deltaZ);
  if (length === 0) return [position[0], position[2]];
  return [
    position[0] + deltaX / length * distance,
    position[2] + deltaZ / length * distance,
  ];
}
