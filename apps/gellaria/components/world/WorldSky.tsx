"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function makeSkyStars(count: number, seed: number, minHeight: number, radiusMin: number, radiusRange: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = seededValue(seed + index * 5) * Math.PI * 2;
    const height = minHeight + Math.pow(seededValue(seed + index * 5 + 1), 0.72) * (0.98 - minHeight);
    const horizontal = Math.sqrt(Math.max(0, 1 - height * height));
    const radius = radiusMin + seededValue(seed + index * 5 + 2) * radiusRange;
    positions[index * 3] = Math.cos(angle) * horizontal * radius;
    positions[index * 3 + 1] = height * radius;
    positions[index * 3 + 2] = Math.sin(angle) * horizontal * radius;
  }
  return positions;
}

function makeStarBand(count: number) {
  const positions = new Float32Array(count * 3);
  const axis = new THREE.Vector3(0.24, 0.91, 0.34).normalize();
  const tangent = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
  const bitangent = new THREE.Vector3().crossVectors(axis, tangent).normalize();
  for (let index = 0; index < count; index += 1) {
    const arc = seededValue(4700 + index * 4) * Math.PI * 2;
    const width = (seededValue(4701 + index * 4) - 0.5) * 0.17;
    const radius = 76 + seededValue(4702 + index * 4) * 5;
    const direction = tangent.clone().multiplyScalar(Math.cos(arc)).add(bitangent.clone().multiplyScalar(Math.sin(arc)));
    direction.lerp(axis, width).normalize().multiplyScalar(radius);
    if (direction.y < -8) direction.y = Math.abs(direction.y) * 0.45 + 8;
    positions.set([direction.x, direction.y, direction.z], index * 3);
  }
  return positions;
}

function makeVoidStarRing(count: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = seededValue(8900 + index * 4) * Math.PI * 2;
    const radius = 27 + Math.sqrt(seededValue(8901 + index * 4)) * 51;
    positions.set([
      Math.cos(angle) * radius,
      0.45 + seededValue(8902 + index * 4) * 0.18,
      Math.sin(angle) * radius,
    ], index * 3);
  }
  return positions;
}

function makeOceanReflections(count: number, seedOffset: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = seededValue(seedOffset + index * 4) * Math.PI * 2;
    const radius = 19.75 + seededValue(seedOffset + 1 + index * 4) * 4;
    positions.set([
      Math.cos(angle) * radius,
      1.235 + seededValue(seedOffset + 2 + index * 4) * 0.012,
      Math.sin(angle) * radius,
    ], index * 3);
  }
  return positions;
}

const constellations = [
  [[-54, 34, -43], [-38, 52, -48], [-17, 45, -65], [1, 61, -54], [21, 48, -62]],
  [[44, 27, -55], [55, 42, -40], [66, 31, -24], [54, 57, -28]],
  [[-61, 25, 21], [-48, 42, 35], [-29, 33, 58], [-8, 49, 60]],
] as const;

function ConstellationLines() {
  return (
    <group>
      {constellations.map((points, constellationIndex) => {
        const positions: number[] = [];
        points.slice(0, -1).forEach((point, index) => positions.push(...point, ...points[index + 1]));
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        return (
          <group key={constellationIndex}>
            <lineSegments geometry={geometry}><lineBasicMaterial color="#8eb8c2" transparent opacity={0.2} fog={false} depthWrite={false} /></lineSegments>
            {points.map((point, index) => <mesh key={index} position={point}><sphereGeometry args={[0.22, 6, 5]} /><meshBasicMaterial color="#e8dda9" fog={false} toneMapped={false} /></mesh>)}
          </group>
        );
      })}
    </group>
  );
}

export function WorldSky() {
  const sky = useRef<THREE.Group>(null);
  const dimMaterial = useRef<THREE.PointsMaterial>(null);
  const brightMaterial = useRef<THREE.PointsMaterial>(null);
  const dimStars = useMemo(() => makeSkyStars(1650, 120, -0.08, 73, 9), []);
  const brightStars = useMemo(() => makeSkyStars(280, 2300, 0.04, 70, 8), []);
  const voidStars = useMemo(() => makeSkyStars(620, 6200, -0.92, 74, 7), []);
  const voidStarRing = useMemo(() => makeVoidStarRing(980), []);
  const oceanReflections = useMemo(() => makeOceanReflections(520, 10800), []);
  const brightOceanReflections = useMemo(() => makeOceanReflections(90, 13200), []);
  const starBand = useMemo(() => makeStarBand(720), []);

  useFrame(({ clock }, delta) => {
    if (sky.current) sky.current.rotation.y += delta * 0.0018;
    if (dimMaterial.current) dimMaterial.current.opacity = 0.78 + Math.sin(clock.elapsedTime * 0.16) * 0.04;
    if (brightMaterial.current) brightMaterial.current.opacity = 0.94 + Math.sin(clock.elapsedTime * 0.34 + 1.2) * 0.05;
  });

  return (
    <group ref={sky} position-y={-2}>
      <mesh>
        <sphereGeometry args={[88, 48, 28]} />
        <shaderMaterial
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
          vertexShader={`varying vec3 vPosition; void main() { vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying vec3 vPosition; void main() { float h = clamp(normalize(vPosition).y * 0.72 + 0.38, 0.0, 1.0); vec3 horizon = vec3(0.055, 0.135, 0.17); vec3 zenith = vec3(0.008, 0.018, 0.055); vec3 color = mix(horizon, zenith, smoothstep(0.08, 0.92, h)); gl_FragColor = vec4(color, 1.0); }`}
        />
      </mesh>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dimStars, 3]} /></bufferGeometry>
        <pointsMaterial ref={dimMaterial} color="#b9d2db" size={1.7} transparent opacity={0.8} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[brightStars, 3]} /></bufferGeometry>
        <pointsMaterial ref={brightMaterial} color="#fff0bd" size={2.8} transparent opacity={0.96} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[voidStars, 3]} /></bufferGeometry>
        <pointsMaterial color="#a8c7d0" size={1.85} transparent opacity={0.64} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[voidStarRing, 3]} /></bufferGeometry>
        <pointsMaterial color="#c5dbe0" size={1.65} transparent opacity={0.72} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[oceanReflections, 3]} /></bufferGeometry>
        <pointsMaterial color="#c7dce1" size={1.75} transparent opacity={0.72} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[brightOceanReflections, 3]} /></bufferGeometry>
        <pointsMaterial color="#ffe8ad" size={2.45} transparent opacity={0.84} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <points rotation-z={-0.22}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[starBand, 3]} /></bufferGeometry>
        <pointsMaterial color="#9fbfcb" size={1.35} transparent opacity={0.31} sizeAttenuation={false} fog={false} depthWrite={false} toneMapped={false} />
      </points>
      <ConstellationLines />
    </group>
  );
}
