"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { studySeats } from "@/lib/study-presence";

type Vector = [number, number, number];
type MaterialState = { material: THREE.Material; opacity: number; transparent: boolean; depthWrite: boolean };
type ShadowState = { mesh: THREE.Mesh; original: boolean; enabled: boolean };
function applyCutawayShadows(casters: ShadowState[], alpha: number) {
  for (const entry of casters) entry.mesh.castShadow = entry.enabled && alpha > .98;
}
function applyCutaway(materials: MaterialState[], alpha: number) {
  for (const entry of materials) {
    const faded = alpha < .995;
    if (entry.material.transparent !== (faded || entry.transparent)) {
      entry.material.transparent = faded || entry.transparent;
      entry.material.needsUpdate = true;
    }
    entry.material.opacity = entry.opacity * alpha;
    entry.material.depthWrite = faded ? false : entry.depthWrite;
  }
}
type BlockProps = { at: Vector; size: Vector; color?: string; metal?: number; rotation?: Vector; glow?: boolean };

export function Block({ at, size, color = "#a1aaa5", metal = 0, rotation, glow = false }: BlockProps) {
  return <mesh position={at} rotation={rotation} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={metal ? .42 : .82} metalness={metal} emissive={color} emissiveIntensity={glow ? .65 : 0} />
  </mesh>;
}

// Fade a whole architectural/display unit when its bounds cross any of nine
// camera-to-traveler sightlines. Restore original transparency on cleanup.
export function SightlineCutaway({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const bounds = useMemo(() => new THREE.Box3(), []);
  const ray = useMemo(() => new THREE.Ray(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const materials = useRef<MaterialState[]>([]);
  const casters = useRef<ShadowState[]>([]);
  const alpha = useRef(1);
  useEffect(() => {
    const unique = new Set<THREE.Material>();
    const shadows: typeof casters.current = [];
    root.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of entries) unique.add(material);
        object.geometry.computeBoundingBox();
        const box = object.geometry.boundingBox;
        const solid = entries.every((material) => !material.transparent && (!(material instanceof THREE.MeshStandardMaterial) || material.emissiveIntensity < .6));
        shadows.push({ mesh: object, original: object.castShadow, enabled: solid && Boolean(box && box.max.y - box.min.y > .18) });
      }
    });
    const originals = [...unique].map((material) => ({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite }));
    materials.current = originals;
    casters.current = shadows;
    return () => {
      originals.forEach(({ material, opacity, transparent, depthWrite }) => Object.assign(material, { opacity, transparent, depthWrite }));
      shadows.forEach(({ mesh, original }) => { mesh.castShadow = original; });
    };
  }, [children]);
  useFrame(({ camera, scene }, delta) => {
    if (!root.current) return;
    const inspection = scene.getObjectByName('museum-inspection-target');
    const traveler = inspection || scene.getObjectByName("museum-traveler");
    if (!traveler) return;
    bounds.setFromObject(root.current);
    let blocked = false;
    for (const offset of inspection ? [0] : [-.5, 0, .5]) for (const height of inspection ? [0] : [.25, 1, 1.8]) {
      traveler.getWorldPosition(target);
      target.set(target.x + offset, target.y + height, target.z);
      const distance = camera.position.distanceTo(target);
      ray.origin.copy(camera.position);
      ray.direction.copy(target).sub(camera.position).normalize();
      if (ray.intersectBox(bounds, hit) && camera.position.distanceTo(hit) < distance - .15) blocked = true;
    }
    alpha.current = THREE.MathUtils.damp(alpha.current, blocked && !disabled ? .055 : 1, 12, delta);
    applyCutaway(materials.current, alpha.current);
    applyCutawayShadows(casters.current, alpha.current);
  });
  return <group ref={root}>{children}</group>;
}

function Portal({ color, z, nearby }: { color: string; z: number; nearby: boolean }) {
  return <group position-z={z}>
    {[-1.08, 1.08].map((x) => <Block key={x} at={[x, 1.22, 0]} size={[.14, 2.44, .3]} color="#c1c1ad" metal={.35} />)}
    <Block at={[0, 2.45, 0]} size={[2.3, .16, .32]} color="#c1c1ad" metal={.35} />
    <Block at={[0, 1.15, -.12]} size={[1.92, 2.25, .08]} color="#172b31" />
    <Block at={[0, 2.2, .08]} size={[1.92, .08, .06]} color={color} glow />
    {[0, 1, 2].map((i) => <Block key={i} at={[0, .08 - i * .055, .4 + i * .28]} size={[2.4 + i * .3, .12, .4]} color="#89948b" />)}
    <pointLight position={[0, 1.8, .7]} color={color} intensity={nearby ? 5 : 1.5} distance={6} />
  </group>;
}

function IndustrialMuseum() {
  return <group>
    <Block at={[0, .15, 0]} size={[7.7, .3, 6.2]} color="#596761" />
    <Block at={[0, 1.4, -.2]} size={[6.7, 2.5, 5.2]} color="#7e8175" />
    {/* Three continuous sawtooth roof bays, each with a glazed north face. */}
    {[-2.25, 0, 2.25].map((x) => <group key={x} position-x={x}>
      <Block at={[0, 3.13, -.15]} size={[2.32, .16, 5.7]} color="#8f6049" metal={.6} rotation={[0, 0, .31]} />
      <Block at={[1.06, 2.98, -.15]} size={[.09, .63, 5.65]} color="#355b60" metal={.3} />
      {[-2.4, -.8, .8, 2.4].map((z) => <Block key={z} at={[1.12, 2.98, z]} size={[.06, .7, .06]} color="#d0aa78" metal={.7} />)}
    </group>)}
    {[-3.4, 3.4].map((x) => <group key={x}>
      {[-2.2, -1.1, 0, 1.1, 2.2].map((z) => <Block key={z} at={[x, 1.47, z]} size={[.14, 2.65, .16]} color="#baba9e" />)}
      <Block at={[x, 1.45, 0]} size={[.07, 1.6, 4.7]} color="#26454c" metal={.45} />
    </group>)}
    <Block at={[0, 2.7, 2.8]} size={[7.1, .2, .85]} color="#a77655" metal={.55} />
    {[-2.5, 2.5].map((x) => <group key={x}>
      <Block at={[x, 1.4, 2.43]} size={[1.45, 1.7, .14]} color="#243c40" />
      {[.8, 1.35, 1.9].map((y) => <Block key={y} at={[x, y, 2.54]} size={[1.48, .055, .1]} color="#b69872" metal={.5} />)}
    </group>)}
    <Block at={[-2.1, 3.9, -1.75]} size={[.65, 1.75, .65]} color="#a69a83" />
    <Block at={[-2.1, 4.82, -1.75]} size={[.9, .12, .85]} color="#50605b" metal={.5} />
  </group>;
}

function WritingMuseum() {
  return <group>
    <mesh position-y={.18}><cylinderGeometry args={[3.9, 4.15, .36, 48]} /><meshStandardMaterial color="#627783" roughness={.8} /></mesh>
    <mesh position-y={1.48}><cylinderGeometry args={[3.25, 3.4, 2.6, 48]} /><meshStandardMaterial color="#80979d" roughness={.74} /></mesh>
    <mesh position-y={2.96} rotation-x={-Math.PI / 2}><ringGeometry args={[1.35, 3.68, 64]} /><meshStandardMaterial color="#a2bcc0" metalness={.5} roughness={.38} side={THREE.DoubleSide} /></mesh>
    <mesh position-y={3.05}><cylinderGeometry args={[1.45, 1.65, .58, 48, 1, true]} /><meshStandardMaterial color="#415f6b" metalness={.35} side={THREE.DoubleSide} /></mesh>
    <mesh position-y={3.4} rotation-x={-Math.PI / 2}><circleGeometry args={[1.44, 48]} /><meshStandardMaterial color="#254853" emissive="#86b6c6" emissiveIntensity={.22} metalness={.5} roughness={.22} /></mesh>
    {Array.from({ length: 20 }, (_, i) => {
      const a = (i + .5) * Math.PI / 10;
      return <group key={i} rotation-y={a}>
        <Block at={[0, 1.48, 3.32]} size={[.12, 2.65, .22]} color="#bfd0cb" />
        <Block at={[0, 3.02, 2.52]} size={[.055, .09, 2.3]} color="#526f7a" metal={.6} />
      </group>;
    })}
    <Block at={[0, 1.45, 3.28]} size={[2.65, 2.9, .65]} color="#a4b8b5" />
    <Block at={[0, 2.98, 3.5]} size={[3.05, .15, 1.2]} color="#d1d3b9" metal={.35} />
    {[-2.1, 2.1].map((x) => <Block key={x} at={[x, 1.5, 2.58]} size={[.68, 1.52, .15]} color="#23414e" metal={.5} />)}
  </group>;
}

function MemoryMuseum() {
  return <group>
    <Block at={[0, .17, 0]} size={[7.6, .34, 6.7]} color="#64715e" />
    <Block at={[0, .38, -.25]} size={[4.3, .1, 3.1]} color="#304c45" metal={.2} />
    {[-2.7, 2.7].map((x) => <group key={x}>
      <Block at={[x, 1.4, -.5]} size={[1.5, 2.45, 4.9]} color="#8c9277" />
      <Block at={[x, 2.8, -.45]} size={[2.2, .22, 5.7]} color="#566853" />
      {[-2.55, -1.55, -.55, .45, 1.45].map((z) => <Block key={z} at={[x > 0 ? x - .83 : x + .83, 1.48, z]} size={[.12, 2.25, .13]} color="#ac9b70" />)}
    </group>)}
    <Block at={[0, 1.4, -2.65]} size={[4.3, 2.45, .45]} color="#77876f" />
    {/* An open-air court framed by timber, with no inherited glass dome. */}
    {[-1.85, -.95, 0, .95, 1.85].map((x) => <Block key={x} at={[x, 2.7, -.45]} size={[.1, .16, 4.85]} color="#aa976e" />)}
    <Block at={[0, 2.9, 2.8]} size={[7, .28, 1.65]} color="#586e57" />
    {[-3.2, 3.2].map((x) => <group key={x}>
      <Block at={[x, 1.5, 2.5]} size={[.35, 2.75, .45]} color="#aca687" />
      <Block at={[x, .6, 2.96]} size={[.75, .5, .52]} color="#7f8c69" />
      <mesh position={[x, 1.03, 2.96]} scale={[.45, .25, .35]}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#597c56" /></mesh>
    </group>)}
  </group>;
}

function ReadingPavilion() {
  return <group>
    <Block at={[0, .16, 0]} size={[5.8, .32, 4.8]} color="#65736c" />
    <Block at={[0, 1.23, -.2]} size={[4.7, 2.15, 3.9]} color="#c2b797" />
    {[0, 1, 2].map((i) => <group key={i}>
      <Block at={[-1.65 + i * 1.65, 2.6 + i * .36, -.2]} size={[1.85, .16, 4.5]} color="#47646b" metal={.4} />
      <Block at={[-1.65 + i * 1.65, 2.36 + i * .36, 1.83]} size={[1.5, .37 + i * .65, .08]} color="#b4ac7c" glow />
    </group>)}
    <Block at={[0, 2.25, 2.16]} size={[5.4, .16, 1]} color="#5a756d" />
    {[-2.12, 2.12].map((x) => <Block key={x} at={[x, 1.25, 2.25]} size={[.12, 2.5, .12]} color="#a18c62" metal={.3} />)}
    {[-1.7, 1.7].map((x) => <Block key={x} at={[x, 1.35, 1.8]} size={[.9, 1.35, .1]} color="#dcc58a" glow />)}
  </group>;
}

export function MuseumExterior({ kind, accent, nearby }: { kind: string; accent: string; nearby: boolean }) {
  const root = useRef<THREE.Group>(null);
  useEffect(() => {
    root.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
  }, [kind]);
  const portalZ = kind === "observatory" ? 3.66 : kind === "memory-grove" ? 3.52 : kind === "study" ? 2.45 : 2.72;
  return <group ref={root}>
    {kind === "workshop" ? <IndustrialMuseum /> : kind === "observatory" ? <WritingMuseum /> : kind === "memory-grove" ? <MemoryMuseum /> : <ReadingPavilion />}
    <Portal color={accent} z={portalZ} nearby={nearby} />
  </group>;
}

export function ReadingRoom({ light }: { light: string }) {
  return <group>
    <Block at={[0, -.15, 0]} size={[16, .3, 12]} color="#536761" />
    <Block at={[0, 2.6, -5.7]} size={[16, 5.2, .3]} color="#a0aa91" />
    {[-6, -3, 0, 3, 6].map((x) => <group key={x}>
      <Block at={[x, 2.75, -5.49]} size={[2.5, 3.3, .1]} color="#34535f" />
      <Block at={[x, 2.8, -5.38]} size={[.06, 3.35, .08]} color="#d5c3a0" />
      <Block at={[x, .68, -4.4]} size={[2.35, 1.35, .6]} color="#6d7966" />
    </group>)}
    {[-4.2, 4.2].map((x) => <group key={x}>
      <Block at={[x, 1.08, 0]} size={[2.6, .15, 6.4]} color="#c0ab81" />
      {[-2.6, 0, 2.6].map((z, i) => <group key={z}>
        <Block at={[x, .48, z]} size={[.18, 1.05, .18]} color="#43514a" metal={.5} />
        <Block at={[x - .5, 1.25, z]} size={[.65, .12, .85]} color={i % 2 ? "#587f87" : "#ad7358"} />
        <Block at={[x + .8, 1.5, z]} size={[.07, .7, .07]} color="#b69a68" metal={.5} />
        <Block at={[x + .7, 1.88, z]} size={[.65, .12, .35]} color={light} glow />
      </group>)}
    </group>)}
    {studySeats.map((seat, i) => <group key={i} position={[seat.position[0], 0, seat.position[2]]} rotation-y={seat.rotation}>
      <Block at={[0, .45, 0]} size={[.95, .18, .85]} color="#80958c" />
      <Block at={[0, .85, -.43]} size={[.95, .7, .12]} color="#596f69" />
      {[-.35, .35].map((x) => <Block key={x} at={[x, .22, 0]} size={[.09, .44, .65]} color="#344943" metal={.4} />)}
    </group>)}
    <Block at={[0, .025, .4]} size={[3.5, .04, 10.5]} color="#819287" />
  </group>;
}
