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
import { ReservedModel, SemanticExhibitModel } from "./exhibits/ExhibitModels";
import { useWorldStore } from "./store";

type ExhibitionHallProps = {
  landmark: Landmark;
  moveIntent: MoveIntent;
  paused?: boolean;
  onExit: () => void;
};

export function ExhibitionHall({ landmark, moveIntent, paused = false, onExit }: ExhibitionHallProps) {
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
        paused={paused}
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
        <span className="hall-occupancy">{landmark.id === "memory-grove" ? `${landmark.exhibits.length} 段回声游移中` : `${landmark.exhibits.length} / ${slots.length} 展位启用`}</span>
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
      aria-label={`${exhibit.title}内容`}
    >
      <button className="exhibit-close" onClick={onClose} aria-label="关闭展签"><X size={17} /></button>
      <p>{slot.kind === "echo-fragment" || slot.kind === "audio-echo" ? exhibit.label : `${String(slot.index + 1).padStart(2, "0")} / ${exhibit.label}`}</p>
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
  paused: boolean;
  activeSlotId: string | null;
  responseColor: string;
  responseStrength: number;
  onNearbySlot: (slot: ExhibitSlot | null) => void;
  onExitNearby: (nearby: boolean) => void;
};

function HallCanvas(props: HallCanvasProps) {
  return (
    <Canvas className="hall-canvas" shadows="basic" dpr={[1, 1.5]} camera={{ position: [0, 7.2, 14.8], fov: 50, near: 0.1, far: 80 }} gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}>
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
      <ambientLight intensity={1.35} color={palette.ambient} />
      <hemisphereLight args={[palette.key, palette.floor, 1.1]} />
      <directionalLight castShadow position={[2, 11, 7]} intensity={3.1} color={palette.key} shadow-mapSize={[1024, 1024]} />
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
      <mesh receiveShadow position={[0, 0.055, -0.45]}><boxGeometry args={[3.45, 0.08, 14.7]} /><meshStandardMaterial color="#34302b" metalness={0.18} roughness={0.72} /></mesh>
      {[-4.8,-2.4,0,2.4,4.8].map((z) => <mesh key={z} position={[0,.11,z]}><boxGeometry args={[3.35,.025,.07]} /><meshStandardMaterial color="#7b6654" metalness={.5} roughness={.4} /></mesh>)}
      <mesh receiveShadow position={[0, 3.5, -7.8]}><boxGeometry args={[18, 7, 0.35]} /><meshStandardMaterial color="#352a25" roughness={0.9} /></mesh>
      {[-8.8, 8.8].map((x) => <mesh key={x} receiveShadow position={[x, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color="#352a25" roughness={0.9} /></mesh>)}
      {[-1.72, 1.72].map((x) => <mesh key={x} position={[x, 0.105, -0.45]}><boxGeometry args={[0.08, 0.04, 14.7]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} metalness={0.55} roughness={0.38} /></mesh>)}
      {[-6.85, 6.85].map((x) => [-4.6, -1.55, 1.5, 4.55].map((z) => <group key={`${x}:${z}`} position={[x, 1.55, z]}><mesh><boxGeometry args={[1.15, 3.1, 2.5]} /><meshStandardMaterial color="#302823" roughness={0.88} /></mesh><mesh position={[x < 0 ? .6 : -.6, 0, 0]}><boxGeometry args={[.08, 2.25, 2.05]} /><meshStandardMaterial color="#8a6b54" metalness={.42} roughness={.46} /></mesh></group>))}
      {[-5.15,5.15].map((x)=><group key={`bench-${x}`} position={[x,.82,-.4]}><mesh castShadow><boxGeometry args={[1.8,.18,11.8]} /><meshStandardMaterial color="#665042" roughness={.72} metalness={.12} /></mesh>{[-4.8,-1.6,1.6,4.8].map((z)=><group key={z} position={[0,.18,z]}><mesh><cylinderGeometry args={[.42,.5,.18,10]} /><meshStandardMaterial color="#292d2c" metalness={.55} roughness={.4} /></mesh><mesh position-y={.18} rotation-x={Math.PI/2}><torusGeometry args={[.34,.04,6,24]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.35} metalness={.52} /></mesh></group>)}</group>)}
      {[-7.4, 7.4].map((x) => <group key={x} position-x={x}><mesh castShadow position-y={3.35}><boxGeometry args={[0.34, 6.7, 0.52]} /><meshStandardMaterial color="#675a50" metalness={0.35} /></mesh><mesh castShadow position={[0, 6.52, -0.6]}><boxGeometry args={[0.45, 0.3, 14.2]} /><meshStandardMaterial color="#675a50" metalness={0.38} /></mesh></group>)}
      {[-8.25,8.25].map((x)=><group key={`pipe-${x}`} position-x={x}>{[1.15,2.15,3.15].map((y)=><mesh key={y} position={[0,y,-.6]} rotation-x={Math.PI/2}><cylinderGeometry args={[.08,.08,13.4,8]} /><meshStandardMaterial color={y===2.15 ? "#a16d50" : "#53605d"} metalness={.58} roughness={.35} /></mesh>)}{[-5.8,0,5.8].map((z)=><mesh key={z} position={[x < 0 ? .18 : -.18,2.15,z]} rotation-y={Math.PI/2}><torusGeometry args={[.22,.05,6,20]} /><meshStandardMaterial color="#c18b64" metalness={.66} /></mesh>)}</group>)}
      <mesh castShadow position={[0, 6.35, -1.3]}><boxGeometry args={[15.2, 0.34, 0.42]} /><meshStandardMaterial color="#756252" metalness={0.45} /></mesh>
      {[-4.6,0,4.6].map((z)=><group key={`lamp-${z}`} position={[0,6.12,z]}><mesh position-y={-.34}><cylinderGeometry args={[.035,.035,.68,6]} /><meshStandardMaterial color="#8d765f" metalness={.5} /></mesh><mesh position-y={-.75}><cylinderGeometry args={[.46,.2,.5,10]} /><meshStandardMaterial color="#4c4038" metalness={.34} roughness={.55} /></mesh><mesh position-y={-.9}><sphereGeometry args={[.17,10,7]} /><meshBasicMaterial color="#ffd59a" toneMapped={false} /></mesh><pointLight position-y={-1} color="#e7b27e" intensity={1.7} distance={5.5} /></group>)}
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
      <mesh receiveShadow position={[0, 0.055, -0.45]}><boxGeometry args={[3.55, 0.08, 14.7]} /><meshStandardMaterial color="#1d3038" metalness={0.24} roughness={0.54} /></mesh>
      {[-4.8,-2.4,0,2.4,4.8].map((z) => <mesh key={z} position={[0,.11,z]}><boxGeometry args={[3.4,.025,.055]} /><meshBasicMaterial color={responseColor} transparent opacity={.28} /></mesh>)}
      {[-1.78, 1.78].map((x) => <mesh key={x} position={[x, .105, -.45]}><boxGeometry args={[.055, .035, 14.7]} /><meshBasicMaterial color={responseColor} transparent opacity={.55} /></mesh>)}
      {[-6.75, 6.75].map((x) => [-4.55, -1.55, 1.45, 4.45].map((z) => <group key={`${x}:${z}`} position={[x, 2.1, z]}><mesh><boxGeometry args={[1.35, 4.2, 2.4]} /><meshStandardMaterial color="#172a33" roughness={.78} /></mesh><mesh position={[x < 0 ? .7 : -.7, 0, 0]} rotation-y={Math.PI / 2}><ringGeometry args={[.55, .7, 24]} /><meshBasicMaterial color={accent} transparent opacity={.28} /></mesh></group>))}
      {[-5.1,5.1].map((x)=><group key={`rail-${x}`} position-x={x}><mesh position-y={.18}><boxGeometry args={[.08,.2,13.6]} /><meshStandardMaterial color="#6d8892" metalness={.52} roughness={.32} /></mesh>{[-5.2,-2.6,0,2.6,5.2].map((z)=><group key={z} position={[0,.42,z]}><mesh><cylinderGeometry args={[.52,.66,.46,14]} /><meshStandardMaterial color="#253b45" metalness={.3} roughness={.55} /></mesh><mesh position-y={.27} rotation-x={Math.PI/2}><torusGeometry args={[.5,.035,6,32]} /><meshBasicMaterial color={responseColor} transparent opacity={.42} /></mesh></group>)}</group>)}
      <mesh receiveShadow position={[0, 3.5, -8.15]}><boxGeometry args={[18, 7, 0.35]} /><meshStandardMaterial color="#172b35" roughness={0.82} /></mesh>
      {[-8.8, 8.8].map((x) => <mesh key={x} position={[x, 3.5, 0]}><boxGeometry args={[0.35, 7, 16]} /><meshStandardMaterial color="#172b35" roughness={0.82} /></mesh>)}
      {[-7.9,7.9].map((x)=><group key={`chart-${x}`} position={[x,3.8,-.5]} rotation-y={x<0 ? Math.PI/2 : -Math.PI/2}><mesh><boxGeometry args={[8.8,2.5,.1]} /><meshStandardMaterial color="#10242e" emissive="#183d4b" emissiveIntensity={.2} metalness={.3} roughness={.44} /></mesh>{[-3.25,-1.65,0,1.65,3.25].map((offset,index)=><mesh key={offset} position={[offset,(index%2-.5)*.56,.08]} rotation-z={index*.4}><octahedronGeometry args={[.08,0]} /><meshBasicMaterial color={index%2 ? responseColor : "#c4dce3"} /></mesh>)}</group>)}
      {[[-4.3,5.8],[4.3,5.8]].map(([x,z],index)=><group key={`scope-${index}`} position={[x,1.55,z]} rotation-z={index ? -.72 : .72}><mesh><cylinderGeometry args={[.18,.26,1.9,10]} /><meshStandardMaterial color="#46626c" metalness={.48} roughness={.35} /></mesh><mesh position-y={.98}><cylinderGeometry args={[.31,.31,.18,12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.5} /></mesh><mesh position-y={-.94}><sphereGeometry args={[.25,10,7]} /><meshStandardMaterial color="#7f99a2" metalness={.55} /></mesh></group>)}
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
  const trail = [
    [0, 5.6, 0], [-0.7, 4.15, -0.12], [0.5, 2.75, 0.16], [-0.4, 1.3, -0.08],
    [0.45, -0.15, 0.13], [-0.55, -1.65, -0.12], [0.25, -3.1, 0.08], [0, -4.75, 0],
  ] as const;
  const trunks = [
    [-7.1, -5.2, 5.8, 0.46], [-5.9, 3.8, 5.1, -0.32], [-7.35, 0.2, 6.3, 0.18],
    [6.85, -4.6, 5.5, -0.25], [5.95, 3.95, 6.1, 0.36], [7.3, 0.65, 5.4, -0.16],
  ] as const;
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}><circleGeometry args={[9, 56]} /><meshStandardMaterial color="#16271f" roughness={1} /></mesh>
      {trail.map(([x, z, rotation], index) => <mesh key={index} receiveShadow position={[x, 0.04, z]} rotation={[0, rotation, 0]}><cylinderGeometry args={[1.12 - index * 0.035, 1.24 - index * 0.035, 0.09, 9]} /><meshStandardMaterial color={index % 2 ? "#354638" : "#3b493b"} roughness={0.98} /></mesh>)}
      {trunks.map(([x, z, height, lean], index) => <group key={index} position={[x, 0, z]} rotation-z={lean * 0.16}><mesh castShadow position-y={height / 2}><cylinderGeometry args={[0.2, 0.48, height, 8]} /><meshStandardMaterial color={index % 2 ? "#574b3b" : "#4b4237"} roughness={1} /></mesh><mesh castShadow position={[lean, height, 0]} scale={[1.45, 0.82, 1.2]}><dodecahedronGeometry args={[1.18, 1]} /><meshStandardMaterial color={index % 2 ? "#516d53" : "#60785a"} roughness={0.96} /></mesh></group>)}
      {trunks.map(([x,z],index)=><group key={`roots-${index}`} position={[x,.08,z]} rotation-y={index*.83}>{[-.65,0,.65].map((rotation)=><mesh key={rotation} position={[Math.sin(rotation)*.58,0,Math.cos(rotation)*.58]} rotation={[Math.PI/2,0,rotation]}><coneGeometry args={[.16,1.65,6]} /><meshStandardMaterial color="#554838" roughness={1} /></mesh>)}</group>)}
      {[-5.9, -3.1, 2.7, 5.65].map((x, index) => <group key={x} position={[x, 5.25 + index % 2 * 0.38, -1.2 + index * 0.22]} rotation-z={x * -0.018}><mesh><torusGeometry args={[3.15, 0.045, 6, 54, Math.PI]} /><meshStandardMaterial color="#657861" metalness={0.14} roughness={0.75} /></mesh>{[-1.5, 0, 1.5].map((offset, ribbon) => <mesh key={offset} position={[offset, -1.55 - ribbon * 0.24, 0]} rotation-z={(ribbon - 1) * 0.08}><boxGeometry args={[0.045, 1.1 + ribbon * 0.22, 0.018]} /><meshBasicMaterial color={ribbon === index % 3 ? responseColor : "#b8c5a7"} transparent opacity={0.3 + ribbon * 0.08} /></mesh>)}</group>)}
      {[-5.2,-3.8,3.8,5.2].map((x,index)=><group key={`fern-${x}`} position={[x,.32,1.2-(index%2)*3.8]} rotation-y={index*.9}>{[-.5,-.25,0,.25,.5].map((angle,leaf)=><mesh key={angle} position-y={.35} rotation-z={angle} scale={[.22,.86,.12]}><sphereGeometry args={[.4,8,6]} /><meshStandardMaterial color={leaf%2 ? "#55785a" : "#6b8763"} roughness={1} /></mesh>)}</group>)}
      {[-4.7,-2.3,2.3,4.7].map((x,index)=><group key={`lantern-${x}`} position={[x,2.35,-4.7+(index%2)*8.8]}><mesh position-y={.75}><cylinderGeometry args={[.025,.025,1.5,6]} /><meshStandardMaterial color="#758171" metalness={.35} /></mesh><mesh><dodecahedronGeometry args={[.14,0]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={1.5} /></mesh></group>)}
      <group position={[0, 0.08, -6.35]}><mesh rotation-x={-Math.PI / 2}><circleGeometry args={[2.15, 40]} /><meshStandardMaterial color="#173b39" emissive={responseColor} emissiveIntensity={0.22} roughness={0.32} /></mesh>{[1.35, 1.75, 2.18].map((radius, index) => <mesh key={radius} position-y={0.025 + index * 0.008} rotation-x={-Math.PI / 2}><ringGeometry args={[radius - 0.018, radius, 48]} /><meshBasicMaterial color={responseColor} transparent opacity={0.4 - index * 0.08} /></mesh>)}</group>
      {[-4.8, -1.9, 1.1, 4.45].map((x, index) => <group key={x} position={[x, 0.2, -5.7 + (index % 2) * 1.5]}><mesh rotation={[0.15, index * 0.7, 0.2]}><dodecahedronGeometry args={[0.38 + index * 0.05, 0]} /><meshStandardMaterial color="#48564a" roughness={1} /></mesh><mesh position-y={0.42}><sphereGeometry args={[0.055, 8, 6]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} /></mesh></group>)}
      <mesh position={[0, 0.04, 6.85]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh>
      <pointLight position={[0, 4.4, -1.5]} color={responseColor} intensity={4.2} distance={14} />
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
      <ExhibitPlinth landmarkId={landmarkId} kind={slot.kind} accent={accent} occupied={Boolean(slot.exhibit)} active={active} />
      <group ref={display} position-y={0.35}>
        {slot.exhibit ? <SemanticExhibitModel exhibit={slot.exhibit} kind={slot.kind} active={active} accent={accent} /> : <ReservedModel accent={accent} />}
      </group>
      {landmarkId !== "memory-grove" && <Html position={[0, 2.45, 0]} center distanceFactor={8.2} zIndexRange={[3, 0]} className={`exhibit-world-label exhibit-label-${slot.kind} ${slot.exhibit ? "" : "reserved"}`}>
        <span>{slot.exhibit?.title ?? "预留展位"}</span>
        <small>{slot.exhibit ? getExhibitAction(slot.kind).prompt : "未来展品"}</small>
      </Html>}
    </group>
  );
}

function ExhibitPlinth({ landmarkId, kind, accent, occupied, active }: { landmarkId: string; kind: ExhibitKind; accent: string; occupied: boolean; active: boolean }) {
  const intensity = active ? 0.8 : occupied ? 0.2 : 0.025;
  if (landmarkId === "memory-grove") return null;
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
    if (kind === "daily-signal") {
      return <group><mesh receiveShadow position-y={0.1}><cylinderGeometry args={[0.72, 0.9, 0.2, 12]} /><meshStandardMaterial color="#2b414a" roughness={0.68} metalness={0.24} /></mesh><mesh position-y={0.24} rotation-x={Math.PI / 2}><torusGeometry args={[0.82, 0.022, 5, 36]} /><meshBasicMaterial color="#e8d98d" transparent opacity={active ? 0.76 : 0.3} /></mesh></group>;
    }
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

function HallPlayer({ moveIntent, paused, slots, onNearbySlot, onExitNearby }: HallCanvasProps) {
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
      if (!paused) keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [paused]);

  useEffect(() => { if (paused) keys.current.clear(); }, [paused]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const inputX = paused ? 0 : Number(keys.current.has("KeyD") || keys.current.has("ArrowRight")) - Number(keys.current.has("KeyA") || keys.current.has("ArrowLeft")) + moveIntent.x;
    const inputZ = paused ? 0 : Number(keys.current.has("KeyS") || keys.current.has("ArrowDown")) - Number(keys.current.has("KeyW") || keys.current.has("ArrowUp")) + moveIntent.z;
    const direction = camera.getWorldDirection(cameraDirection.current);
    if (inputX || inputZ) {
      const [x, z] = getCameraRelativeMovement(inputX, inputZ, direction.x, direction.z);
      velocity.current.lerp(direction.set(x, 0, z).multiplyScalar(4.2), Math.min(1, delta * 8));
    } else velocity.current.multiplyScalar(Math.max(0, 1 - delta * 9));
    position.current.addScaledVector(velocity.current, delta);
    position.current.x = THREE.MathUtils.clamp(position.current.x, -3.55, 3.55);
    position.current.z = THREE.MathUtils.clamp(position.current.z, -6.6, 6.8);
    group.current.position.copy(position.current);
    if (velocity.current.lengthSq() > 0.06) group.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    if (avatar.current) {
      const speed = Math.min(1, velocity.current.length() / 4.2);
      spiritMotion.current.speed = speed;
      spiritMotion.current.stride = clock.elapsedTime * 9.5;
      avatar.current.rotation.z = THREE.MathUtils.lerp(avatar.current.rotation.z, -inputX * 0.06, Math.min(1, delta * 8));
    }
    cameraTarget.current.set(position.current.x, 7.2, position.current.z + 9.6);
    camera.position.lerp(cameraTarget.current, 1 - Math.pow(0.002, delta));
    camera.lookAt(position.current.x, 0.9, position.current.z - 1.1);

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
