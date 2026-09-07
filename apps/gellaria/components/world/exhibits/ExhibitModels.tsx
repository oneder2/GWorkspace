"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Exhibit, ExhibitKind } from "@/lib/exhibition";
import { deriveProjectModelSpec, stableModelSeed, type ProjectModelSpec } from "@/lib/project-model";

type ModelProps = { exhibit: Exhibit; active: boolean; accent: string };

function ProjectSurface({ spec, tone = "primary", glow = 0.16 }: {
  spec: ProjectModelSpec;
  tone?: "primary" | "secondary" | "glow";
  glow?: number;
}) {
  const color = spec[tone];
  const finish = {
    brass: { metalness: 0.82, roughness: 0.24, clearcoat: 0.28, transmission: 0, opacity: 1 },
    ceramic: { metalness: 0.06, roughness: 0.68, clearcoat: 0.42, transmission: 0, opacity: 1 },
    glass: { metalness: 0.08, roughness: 0.12, clearcoat: 0.8, transmission: 0.48, opacity: 0.82 },
    graphite: { metalness: 0.48, roughness: 0.52, clearcoat: 0.12, transmission: 0, opacity: 1 },
    alloy: { metalness: 0.7, roughness: 0.34, clearcoat: 0.36, transmission: 0, opacity: 1 },
  }[spec.material];

  return (
    <meshPhysicalMaterial
      color={color}
      emissive={spec.glow}
      emissiveIntensity={glow}
      metalness={finish.metalness}
      roughness={finish.roughness}
      clearcoat={finish.clearcoat}
      transmission={finish.transmission}
      transparent={finish.opacity < 1}
      opacity={finish.opacity}
    />
  );
}

export function SemanticExhibitModel({ exhibit, kind, active, accent }: ModelProps & { kind: ExhibitKind }) {
  if (kind === "project-model") return <ProjectArtifact exhibit={exhibit} active={active} />;
  if (kind === "blog-constellation") return <BlogConstellation exhibit={exhibit} active={active} accent={accent} />;
  if (kind === "daily-signal") return <DailyLightPage exhibit={exhibit} active={active} accent={accent} />;
  if (kind === "echo-fragment") return <EchoFragment exhibit={exhibit} active={active} accent={accent} />;
  if (kind === "audio-echo") return <AudioEcho exhibit={exhibit} active={active} accent={accent} />;
  return <SignalInstrument exhibit={exhibit} active={active} accent={accent} />;
}

function projectSpec(exhibit: Exhibit): ProjectModelSpec {
  return exhibit.modelSpec ?? deriveProjectModelSpec({
    slug: exhibit.sourceKey ?? exhibit.id,
    title: exhibit.title,
    summary: exhibit.summary,
    technologies: exhibit.tags ?? [],
  });
}

function ProjectArtifact({ exhibit, active }: Omit<ModelProps, "accent">) {
  const spec = projectSpec(exhibit);
  const root = useRef<THREE.Group>(null);
  const moving = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.PointLight>(null);
  useFrame(({ clock }, delta) => {
    if (!root.current || !moving.current) return;
    const speed = active ? 0.82 : 0.16;
    if (spec.motion === "counterspin") moving.current.rotation.y -= delta * speed;
    else if (spec.motion === "scan") moving.current.rotation.z = Math.sin(clock.elapsedTime * speed) * 0.48;
    else moving.current.rotation.y += delta * speed;
    const breathing = spec.motion === "breathe" || spec.motion === "pulse"
      ? 1 + Math.sin(clock.elapsedTime * (active ? 2.2 : 0.8)) * (active ? 0.055 : 0.02)
      : 1;
    root.current.scale.lerp(new THREE.Vector3(breathing, breathing, breathing), Math.min(1, delta * 6));
    if (pulse.current) pulse.current.intensity = (active ? 2.8 : 0.7) + Math.sin(clock.elapsedTime * 1.8) * 0.22;
  });

  return (
    <group ref={root} position-y={0.78} scale={0.9}>
      <ProjectFrame spec={spec} />
      <group ref={moving}>
        {spec.archetype === "orbital-core" && <OrbitalCore spec={spec} />}
        {spec.archetype === "stacked-tower" && <StackedTower spec={spec} />}
        {spec.archetype === "bridge-network" && <BridgeNetwork spec={spec} />}
        {spec.archetype === "signal-array" && <SignalArray spec={spec} />}
        {spec.archetype === "archive-engine" && <ArchiveEngine spec={spec} />}
      </group>
      <pointLight ref={pulse} color={spec.glow} intensity={active ? 2.8 : 0.7} distance={4.6} decay={2} />
    </group>
  );
}

function ProjectFrame({ spec }: { spec: ProjectModelSpec }) {
  const radius = 0.68 + spec.complexity * 0.045;
  return (
    <group>
      <mesh castShadow position-y={-0.56}><cylinderGeometry args={[0.72, 0.86, 0.22, 12]} /><meshStandardMaterial color="#3d3b39" metalness={0.55} roughness={0.42} /></mesh>
      <mesh position-y={-0.43} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.035, 6, 38]} /><meshStandardMaterial color={spec.secondary} emissive={spec.glow} emissiveIntensity={0.34} metalness={0.72} roughness={0.28} /></mesh>
      {Array.from({ length: spec.elements.bridges }, (_, index) => {
        const angle = index / spec.elements.bridges * Math.PI * 2 + spec.seed * 0.0001;
        return <mesh key={index} position={[Math.cos(angle) * radius, -0.27, Math.sin(angle) * radius]} rotation-z={angle}><boxGeometry args={[0.09, 0.52, 0.09]} /><meshStandardMaterial color={spec.primary} metalness={0.62} roughness={0.34} /></mesh>;
      })}
    </group>
  );
}

function OrbitalCore({ spec }: { spec: ProjectModelSpec }) {
  return <group><mesh castShadow><icosahedronGeometry args={[0.44, 2]} /><ProjectSurface spec={spec} glow={0.45} /></mesh><ModelOrbits spec={spec} /></group>;
}

function StackedTower({ spec }: { spec: ProjectModelSpec }) {
  const levels = Math.max(3, spec.complexity + spec.elements.towers);
  return (
    <group position-y={-0.08}>
      {Array.from({ length: levels }, (_, index) => {
        const width = 0.72 - index * 0.065;
        return <mesh key={index} castShadow position-y={index * 0.18} rotation-y={(index % 2 ? 1 : -1) * (0.12 + spec.seed % 9 * 0.01)}><cylinderGeometry args={[width * 0.72, width, 0.15, 6]} /><ProjectSurface spec={spec} tone={index % 2 ? "secondary" : "primary"} glow={index === levels - 1 ? 0.48 : 0.08} /></mesh>;
      })}
      <mesh position-y={levels * 0.18 + 0.06}><octahedronGeometry args={[0.18, 1]} /><meshStandardMaterial color={spec.glow} emissive={spec.glow} emissiveIntensity={1.2} /></mesh>
    </group>
  );
}

function BridgeNetwork({ spec }: { spec: ProjectModelSpec }) {
  const nodes = useMemo(() => Array.from({ length: spec.elements.satellites }, (_, index) => {
    const angle = index / spec.elements.satellites * Math.PI * 2;
    const radius = 0.48 + ((spec.seed >> index) & 1) * 0.2;
    return new THREE.Vector3(Math.cos(angle) * radius, (index % 3 - 1) * 0.23, Math.sin(angle) * radius);
  }), [spec]);
  const lines = useMemo(() => {
    const positions: number[] = [];
    nodes.forEach((node, index) => positions.push(...node.toArray(), ...nodes[(index + 1) % nodes.length].toArray(), 0, 0, 0, ...node.toArray()));
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  }, [nodes]);
  return <group><lineSegments geometry={lines}><lineBasicMaterial color={spec.secondary} transparent opacity={0.82} /></lineSegments>{nodes.map((node, index) => <mesh key={index} castShadow position={node}><dodecahedronGeometry args={[index === 0 ? 0.2 : 0.13, 0]} /><ProjectSurface spec={spec} tone={index % 2 ? "primary" : "glow"} glow={0.42} /></mesh>)}</group>;
}

function SignalArray({ spec }: { spec: ProjectModelSpec }) {
  const count = Math.max(3, spec.elements.satellites);
  return <group><mesh castShadow scale-y={1.35}><octahedronGeometry args={[0.32, 1]} /><ProjectSurface spec={spec} glow={0.55} /></mesh>{Array.from({ length: count }, (_, index) => { const angle = index / count * Math.PI * 2; return <group key={index} position={[Math.cos(angle) * 0.7, -0.08 + index % 2 * 0.25, Math.sin(angle) * 0.7]} rotation-y={-angle}><mesh rotation-x={-0.7}><cylinderGeometry args={[0.2, 0.04, 0.08, 14]} /><ProjectSurface spec={spec} tone="secondary" glow={0.08} /></mesh><mesh position-y={-0.3}><cylinderGeometry args={[0.025, 0.045, 0.54, 7]} /><meshStandardMaterial color="#66706d" metalness={0.5} /></mesh></group>; })}</group>;
}

function ArchiveEngine({ spec }: { spec: ProjectModelSpec }) {
  return <group>{Array.from({ length: spec.complexity }, (_, index) => <mesh key={index} castShadow position={[0, -0.28 + index * 0.18, 0]} rotation-y={(index % 2 ? -1 : 1) * (0.2 + index * 0.06)}><boxGeometry args={[1.02 - index * 0.08, 0.13, 0.68 - index * 0.035]} /><ProjectSurface spec={spec} tone={index % 2 ? "secondary" : "primary"} glow={index === spec.complexity - 1 ? 0.32 : 0.04} /></mesh>)}<mesh position-y={0.55} rotation-x={Math.PI / 2}><torusGeometry args={[0.36, 0.07, 7, 28]} /><ProjectSurface spec={spec} tone="glow" glow={0.8} /></mesh><mesh position-y={0.55}><sphereGeometry args={[0.13, 12, 8]} /><meshStandardMaterial color="#f3ead4" emissive={spec.glow} emissiveIntensity={1.1} /></mesh></group>;
}

function ModelOrbits({ spec }: { spec: ProjectModelSpec }) {
  const ringCount = Math.max(1, spec.elements.rings);
  return <>{Array.from({ length: ringCount }, (_, index) => <mesh key={index} rotation={[0.45 + index * 0.55, index * 0.7, 0]}><torusGeometry args={[0.58 + index * 0.13, 0.018 + index * 0.006, 5, 42]} /><meshBasicMaterial color={index % 2 ? spec.secondary : spec.glow} transparent opacity={0.74 - index * 0.1} /></mesh>)}</>;
}

function BlogConstellation({ exhibit, active, accent }: ModelProps) {
  const orbit = useRef<THREE.Group>(null);
  const seed = stableModelSeed(`${exhibit.id}:${exhibit.title}`);
  const points = useMemo(() => Array.from({ length: 5 + seed % 4 }, (_, index) => {
    const angle = index * 2.399 + seed * 0.001;
    const radius = 0.28 + index * 0.105;
    return new THREE.Vector3(Math.cos(angle) * radius, ((seed >> index) % 5 - 2) * 0.12, Math.sin(angle) * radius);
  }), [seed]);
  const geometry = useMemo(() => {
    const positions: number[] = [];
    points.slice(1).forEach((point, index) => positions.push(...points[index].toArray(), ...point.toArray()));
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  }, [points]);
  useFrame(({ clock }, delta) => {
    if (!orbit.current) return;
    orbit.current.rotation.y += delta * (active ? 0.42 : 0.07);
    orbit.current.rotation.z = Math.sin(clock.elapsedTime * 0.17 + seed) * 0.08;
  });
  return <group ref={orbit} position-y={1.05} rotation-x={0.22}><lineSegments geometry={geometry}><lineBasicMaterial color={accent} transparent opacity={active ? 0.9 : 0.44} /></lineSegments>{points.map((point, index) => <mesh key={index} position={point}><sphereGeometry args={[index === 0 ? 0.13 : 0.065 + (seed + index) % 3 * 0.012, 12, 8]} /><meshStandardMaterial color={index === 0 ? "#f3f0df" : "#b8d5e1"} emissive={accent} emissiveIntensity={active ? 1.8 : 0.6} /></mesh>)}<mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.88, 0.012, 4, 56]} /><meshBasicMaterial color="#7595a4" transparent opacity={0.22} /></mesh></group>;
}

function DailyLightPage({ exhibit, active, accent }: ModelProps) {
  const page = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const seed = stableModelSeed(exhibit.id);
  useFrame(({ clock }) => {
    if (page.current) page.current.rotation.y = Math.sin(clock.elapsedTime * 0.45 + seed) * 0.16;
    if (scan.current) scan.current.position.y = -0.38 + ((clock.elapsedTime * (active ? 0.52 : 0.2)) % 1) * 0.76;
  });
  return <group ref={page} position-y={1.02}><mesh castShadow rotation-y={-0.12}><boxGeometry args={[0.76, 1.12, 0.08]} /><meshStandardMaterial color="#d7d2bc" emissive={accent} emissiveIntensity={active ? 0.5 : 0.16} roughness={0.58} /></mesh><mesh castShadow position={[0.43, -0.02, 0]} rotation-y={0.22}><boxGeometry args={[0.76, 1.06, 0.08]} /><meshStandardMaterial color="#c9c7b8" emissive={accent} emissiveIntensity={active ? 0.42 : 0.12} roughness={0.62} /></mesh><mesh ref={scan} position={[0.2, 0, 0.07]}><boxGeometry args={[0.92, 0.025, 0.018]} /><meshBasicMaterial color="#fff4bd" transparent opacity={0.88} /></mesh>{[-0.22, 0, 0.22].map((y) => <mesh key={y} position={[-0.12, y, 0.065]}><boxGeometry args={[0.38, 0.018, 0.012]} /><meshBasicMaterial color="#6c7d80" transparent opacity={0.5} /></mesh>)}<pointLight color={accent} intensity={active ? 2.4 : 0.7} distance={4} /></group>;
}

function EchoFragment({ exhibit, active, accent }: ModelProps) {
  const root = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Group>(null);
  const seed = stableModelSeed(exhibit.id);
  useFrame(({ clock }) => {
    if (root.current) {
      root.current.position.y = 0.96 + Math.sin(clock.elapsedTime * 0.68 + seed) * 0.12;
      root.current.rotation.y = Math.sin(clock.elapsedTime * 0.21 + seed) * 0.28;
    }
    if (ripple.current) {
      const phase = (clock.elapsedTime * (active ? 0.55 : 0.18) + seed * 0.01) % 1;
      ripple.current.scale.setScalar(0.72 + phase * 0.75);
    }
  });
  return <group ref={root}><mesh castShadow rotation={[0.2, seed * 0.01, 0.18]} scale={[0.62, 1.1, 0.38]}><octahedronGeometry args={[0.42, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 0.78 : 0.22} transparent opacity={0.82} roughness={0.48} /></mesh><mesh position-y={-0.62}><cylinderGeometry args={[0.025, 0.08, 0.92, 6]} /><meshStandardMaterial color="#7e7862" roughness={0.9} /></mesh><group ref={ripple}>{[0.48, 0.72].map((radius) => <mesh key={radius} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.018, 4, 40]} /><meshBasicMaterial color="#dfe2bc" transparent opacity={active ? 0.55 : 0.16} /></mesh>)}</group></group>;
}

function AudioEcho({ exhibit, active, accent }: ModelProps) {
  const disc = useRef<THREE.Group>(null);
  const seed = stableModelSeed(exhibit.id);
  useFrame((_, delta) => { if (disc.current) disc.current.rotation.z += delta * (active ? 0.75 : 0.18); });
  return <group ref={disc} position-y={1.02} rotation-x={Math.PI / 2}><mesh><cylinderGeometry args={[0.7, 0.7, 0.08, 36]} /><meshStandardMaterial color="#1b2525" metalness={0.42} roughness={0.36} /></mesh>{[0.25, 0.42, 0.58].map((radius, index) => <mesh key={radius} position-y={0.045} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.012 + index * 0.003, 4, 44]} /><meshBasicMaterial color={index === seed % 3 ? accent : "#7b9185"} transparent opacity={active ? 0.82 : 0.34} /></mesh>)}<mesh position-y={0.06}><cylinderGeometry args={[0.11, 0.11, 0.04, 18]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} /></mesh></group>;
}

function SignalInstrument({ exhibit, active, accent }: ModelProps) {
  const dish = useRef<THREE.Group>(null);
  const seed = stableModelSeed(exhibit.id);
  useFrame(({ clock }) => { if (dish.current) dish.current.rotation.y = Math.sin(clock.elapsedTime * (active ? 0.9 : 0.24) + seed) * 0.72; });
  return <group ref={dish} position-y={1.02}><mesh rotation-x={-0.7}><cylinderGeometry args={[0.6, 0.1, 0.2, 20, 1, false]} /><meshStandardMaterial color="#8aa09b" metalness={0.48} roughness={0.32} /></mesh><mesh position-y={-0.58}><cylinderGeometry args={[0.07, 0.12, 1.12, 8]} /><meshStandardMaterial color="#5e6965" metalness={0.32} /></mesh><mesh position={[0, 0.2, 0.2]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} /></mesh><pointLight color={accent} intensity={active ? 2.6 : 0.7} distance={4} /></group>;
}

export function ReservedModel({ accent }: { accent: string }) {
  return <group position-y={1.02}><mesh rotation-y={Math.PI / 4}><dodecahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color="#25302d" wireframe transparent opacity={0.34} /></mesh><mesh><sphereGeometry args={[0.065, 8, 6]} /><meshBasicMaterial color={accent} transparent opacity={0.28} /></mesh></group>;
}
