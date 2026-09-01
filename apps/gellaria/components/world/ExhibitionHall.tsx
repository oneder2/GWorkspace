"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, DoorOpen, Radio, Sparkles as SparklesIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import type { Landmark } from "@/lib/content";
import { buildExhibitSlots, getExhibitAction, getHallConfig, type ExhibitKind, type ExhibitSlot } from "@/lib/exhibition";
import { getLandmarkInfluence } from "@/lib/influence";
import { getCameraRelativeMovement } from "@/lib/movement";
import { workspaceUrl } from "@/lib/workspace-url";
import type { MoveIntent } from "./WorldExperience";
import { useWorldStore } from "./store";

type ExhibitionHallProps = {
  landmark: Landmark;
  moveIntent: MoveIntent;
  onExit: () => void;
};

export function ExhibitionHall({ landmark, moveIntent, onExit }: ExhibitionHallProps) {
  const config = getHallConfig(landmark.id);
  const slots = useMemo(() => buildExhibitSlots(landmark), [landmark]);
  const [nearbySlot, setNearbySlot] = useState<ExhibitSlot | null>(null);
  const [exitNearby, setExitNearby] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ExhibitSlot | null>(null);
  const signals = useWorldStore((state) => state.signals);
  const tags = useWorldStore((state) => state.tags);
  const sendSignal = useWorldStore((state) => state.sendSignal);
  const sendTag = useWorldStore((state) => state.sendTag);
  const influence = useMemo(
    () => getLandmarkInfluence(signals[landmark.id], tags[landmark.id], landmark.tagOptions),
    [landmark.id, landmark.tagOptions, signals, tags],
  );

  const activateNearby = useCallback(() => {
    if (nearbySlot?.exhibit) setActiveSlot(nearbySlot);
    else if (exitNearby) onExit();
  }, [exitNearby, nearbySlot, onExit]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;
      if (event.code === "Escape") {
        event.preventDefault();
        if (activeSlot) setActiveSlot(null);
        else onExit();
      }
      if (event.code === "KeyE" && !event.repeat && !activeSlot) {
        event.preventDefault();
        activateNearby();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activateNearby, activeSlot, onExit]);

  const responseColor = landmark.influenceColors[Math.max(0, influence.dominantTagIndex)] ?? landmark.accent;

  return (
    <section className="exhibition-hall" aria-label={`${landmark.name}${config.roomLabel}`}>
      <HallCanvas
        landmark={landmark}
        slots={slots}
        moveIntent={moveIntent}
        activeSlotId={activeSlot?.id ?? null}
        responseColor={responseColor}
        responseStrength={influence.strength}
        onNearbySlot={setNearbySlot}
        onExitNearby={setExitNearby}
      />
      <div className="hall-vignette" aria-hidden="true" />

      <header className="hall-header">
        <button onClick={onExit} className="hall-back"><ArrowLeft size={17} /> 返回中央岛</button>
        <div>
          <p>{config.hallLabel}</p>
          <h1>{config.roomLabel}</h1>
        </div>
        <span className="hall-occupancy">{landmark.exhibits.length} / {config.capacity} 展位启用</span>
      </header>

      <aside className="hall-ecology" style={{ "--hall-accent": responseColor } as CSSProperties}>
        <header><span><SparklesIcon size={13} /> 展厅生态</span><strong><i />{influence.tierLabel}</strong></header>
        <button onClick={() => sendSignal(landmark.id)}><Radio size={15} /> 留下一道光迹 <span>{signals[landmark.id] ?? 0}</span></button>
        <div role="group" aria-label={`${landmark.name}访客标签`}>
          {landmark.tagOptions.map((tag) => <button key={tag} onClick={() => sendTag(landmark.id, tag)}>{tag}</button>)}
        </div>
      </aside>

      {!activeSlot && (nearbySlot?.exhibit || exitNearby) && (
        <button className="hall-interaction-prompt" onClick={activateNearby} aria-keyshortcuts="E">
          <kbd>E</kbd>
          <span>{exitNearby ? "离开展厅" : getExhibitAction(nearbySlot?.kind ?? "signal").prompt}</span>
          <strong>{exitNearby ? "返回中央岛" : nearbySlot?.exhibit?.title}</strong>
          {exitNearby && <DoorOpen size={17} />}
        </button>
      )}

      <AnimatePresence>
        {activeSlot?.exhibit && (
          <ExhibitDossier
            slot={activeSlot}
            accent={landmark.accent}
            onClose={() => setActiveSlot(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ExhibitDossier({ slot, accent, onClose }: { slot: ExhibitSlot; accent: string; onClose: () => void }) {
  const exhibit = slot.exhibit;
  if (!exhibit) return null;
  const action = getExhibitAction(slot.kind);
  return (
    <motion.aside
      className={`exhibit-dossier exhibit-${slot.kind}`}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.24 }}
      style={{ "--exhibit-accent": accent } as CSSProperties}
      aria-label={`${exhibit.title}展签`}
    >
      <button className="exhibit-close" onClick={onClose} aria-label="关闭展签"><X size={17} /></button>
      <p>{String(slot.index + 1).padStart(2, "0")} / {exhibit.label}</p>
      <h2>{exhibit.title}</h2>
      <span className="exhibit-state"><i />{action.prompt}完成</span>
      <p className="exhibit-summary">{exhibit.summary}</p>
      {exhibit.tags?.length ? <div className="exhibit-tags">{exhibit.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      {exhibit.href && <a href={workspaceUrl(exhibit.href)}>{action.destination}<ArrowUpRight size={15} /></a>}
      <small>完整内容由 GWorkspace 提供</small>
    </motion.aside>
  );
}

type HallCanvasProps = {
  landmark: Landmark;
  slots: ExhibitSlot[];
  moveIntent: MoveIntent;
  activeSlotId: string | null;
  responseColor: string;
  responseStrength: number;
  onNearbySlot: (slot: ExhibitSlot | null) => void;
  onExitNearby: (nearby: boolean) => void;
};

function HallCanvas(props: HallCanvasProps) {
  return (
    <Canvas className="hall-canvas" shadows="basic" dpr={[1, 1.5]} camera={{ position: [8, 8, 12], fov: 43, near: 0.1, far: 80 }} gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}>
      <color attach="background" args={[hallPalette(props.landmark.id).background]} />
      <fog attach="fog" args={[hallPalette(props.landmark.id).fog, 17, 38]} />
      <HallScene {...props} />
    </Canvas>
  );
}

function HallScene(props: HallCanvasProps) {
  const palette = hallPalette(props.landmark.id);
  return (
    <>
      <ambientLight intensity={0.85} color={palette.ambient} />
      <directionalLight castShadow position={[2, 11, 7]} intensity={2.1} color={palette.key} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 5.2, -1]} color={props.responseColor} intensity={3 + props.responseStrength * 7} distance={19} decay={2} />
      <HallArchitecture landmarkId={props.landmark.id} accent={props.landmark.accent} responseColor={props.responseColor} />
      {props.slots.map((slot) => (
        <ExhibitDisplay
          key={slot.id}
          slot={slot}
          accent={props.landmark.accent}
          active={slot.id === props.activeSlotId}
        />
      ))}
      <ExpansionPortal position={[-8.1, 1.55, -1]} rotation={Math.PI / 2} accent={props.landmark.accent} />
      <ExpansionPortal position={[8.1, 1.55, -1]} rotation={-Math.PI / 2} accent={props.landmark.accent} />
      <HallPlayer {...props} />
      <Sparkles count={28 + Math.round(props.responseStrength * 35)} scale={[15, 6, 14]} position={[0, 3, -0.5]} size={1.1} speed={0.12} opacity={0.22} color={props.responseColor} />
    </>
  );
}

function hallPalette(landmarkId: string) {
  if (landmarkId === "observatory") return { background: "#08151e", fog: "#132734", ambient: "#90aec0", key: "#c9dce7", floor: "#17252c", wall: "#1b2d36" };
  if (landmarkId === "memory-grove") return { background: "#0b1715", fog: "#1b3027", ambient: "#91ad96", key: "#d6d7b2", floor: "#1a2923", wall: "#21352d" };
  return { background: "#171311", fog: "#32241e", ambient: "#a99a8c", key: "#efd0ab", floor: "#28231f", wall: "#352a25" };
}

function HallArchitecture({ landmarkId, accent, responseColor }: { landmarkId: string; accent: string; responseColor: string }) {
  const palette = hallPalette(landmarkId);
  const columns = [-7.4, -3.7, 0, 3.7, 7.4];
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[18, 18]} /><meshStandardMaterial color={palette.floor} roughness={0.88} /></mesh>
      <mesh receiveShadow position={[0, 3.5, -7.8]}><boxGeometry args={[18, 7, 0.35]} /><meshStandardMaterial color={palette.wall} roughness={0.9} /></mesh>
      <mesh receiveShadow position={[-8.8, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color={palette.wall} roughness={0.9} /></mesh>
      <mesh receiveShadow position={[8.8, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color={palette.wall} roughness={0.9} /></mesh>
      {columns.map((x) => <mesh key={x} castShadow position={[x, 3.25, -7.45]}><boxGeometry args={[0.28, 6.5, 0.5]} /><meshStandardMaterial color="#59605a" metalness={0.25} roughness={0.65} /></mesh>)}
      {[-5.3, 0, 5.3].map((z) => <mesh key={z} castShadow position={[0, 6.7, z]}><boxGeometry args={[18, 0.2, 0.28]} /><meshStandardMaterial color="#56615d" metalness={0.35} /></mesh>)}
      <mesh position={[0, 6.84, -0.6]} rotation-x={-Math.PI / 2}><planeGeometry args={[10.5, 11.5]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={0.32} transparent opacity={0.16} /></mesh>
      <mesh position={[0, 0.035, 6.85]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.34} /></mesh>
      <HallSignature landmarkId={landmarkId} accent={accent} />
    </group>
  );
}

function HallSignature({ landmarkId, accent }: { landmarkId: string; accent: string }) {
  if (landmarkId === "observatory") {
    return <group position={[0, 5.3, -6.9]}><mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.1, 0.035, 5, 72]} /><meshBasicMaterial color={accent} /></mesh><mesh rotation-y={Math.PI / 3}><torusGeometry args={[0.78, 0.025, 5, 56]} /><meshBasicMaterial color="#dce8ed" /></mesh></group>;
  }
  if (landmarkId === "memory-grove") {
    return <group position={[0, 0, -6.9]}>{[-1.1, 0, 1.1].map((x, index) => <group key={x} position={[x, 0, 0]}><mesh position-y={2.2}><cylinderGeometry args={[0.08, 0.15, 4.4, 8]} /><meshStandardMaterial color="#6e765d" /></mesh><mesh position={[0, 4.15 + index * 0.2, 0]}><icosahedronGeometry args={[0.5 + index * 0.12, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.28} wireframe /></mesh></group>)}</group>;
  }
  return <group position={[0, 5.1, -7]}>{[-1, 0, 1].map((x, index) => <mesh key={x} position-x={x * 0.95} rotation-z={index * 0.28}><octahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color={index === 1 ? accent : "#776a5c"} emissive={accent} emissiveIntensity={index === 1 ? 0.5 : 0.08} metalness={0.55} roughness={0.35} /></mesh>)}</group>;
}

function ExpansionPortal({ position, rotation, accent }: { position: [number, number, number]; rotation: number; accent: string }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh><boxGeometry args={[3.2, 3.1, 0.28]} /><meshStandardMaterial color="#111b1c" roughness={0.88} /></mesh>
      <mesh position-z={0.17}><boxGeometry args={[3.55, 0.14, 0.12]} /><meshBasicMaterial color={accent} transparent opacity={0.4} /></mesh>
      <Html position={[0, 0, 0.23]} center distanceFactor={9} className="expansion-label"><span>RESERVED WING</span><small>预留扩建侧翼</small></Html>
    </group>
  );
}

function ExhibitDisplay({ slot, accent, active }: { slot: ExhibitSlot; accent: string; active: boolean }) {
  const display = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!display.current) return;
    const target = active ? 1.12 : 1;
    display.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, delta * 6));
    display.current.position.y = Math.sin(clock.elapsedTime * 0.8 + slot.index) * 0.025;
  });
  return (
    <group position={slot.position} rotation-y={slot.rotation}>
      <mesh receiveShadow position-y={0.16}><cylinderGeometry args={[1.12, 1.25, 0.32, 8]} /><meshStandardMaterial color={slot.exhibit ? "#4c514d" : "#2b3431"} roughness={0.82} metalness={0.15} /></mesh>
      <mesh position-y={0.34}><cylinderGeometry args={[0.92, 1.02, 0.1, 8]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 0.75 : slot.exhibit ? 0.18 : 0.02} metalness={0.45} roughness={0.4} /></mesh>
      <group ref={display} position-y={0.35}>
        {slot.exhibit ? <ExhibitModel kind={slot.kind} active={active} accent={accent} seed={slot.index} /> : <ReservedExhibit accent={accent} />}
      </group>
      <Html position={[0, 2.45, 0]} center distanceFactor={10} zIndexRange={[3, 0]} className={`exhibit-world-label ${slot.exhibit ? "" : "reserved"}`}>
        <span>{slot.exhibit?.title ?? "预留展位"}</span>
        <small>{slot.exhibit ? getExhibitAction(slot.kind).prompt : "未来展品"}</small>
      </Html>
    </group>
  );
}

function ExhibitModel({ kind, active, accent, seed }: { kind: ExhibitKind; active: boolean; accent: string; seed: number }) {
  if (kind === "constellation") return <ConstellationExhibit active={active} accent={accent} seed={seed} />;
  if (kind === "echo") return <EchoExhibit active={active} accent={accent} seed={seed} />;
  if (kind === "signal") return <SignalExhibit active={active} accent={accent} />;
  return <PrototypeExhibit active={active} accent={accent} seed={seed} />;
}

function PrototypeExhibit({ active, accent, seed }: { active: boolean; accent: string; seed: number }) {
  const mechanism = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (mechanism.current) mechanism.current.rotation.y += delta * (active ? 1.15 : 0.18); });
  return <group ref={mechanism} position-y={1.05}><mesh castShadow rotation-x={Math.PI / 2}><torusGeometry args={[0.58 + seed % 2 * 0.08, 0.12, 7, 18]} /><meshStandardMaterial color="#8d7968" metalness={0.72} roughness={0.28} /></mesh><mesh castShadow rotation={[0.4, 0.2, 0.6]}><octahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 1.2 : 0.28} metalness={0.5} roughness={0.3} /></mesh>{[0, 1, 2].map((index) => <mesh key={index} position={[Math.cos(index * Math.PI * 2 / 3) * 0.78, (index - 1) * 0.18, Math.sin(index * Math.PI * 2 / 3) * 0.78]}><boxGeometry args={[0.25, 0.25, 0.25]} /><meshStandardMaterial color="#b3a18c" metalness={0.6} /></mesh>)}</group>;
}

function ConstellationExhibit({ active, accent, seed }: { active: boolean; accent: string; seed: number }) {
  const orbit = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (orbit.current) { orbit.current.rotation.y += delta * (active ? 0.8 : 0.12); orbit.current.rotation.z += delta * 0.05; } });
  return <group ref={orbit} position-y={1.1} rotation-x={0.35 + seed * 0.04}><mesh><sphereGeometry args={[0.24, 14, 10]} /><meshStandardMaterial color="#dce9ef" emissive={accent} emissiveIntensity={active ? 2 : 0.7} /></mesh>{[0.55, 0.82, 1.05].map((radius, index) => <mesh key={radius} rotation={[index * 0.7, index * 0.4, 0]}><torusGeometry args={[radius, 0.018, 5, 48]} /><meshBasicMaterial color={index === 1 ? accent : "#bad0dc"} transparent opacity={active ? 0.9 : 0.46} /></mesh>)}</group>;
}

function EchoExhibit({ active, accent, seed }: { active: boolean; accent: string; seed: number }) {
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (rings.current) rings.current.scale.setScalar(0.9 + ((clock.elapsedTime * (active ? 0.42 : 0.12) + seed * 0.1) % 1) * 0.5); });
  return <group position-y={0.8}><mesh castShadow position-y={0.45}><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 1.4 : 0.35} roughness={0.6} /></mesh><group ref={rings} position-y={0.45}>{[0.72, 0.96].map((radius) => <mesh key={radius} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.022, 5, 42]} /><meshBasicMaterial color="#d9ddbd" transparent opacity={active ? 0.65 : 0.2} /></mesh>)}</group><mesh castShadow position-y={-0.05}><cylinderGeometry args={[0.1, 0.18, 1.15, 7]} /><meshStandardMaterial color="#68705b" /></mesh></group>;
}

function SignalExhibit({ active, accent }: { active: boolean; accent: string }) {
  const dish = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (dish.current) dish.current.rotation.y = Math.sin(clock.elapsedTime * (active ? 1 : 0.25)) * 0.7; });
  return <group ref={dish} position-y={1.05}><mesh rotation-x={-0.7}><cylinderGeometry args={[0.65, 0.12, 0.24, 18, 1, false]} /><meshStandardMaterial color="#8aa09b" metalness={0.45} roughness={0.35} /></mesh><mesh position-y={-0.62}><cylinderGeometry args={[0.08, 0.12, 1.2, 8]} /><meshStandardMaterial color="#5e6965" /></mesh><pointLight color={accent} intensity={active ? 3 : 0.7} distance={4} /></group>;
}

function ReservedExhibit({ accent }: { accent: string }) {
  return <group position-y={1.05}><mesh rotation-y={Math.PI / 4}><boxGeometry args={[0.75, 0.75, 0.75]} /><meshStandardMaterial color="#25302d" wireframe transparent opacity={0.42} /></mesh><mesh><sphereGeometry args={[0.08, 8, 6]} /><meshBasicMaterial color={accent} transparent opacity={0.28} /></mesh></group>;
}

function HallPlayer({ moveIntent, slots, onNearbySlot, onExitNearby }: HallCanvasProps) {
  const group = useRef<THREE.Group>(null);
  const avatar = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(0, 0, 5.8));
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef(new Set<string>());
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  const nearbyId = useRef<string | null>(null);
  const exitState = useRef(false);
  const { camera } = useThree();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const inputX = Number(keys.current.has("KeyD") || keys.current.has("ArrowRight")) - Number(keys.current.has("KeyA") || keys.current.has("ArrowLeft")) + moveIntent.x;
    const inputZ = Number(keys.current.has("KeyS") || keys.current.has("ArrowDown")) - Number(keys.current.has("KeyW") || keys.current.has("ArrowUp")) + moveIntent.z;
    const direction = camera.getWorldDirection(cameraDirection.current);
    if (inputX || inputZ) {
      const [x, z] = getCameraRelativeMovement(inputX, inputZ, direction.x, direction.z);
      velocity.current.lerp(direction.set(x, 0, z).multiplyScalar(4.2), Math.min(1, delta * 8));
    } else velocity.current.multiplyScalar(Math.max(0, 1 - delta * 9));
    position.current.addScaledVector(velocity.current, delta);
    position.current.x = THREE.MathUtils.clamp(position.current.x, -7.7, 7.7);
    position.current.z = THREE.MathUtils.clamp(position.current.z, -6.6, 6.8);
    group.current.position.copy(position.current);
    if (velocity.current.lengthSq() > 0.06) group.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    if (avatar.current) avatar.current.position.y = Math.sin(clock.elapsedTime * 10) * Math.min(0.05, velocity.current.length() * 0.012);
    cameraTarget.current.set(position.current.x + 6.8, 7.2, position.current.z + 9.2);
    camera.position.lerp(cameraTarget.current, 1 - Math.pow(0.002, delta));
    camera.lookAt(position.current.x, 0.9, position.current.z - 0.5);

    let nearest: ExhibitSlot | null = null;
    let nearestDistance = 2.25;
    for (const slot of slots) {
      if (!slot.exhibit) continue;
      const distance = Math.hypot(position.current.x - slot.position[0], position.current.z - slot.position[2]);
      if (distance < nearestDistance) { nearest = slot; nearestDistance = distance; }
    }
    const nextId = nearest?.id ?? null;
    if (nextId !== nearbyId.current) { nearbyId.current = nextId; onNearbySlot(nearest); }
    const nextExit = Math.hypot(position.current.x, position.current.z - 6.5) < 1.55;
    if (nextExit !== exitState.current) { exitState.current = nextExit; onExitNearby(nextExit); }
  });

  return <group ref={group}><group ref={avatar}><HallVisitor /></group></group>;
}

function HallVisitor() {
  return <group scale={0.9}><mesh castShadow position-y={1.05}><capsuleGeometry args={[0.3, 0.72, 5, 9]} /><meshStandardMaterial color="#d0d1bd" roughness={0.85} /></mesh><mesh castShadow position-y={1.78}><sphereGeometry args={[0.3, 12, 8]} /><meshStandardMaterial color="#c69479" roughness={0.86} /></mesh><mesh position={[-0.25, 0.72, 0.18]}><sphereGeometry args={[0.13, 8, 6]} /><meshStandardMaterial color="#e7b56f" emissive="#e7a85f" emissiveIntensity={1.8} /></mesh><pointLight position={[-0.25, 0.8, 0.22]} color="#efb66e" intensity={1.2} distance={3.5} /></group>;
}
