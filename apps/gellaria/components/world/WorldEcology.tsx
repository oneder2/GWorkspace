"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const clearings = [
  [0, 1, 4.4],
  [11, 3, 4.6],
  [-3, -12, 4.3],
  [-12, 4, 4.4],
  [5, 11, 4.3],
] as const;

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(min: number, max: number, value: number) {
  const normalized = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function terrainHeightAt(x: number, z: number) {
  const radius = Math.hypot(x, z);
  const rolling = Math.sin(x * 0.36 + z * 0.09) * 0.14 + Math.cos(z * 0.31 - x * 0.08) * 0.11;
  const easternRidge = Math.exp(-(((x - 7) ** 2) / 34 + ((z + 4) ** 2) / 125)) * 0.52;
  const westernShoulder = Math.exp(-(((x + 9) ** 2) / 52 + ((z - 1) ** 2) / 90)) * 0.34;
  const northernFold = Math.exp(-(((x + 1) ** 2) / 90 + ((z + 12) ** 2) / 26)) * 0.42;
  const clearingWeight = Math.min(0.84, clearings.reduce((sum, [cx, cz, size]) => {
    const distance = Math.hypot(x - cx, z - cz);
    return sum + Math.exp(-(distance * distance) / (size * size));
  }, 0));
  return (rolling + easternRidge + westernShoulder + northernFold) * smoothstep(1.5, 8, radius) * (1 - clearingWeight);
}

function islandRadius(angle: number) {
  return 19.2 + Math.sin(angle * 3 + 0.4) * 0.65 + Math.cos(angle * 5 - 0.8) * 0.42 + Math.sin(angle * 9) * 0.18;
}

function buildTerrainGeometry() {
  const rings = 18;
  const segments = 64;
  const positions: number[] = [0, terrainHeightAt(0, 0), 0];
  const colors: number[] = [];
  const indices: number[] = [];
  const low = new THREE.Color("#384a3b");
  const high = new THREE.Color("#62705a");
  colors.push(low.r, low.g, low.b);

  for (let ring = 1; ring <= rings; ring += 1) {
    const radial = ring / rings;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const radius = islandRadius(angle) * radial;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrainHeightAt(x, z) - Math.pow(radial, 9) * 0.18;
      positions.push(x, y, z);
      const color = low.clone().lerp(high, THREE.MathUtils.clamp((y + 0.2) / 0.85, 0, 1));
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let segment = 0; segment < segments; segment += 1) {
    indices.push(0, 1 + segment, 1 + ((segment + 1) % segments));
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const inner = 1 + (ring - 1) * segments;
    const outer = 1 + ring * segments;
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(inner + segment, outer + segment, outer + next);
      indices.push(inner + segment, outer + next, inner + next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeContour(radius: number, seed: number) {
  const points = Array.from({ length: 96 }, (_, index) => {
    const angle = index / 96 * Math.PI * 2;
    const localRadius = radius + Math.sin(angle * 4 + seed) * 0.22 + Math.cos(angle * 7 - seed) * 0.1;
    const x = Math.cos(angle) * localRadius;
    const z = Math.sin(angle) * localRadius;
    return new THREE.Vector3(x, terrainHeightAt(x, z) + 0.035, z);
  });
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function IslandTerrain() {
  const geometry = useMemo(() => buildTerrainGeometry(), []);
  const contours = useMemo(() => [6.2, 9.7, 13.1, 16.2].map((radius, index) => makeContour(radius, index * 0.8)), []);
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.98} metalness={0.02} />
      </mesh>
      {contours.map((contour, index) => (
        <lineLoop key={index} geometry={contour}>
          <lineBasicMaterial color={index % 2 ? "#829176" : "#71816a"} transparent opacity={0.2} />
        </lineLoop>
      ))}
    </group>
  );
}

type Placement = { x: number; z: number; scale: number; rotation: number };

function distanceToSegment(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? THREE.MathUtils.clamp(((x - ax) * dx + (z - az) * dz) / lengthSquared, 0, 1) : 0;
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

function isOpenGround(x: number, z: number, padding: number) {
  if (clearings.some(([cx, cz, size]) => Math.hypot(x - cx, z - cz) < size + padding)) return false;
  const destinations = [[11, 3], [-3, -12], [-12, 4], [5, 11]];
  return destinations.every(([dx, dz]) => distanceToSegment(x, z, 0, 1.5, dx, dz) > 1.15 + padding);
}

function makePlacements(count: number, seedOffset: number, minRadius: number, maxRadius: number, padding = 0): Placement[] {
  const placements: Placement[] = [];
  for (let attempt = 0; attempt < count * 20 && placements.length < count; attempt += 1) {
    const seed = seedOffset + attempt * 5;
    const angle = seededValue(seed) * Math.PI * 2;
    const radius = minRadius + seededValue(seed + 1) * (maxRadius - minRadius);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isOpenGround(x, z, padding)) continue;
    placements.push({ x, z, scale: 0.75 + seededValue(seed + 2) * 0.65, rotation: seededValue(seed + 3) * Math.PI * 2 });
  }
  return placements;
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, placements: Placement[], transform: (item: Placement, dummy: THREE.Object3D) => void) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    placements.forEach((item, index) => {
      transform(item, dummy);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(index, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [placements, ref, transform]);
}

function ForestInstances() {
  const conifers = useMemo(() => makePlacements(25, 10, 7.8, 17.4, 0.15), []);
  const deciduous = useMemo(() => makePlacements(15, 610, 8.4, 17, 0.3), []);
  const coniferTrunks = useRef<THREE.InstancedMesh>(null);
  const coniferLower = useRef<THREE.InstancedMesh>(null);
  const coniferUpper = useRef<THREE.InstancedMesh>(null);
  const leafTrunks = useRef<THREE.InstancedMesh>(null);
  const leafCrowns = useRef<THREE.InstancedMesh>(null);

  useInstances(coniferTrunks, conifers, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + item.scale * 0.68, item.z);
    dummy.rotation.set(0, item.rotation, 0);
    dummy.scale.set(item.scale * 0.16, item.scale * 1.35, item.scale * 0.16);
  });
  useInstances(coniferLower, conifers, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + item.scale * 1.48, item.z);
    dummy.rotation.set(0, item.rotation, 0);
    dummy.scale.set(item.scale * 0.86, item.scale * 1.25, item.scale * 0.86);
  });
  useInstances(coniferUpper, conifers, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + item.scale * 2.16, item.z);
    dummy.rotation.set(0, -item.rotation * 0.6, 0);
    dummy.scale.set(item.scale * 0.62, item.scale, item.scale * 0.62);
  });
  useInstances(leafTrunks, deciduous, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + item.scale * 0.72, item.z);
    dummy.rotation.set(0.04, item.rotation, -0.04);
    dummy.scale.set(item.scale * 0.19, item.scale * 1.45, item.scale * 0.19);
  });
  useInstances(leafCrowns, deciduous, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + item.scale * 1.78, item.z);
    dummy.rotation.set(item.rotation * 0.08, item.rotation, -item.rotation * 0.04);
    dummy.scale.set(item.scale * 0.95, item.scale * 0.88, item.scale * 0.95);
  });

  return (
    <group>
      <instancedMesh ref={coniferTrunks} args={[undefined, undefined, conifers.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 1, 1, 6]} /><meshStandardMaterial color="#4a3b31" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={coniferLower} args={[undefined, undefined, conifers.length]} castShadow>
        <coneGeometry args={[1, 1, 7]} /><meshStandardMaterial color="#29483d" roughness={0.96} />
      </instancedMesh>
      <instancedMesh ref={coniferUpper} args={[undefined, undefined, conifers.length]} castShadow>
        <coneGeometry args={[1, 1, 7]} /><meshStandardMaterial color="#3d5b45" roughness={0.94} />
      </instancedMesh>
      <instancedMesh ref={leafTrunks} args={[undefined, undefined, deciduous.length]} castShadow>
        <cylinderGeometry args={[0.75, 1, 1, 6]} /><meshStandardMaterial color="#554437" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leafCrowns} args={[undefined, undefined, deciduous.length]} castShadow>
        <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#5b714d" roughness={0.98} />
      </instancedMesh>
    </group>
  );
}

function GroundDetails() {
  const grasses = useMemo(() => makePlacements(64, 1200, 5.8, 18.1, -0.55), []);
  const rocks = useMemo(() => makePlacements(18, 2200, 5.2, 18.2, -0.35), []);
  const grassA = useRef<THREE.InstancedMesh>(null);
  const grassB = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  useInstances(grassA, grasses, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + 0.18 * item.scale, item.z);
    dummy.rotation.set(0.16, item.rotation, 0.32);
    dummy.scale.set(0.07 * item.scale, 0.38 * item.scale, 0.07 * item.scale);
  });
  useInstances(grassB, grasses, (item, dummy) => {
    dummy.position.set(item.x + 0.11, terrainHeightAt(item.x, item.z) + 0.15 * item.scale, item.z - 0.08);
    dummy.rotation.set(-0.24, item.rotation + 1.4, -0.22);
    dummy.scale.set(0.06 * item.scale, 0.32 * item.scale, 0.06 * item.scale);
  });
  useInstances(rockRef, rocks, (item, dummy) => {
    dummy.position.set(item.x, terrainHeightAt(item.x, item.z) + 0.11 * item.scale, item.z);
    dummy.rotation.set(item.rotation * 0.08, item.rotation, item.rotation * 0.06);
    dummy.scale.set(0.22 * item.scale, 0.14 * item.scale, 0.28 * item.scale);
  });
  const mushrooms = useMemo(() => makePlacements(9, 3300, 8, 16.8, -0.2), []);

  return (
    <group>
      <instancedMesh ref={grassA} args={[undefined, undefined, grasses.length]}>
        <coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color="#81905c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={grassB} args={[undefined, undefined, grasses.length]}>
        <coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color="#596f4d" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#53615a" roughness={1} />
      </instancedMesh>
      {mushrooms.map((item, index) => (
        <group key={index} position={[item.x, terrainHeightAt(item.x, item.z), item.z]} rotation-y={item.rotation} scale={item.scale}>
          <mesh position-y={0.12}><cylinderGeometry args={[0.035, 0.055, 0.24, 6]} /><meshStandardMaterial color="#d8c9aa" /></mesh>
          <mesh position-y={0.26} scale-y={0.5}><sphereGeometry args={[0.14, 8, 5]} /><meshStandardMaterial color={index % 3 === 0 ? "#c97a58" : "#a69d72"} roughness={0.95} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Fox() {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime * 0.16;
    const x = -7.8 + Math.cos(t) * 2.15;
    const z = 7.3 + Math.sin(t * 0.82) * 1.55;
    const nextX = -7.8 + Math.cos(t + 0.02) * 2.15;
    const nextZ = 7.3 + Math.sin((t + 0.02) * 0.82) * 1.55;
    group.current.position.set(x, terrainHeightAt(x, z) + 0.2 + Math.abs(Math.sin(t * 9)) * 0.035, z);
    group.current.rotation.y = Math.atan2(nextX - x, nextZ - z);
    if (tail.current) tail.current.rotation.z = -0.55 + Math.sin(clock.elapsedTime * 2.1) * 0.16;
  });
  return (
    <group ref={group} scale={0.65}>
      <mesh castShadow position-y={0.45} scale={[0.9, 0.55, 1.35]}><dodecahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color="#b76543" roughness={0.92} /></mesh>
      <group position={[0, 0.68, 0.65]}>
        <mesh castShadow scale={[0.72, 0.72, 0.86]}><dodecahedronGeometry args={[0.38, 0]} /><meshStandardMaterial color="#c9774f" roughness={0.9} /></mesh>
        <mesh position={[0, -0.08, 0.35]} rotation-x={Math.PI / 2}><coneGeometry args={[0.18, 0.42, 5]} /><meshStandardMaterial color="#e2c59e" /></mesh>
        {[-0.19, 0.19].map((x) => <mesh key={x} position={[x, 0.3, 0]}><coneGeometry args={[0.12, 0.38, 4]} /><meshStandardMaterial color="#8c4636" /></mesh>)}
      </group>
      {[-0.23, 0.23].flatMap((x) => [-0.34, 0.34].map((z) => <mesh key={`${x}:${z}`} position={[x, 0.12, z]}><cylinderGeometry args={[0.055, 0.07, 0.38, 5]} /><meshStandardMaterial color="#4a3a35" /></mesh>))}
      <group ref={tail} position={[0, 0.55, -0.58]} rotation-x={-0.18} rotation-z={-0.55}>
        <mesh position-y={-0.45}><coneGeometry args={[0.22, 1.05, 7]} /><meshStandardMaterial color="#ad5c40" roughness={0.96} /></mesh>
        <mesh position-y={-0.92}><coneGeometry args={[0.14, 0.32, 7]} /><meshStandardMaterial color="#e5d2b5" roughness={0.96} /></mesh>
      </group>
    </group>
  );
}

function Rabbit() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = terrainHeightAt(8.6, 8.2) + 0.12 + Math.max(0, Math.sin(clock.elapsedTime * 1.3 - 0.8)) * 0.06;
    group.current.rotation.y = -0.7 + Math.sin(clock.elapsedTime * 0.35) * 0.22;
  });
  return (
    <group ref={group} position={[8.6, 0.1, 8.2]} scale={0.56}>
      <mesh castShadow position-y={0.36} scale={[0.72, 0.8, 1]}><dodecahedronGeometry args={[0.42, 0]} /><meshStandardMaterial color="#9b9587" roughness={1} /></mesh>
      <mesh castShadow position={[0, 0.76, 0.24]}><dodecahedronGeometry args={[0.3, 0]} /><meshStandardMaterial color="#aaa395" roughness={1} /></mesh>
      {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 1.12, 0.18]} scale={[0.45, 1.35, 0.42]}><capsuleGeometry args={[0.11, 0.28, 3, 6]} /><meshStandardMaterial color="#b5aa9d" /></mesh>)}
      <mesh position={[0, 0.5, -0.38]}><sphereGeometry args={[0.17, 8, 6]} /><meshStandardMaterial color="#d2c9b5" /></mesh>
      <mesh position={[0, 0.7, 0.53]}><sphereGeometry args={[0.045, 7, 5]} /><meshStandardMaterial color="#2a2423" /></mesh>
    </group>
  );
}

function Moth({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const center = useMemo(() => ({
    x: -5 + seededValue(index + 91) * 11,
    z: -6 + seededValue(index + 121) * 12,
    y: 1.25 + seededValue(index + 141) * 1.5,
  }), [index]);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime + index * 1.8;
    if (group.current) {
      group.current.position.set(center.x + Math.cos(time * 0.7) * 0.8, center.y + Math.sin(time * 1.4) * 0.22, center.z + Math.sin(time * 0.65) * 0.7);
      group.current.rotation.y = -time * 0.7;
    }
    const flap = 0.3 + Math.sin(time * 8) * 0.72;
    if (leftWing.current) leftWing.current.rotation.y = flap;
    if (rightWing.current) rightWing.current.rotation.y = -flap;
  });
  return (
    <group ref={group} scale={0.32}>
      <mesh><capsuleGeometry args={[0.08, 0.26, 3, 5]} /><meshStandardMaterial color="#d8b977" emissive="#b9894f" emissiveIntensity={0.7} /></mesh>
      <mesh ref={leftWing} position-x={-0.18} rotation-z={0.24} scale={[1, 0.18, 0.72]}><circleGeometry args={[0.3, 8]} /><meshStandardMaterial color="#dbc88b" side={THREE.DoubleSide} transparent opacity={0.82} /></mesh>
      <mesh ref={rightWing} position-x={0.18} rotation-z={-0.24} scale={[1, 0.18, 0.72]}><circleGeometry args={[0.3, 8]} /><meshStandardMaterial color="#dbc88b" side={THREE.DoubleSide} transparent opacity={0.82} /></mesh>
      <pointLight color="#e8c87d" intensity={0.7} distance={1.5} />
    </group>
  );
}

function FireflyDrift() {
  const group = useRef<THREE.Group>(null);
  const lights = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    x: -14 + seededValue(index + 410) * 10,
    y: 0.7 + seededValue(index + 440) * 2.2,
    z: -1 + seededValue(index + 470) * 10,
    scale: 0.55 + seededValue(index + 490) * 0.8,
  })), []);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.09) * 0.12;
      group.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.08;
    }
  });
  return (
    <group ref={group}>
      {lights.map((light, index) => (
        <mesh key={index} position={[light.x, light.y, light.z]} scale={light.scale}>
          <sphereGeometry args={[0.035, 6, 5]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#e6cf84" : "#a7d58b"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function WorldEcology() {
  return (
    <group>
      <ForestInstances />
      <GroundDetails />
      <Fox />
      <Rabbit />
      {Array.from({ length: 5 }, (_, index) => <Moth key={index} index={index} />)}
      <FireflyDrift />
    </group>
  );
}
