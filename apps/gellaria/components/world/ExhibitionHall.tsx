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
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
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
          landmarkId={props.landmark.id}
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
  if (landmarkId === "observatory") return <ObservatoryInterior accent={accent} responseColor={responseColor} />;
  if (landmarkId === "memory-grove") return <GroveInterior accent={accent} responseColor={responseColor} />;
  return <WorkshopInterior accent={accent} responseColor={responseColor} />;
}

function WorkshopInterior({ accent, responseColor }: { accent: string; responseColor: string }) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[18, 18]} /><meshStandardMaterial color="#28231f" roughness={0.9} /></mesh>
      <mesh receiveShadow position={[0, 3.5, -7.8]}><boxGeometry args={[18, 7, 0.35]} /><meshStandardMaterial color="#352a25" roughness={0.9} /></mesh>
      {[-8.8, 8.8].map((x) => <mesh key={x} receiveShadow position={[x, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color="#352a25" roughness={0.9} /></mesh>)}
      {[-5.9, -2.95, 2.95, 5.9].map((x) => <mesh key={x} position={[x, 0.045, -0.6]}><boxGeometry args={[0.1, 0.07, 14.3]} /><meshStandardMaterial color="#7a6555" metalness={0.55} roughness={0.38} /></mesh>)}
      {[-7.4, 7.4].map((x) => <group key={x} position-x={x}><mesh castShadow position-y={3.35}><boxGeometry args={[0.34, 6.7, 0.52]} /><meshStandardMaterial color="#675a50" metalness={0.35} /></mesh><mesh castShadow position={[0, 6.52, -0.6]}><boxGeometry args={[0.45, 0.3, 14.2]} /><meshStandardMaterial color="#675a50" metalness={0.38} /></mesh></group>)}
      <mesh castShadow position={[0, 6.35, -1.3]}><boxGeometry args={[15.2, 0.34, 0.42]} /><meshStandardMaterial color="#756252" metalness={0.45} /></mesh>
      <group position={[0, 5.7, -1.3]}>
        <mesh position-y={0.28}><boxGeometry args={[1.05, 0.5, 0.72]} /><meshStandardMaterial color="#9a7256" metalness={0.35} /></mesh>
        <mesh position-y={-0.5}><cylinderGeometry args={[0.055, 0.055, 1.25, 7]} /><meshStandardMaterial color="#b38a65" metalness={0.55} /></mesh>
        <mesh position-y={-1.15} rotation-z={Math.PI / 4}><torusGeometry args={[0.16, 0.035, 6, 18, Math.PI * 1.5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} /></mesh>
      </group>
      <mesh position={[0, 0.04, 6.85]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.4} /></mesh>
      <group position={[0, 4.9, -7.55]}>{[-1.1, 0, 1.1].map((x, index) => <mesh key={x} position-x={x} rotation-z={index * 0.34}><octahedronGeometry args={[0.52, 0]} /><meshStandardMaterial color={index === 1 ? responseColor : "#8a7563"} emissive={responseColor} emissiveIntensity={index === 1 ? 0.72 : 0.08} metalness={0.58} roughness={0.3} /></mesh>)}</group>
      {[-4.5, 4.5].map((x) => <pointLight key={x} position={[x, 5.6, -1]} color="#e7b27e" intensity={2.2} distance={8} />)}
    </group>
  );
}

function ObservatoryInterior({ accent, responseColor }: { accent: string; responseColor: string }) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}><circleGeometry args={[9, 64]} /><meshStandardMaterial color="#15252d" roughness={0.72} metalness={0.15} /></mesh>
      <mesh position-y={0.03} rotation-x={-Math.PI / 2}><ringGeometry args={[2.2, 2.28, 64]} /><meshBasicMaterial color={responseColor} transparent opacity={0.44} /></mesh>
      <mesh position-y={0.035} rotation-x={-Math.PI / 2}><ringGeometry args={[5.15, 5.23, 64]} /><meshBasicMaterial color="#7697a6" transparent opacity={0.28} /></mesh>
      {Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return <mesh key={index} position={[Math.sin(angle) * 3.65, 0.045, -0.75 + Math.cos(angle) * 3.15]} rotation-y={angle}><boxGeometry args={[0.035, 0.06, 6.1]} /><meshBasicMaterial color="#5d7b89" transparent opacity={0.28} /></mesh>; })}
      <mesh receiveShadow position={[0, 3.5, -8.15]}><boxGeometry args={[18, 7, 0.35]} /><meshStandardMaterial color="#172b35" roughness={0.82} /></mesh>
      {[-8.8, 8.8].map((x) => <mesh key={x} position={[x, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color="#172b35" roughness={0.82} /></mesh>)}
      <group position={[0, 4.4, -7.75]}>
        <mesh><sphereGeometry args={[2.05, 24, 14]} /><meshStandardMaterial color="#b9d4de" emissive={responseColor} emissiveIntensity={0.55} transparent opacity={0.2} wireframe /></mesh>
        {[2.45, 3.05].map((radius, index) => <mesh key={radius} rotation={[index * 0.68, index * 0.4, 0]}><torusGeometry args={[radius, 0.025, 5, 64]} /><meshBasicMaterial color={index ? accent : "#d8e5e9"} transparent opacity={0.55} /></mesh>)}
        <mesh><icosahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} /></mesh>
      </group>
      {[-5.4, 5.4].map((x) => <group key={x} position={[x, 3.6, -7.7]}><mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.2, 0.035, 5, 52]} /><meshBasicMaterial color={responseColor} transparent opacity={0.46} /></mesh><mesh rotation-y={Math.PI / 3}><torusGeometry args={[0.78, 0.022, 5, 42]} /><meshBasicMaterial color="#dce8ed" transparent opacity={0.52} /></mesh></group>)}
      <mesh position={[0, 0.04, 6.85]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh>
      <pointLight position={[0, 5.1, -3]} color={responseColor} intensity={4} distance={14} />
    </group>
  );
}

function GroveInterior({ accent, responseColor }: { accent: string; responseColor: string }) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[18, 18]} /><meshStandardMaterial color="#17271f" roughness={1} /></mesh>
      <mesh position={[0, 0.035, -0.5]} rotation-x={-Math.PI / 2}><ringGeometry args={[2.1, 7.7, 48]} /><meshStandardMaterial color="#26382b" roughness={0.92} /></mesh>
      <mesh position={[0, 0.045, -0.7]} rotation-x={-Math.PI / 2}><circleGeometry args={[1.75, 36]} /><meshStandardMaterial color="#173b3a" emissive={responseColor} emissiveIntensity={0.3} roughness={0.42} /></mesh>
      {[-8.8, 8.8].map((x) => <mesh key={x} position={[x, 3.5, 0]}><boxGeometry args={[0.25, 7, 16]} /><meshStandardMaterial color="#1d3228" transparent opacity={0.72} /></mesh>)}
      {[
        [-7.2, -5.8, 5.8], [-5.4, -7, 6.6], [5.7, -6.8, 6.2], [7.25, -4.2, 5.5],
      ].map(([x, z, height], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh castShadow position-y={height / 2}><cylinderGeometry args={[0.18, 0.42, height, 7]} /><meshStandardMaterial color="#574a39" roughness={1} /></mesh>
          <mesh castShadow position={[0, height, 0]} scale={[1.35, 0.82, 1.1]}><icosahedronGeometry args={[1.25, 1]} /><meshStandardMaterial color={index % 2 ? "#526e50" : "#60795a"} roughness={1} /></mesh>
        </group>
      ))}
      {[-6.1, -3.05, 0, 3.05, 6.1].map((x, index) => <mesh key={x} position={[x, 5.25 + (index % 2) * 0.35, -1]} rotation-z={x * -0.025}><torusGeometry args={[3.6, 0.055, 6, 54, Math.PI]} /><meshStandardMaterial color="#657861" metalness={0.16} roughness={0.72} /></mesh>)}
      {[0.82, 1.3, 1.78].map((radius, index) => <mesh key={radius} position={[0, 2.7 + index * 0.62, -7.7]} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.03, 5, 54]} /><meshBasicMaterial color={responseColor} transparent opacity={0.58 - index * 0.12} /></mesh>)}
      {[-4.2, 4.2].map((x) => <group key={x} position={[x, 0.45, -0.7]}><mesh><boxGeometry args={[2.5, 0.22, 0.72]} /><meshStandardMaterial color="#4b5442" roughness={0.95} /></mesh><mesh position-y={0.6}><octahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} /></mesh></group>)}
      <mesh position={[0, 0.04, 6.85]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh>
      <pointLight position={[0, 4.2, -0.7]} color={responseColor} intensity={4.2} distance={13} />
    </group>
  );
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

function ExhibitDisplay({ slot, landmarkId, accent, active }: { slot: ExhibitSlot; landmarkId: string; accent: string; active: boolean }) {
  const display = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!display.current) return;
    const target = active ? 1.12 : 1;
    display.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, delta * 6));
    display.current.position.y = Math.sin(clock.elapsedTime * 0.8 + slot.index) * 0.025;
  });
  return (
    <group position={slot.position} rotation-y={slot.rotation}>
      <ExhibitPlinth landmarkId={landmarkId} accent={accent} occupied={Boolean(slot.exhibit)} active={active} />
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

function ExhibitPlinth({ landmarkId, accent, occupied, active }: { landmarkId: string; accent: string; occupied: boolean; active: boolean }) {
  const intensity = active ? 0.8 : occupied ? 0.2 : 0.025;
  if (landmarkId === "workshop") {
    return (
      <group>
        <mesh receiveShadow position-y={0.2}><boxGeometry args={[2.15, 0.4, 1.55]} /><meshStandardMaterial color={occupied ? "#51463d" : "#302c29"} roughness={0.8} metalness={0.2} /></mesh>
        {[-0.78, 0.78].map((x) => <mesh key={x} position={[x, -0.12, 0]}><boxGeometry args={[0.16, 0.7, 1.1]} /><meshStandardMaterial color="#655246" metalness={0.3} /></mesh>)}
        <mesh position={[0, 0.43, 0]}><boxGeometry args={[1.88, 0.07, 1.28]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={intensity} metalness={0.46} roughness={0.4} /></mesh>
      </group>
    );
  }
  if (landmarkId === "observatory") {
    return (
      <group>
        <mesh receiveShadow position-y={0.16}><cylinderGeometry args={[1.05, 1.18, 0.32, 16]} /><meshStandardMaterial color={occupied ? "#344852" : "#223139"} roughness={0.62} metalness={0.28} /></mesh>
        <mesh position-y={0.35}><cylinderGeometry args={[0.88, 0.98, 0.08, 16]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={intensity} metalness={0.5} roughness={0.32} /></mesh>
        <mesh position-y={0.38} rotation-x={Math.PI / 2}><torusGeometry args={[1.18, 0.025, 5, 44]} /><meshBasicMaterial color={accent} transparent opacity={active ? 0.75 : 0.24} /></mesh>
      </group>
    );
  }
  return (
    <group rotation-y={slotStoneRotation(occupied)}>
      <mesh receiveShadow position-y={0.14} scale={[1.1, 1, 0.92]}><dodecahedronGeometry args={[1.02, 0]} /><meshStandardMaterial color={occupied ? "#465044" : "#2b352e"} roughness={0.96} /></mesh>
      <mesh position-y={0.42} rotation-x={Math.PI / 2}><torusGeometry args={[0.92, 0.035, 5, 36]} /><meshBasicMaterial color={accent} transparent opacity={active ? 0.78 : occupied ? 0.25 : 0.06} /></mesh>
    </group>
  );
}

function slotStoneRotation(occupied: boolean) {
  return occupied ? 0.22 : -0.18;
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
  const spiritMotion = useRef<SpiritMotion>({ speed: 0, stride: 0 });
  const { camera } = useThree();
  const playerAppearance = useWorldStore((state) => state.playerAppearance);

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
    if (avatar.current) {
      const speed = Math.min(1, velocity.current.length() / 4.2);
      spiritMotion.current.speed = speed;
      spiritMotion.current.stride = clock.elapsedTime * 9.5;
      avatar.current.rotation.z = THREE.MathUtils.lerp(avatar.current.rotation.z, -inputX * 0.06, Math.min(1, delta * 8));
    }
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

  return <group ref={group}><group ref={avatar}><SpiritTraveler appearance={playerAppearance} motion={spiritMotion} /></group></group>;
}
