export type GroundDirection = readonly [x: number, z: number];

export function getCameraRelativeMovement(
  inputX: number,
  inputZ: number,
  cameraForwardX: number,
  cameraForwardZ: number,
): GroundDirection {
  const forwardLength = Math.hypot(cameraForwardX, cameraForwardZ);
  if (forwardLength === 0) return [0, 0];

  const forwardX = cameraForwardX / forwardLength;
  const forwardZ = cameraForwardZ / forwardLength;
  const rightX = -forwardZ;
  const rightZ = forwardX;
  const movementX = rightX * inputX - forwardX * inputZ;
  const movementZ = rightZ * inputX - forwardZ * inputZ;
  const movementLength = Math.hypot(movementX, movementZ);

  if (movementLength === 0) return [0, 0];
  return [movementX / movementLength, movementZ / movementLength];
}
