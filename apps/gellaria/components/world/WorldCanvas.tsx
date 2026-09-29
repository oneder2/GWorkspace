"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { studyArea, type Landmark } from "@/lib/content";
import { getLandmarkInfluence, type LandmarkInfluence } from "@/lib/influence";
import { getCameraRelativeMovement } from "@/lib/movement";
import { isWithinInteractionRange } from "@/lib/proximity";
import { groundPointToward, yawToward } from "@/lib/world-layout";
import { useWorldStore } from "./store";
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
import { CentralCamp } from "./WorldLandmarks";
import { IslandTerrain, terrainHeightAt, WorldEcology } from "./WorldEcology";
import { WorldSky } from "./WorldSky";
import { MuseumExterior } from "./MuseumArchitecture";
import type { MoveIntent } from "./WorldExperience";

type CanvasProps = {
  landmarks: Landmark[];
  active: boolean;
  moveIntent: MoveIntent;
  nearbyId: string | null;
  discoveredIds: string[];
  collectedIds: string[];
  journeyComplete: boolean;
  initialPlayerPosition: [number, number, number];
  studyNearby: boolean;
  onNearby: (landmark: Landmark | null) => void;
  onStudyNearby: (nearby: boolean) => void;
  onStudyEnter: () => void;
  onHallEnter: (landmark: Landmark) => void;
};

export function WorldCanvas(props: CanvasProps) {
  return (
    <Canvas
      className="world-canvas"
      shadows="percentage"
      dpr={[1, 1.55]}
      camera={{ position: [9, 12, 15], fov: 44, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
    >
      <color attach="background" args={["#071219"]} />
      <fog attach="fog" args={["#14262d", 30, 70]} />
      <Suspense fallback={null}>
        <WorldScene {...props} />
      </Suspense>
    </Canvas>
  );
}

function WorldScene(props: CanvasProps) {
  const signals = useWorldStore((state) => state.signals);
  const tags = useWorldStore((state) => state.tags);

  return (
    <>
      <ambientLight intensity={0.9} color="#afc8c7" />
      <directionalLight
        castShadow
        position={[7, 16, 9]}
        intensity={2.2}
        color="#ffd0a3"
        shadow-mapSize={[1024, 1024]}
        shadow-normalBias={0.04}
        shadow-camera-far={46}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <hemisphereLight args={["#688c9d", "#182a22", 1.3]} />
      <WorldSky />
      <Ocean />
      <Physics gravity={[0, -20, 0]}>
        <Island />
        <Paths landmarks={props.landmarks} />
        <group position-y={terrainHeightAt(0, 1)}><CentralCamp journeyComplete={props.journeyComplete} /></group>
        <StudyLodge nearby={props.studyNearby} onEnter={props.onStudyEnter} />
        {props.landmarks.map((landmark) => (
          <LandmarkObject
            key={landmark.id}
            landmark={landmark}
            signalCount={signals[landmark.id] ?? 0}
            tagCounts={tags[landmark.id]}
            nearby={props.nearbyId === landmark.id}
            surveyed={props.discoveredIds.includes(landmark.id)}
            collected={props.collectedIds.includes(landmark.id)}
            onEnter={props.onHallEnter}
          />
        ))}
        <Player {...props} />
        <OtherPlayers />
        <WorldEcology />
      </Physics>
      <Sparkles count={48} scale={[34, 7, 34]} size={1.5} speed={0.16} opacity={0.28} color="#d9dfbc" position={[0, 4, 0]} />
    </>
  );
}

function Ocean() {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 0.45) * 0.025;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.82} receiveShadow>
      <circleGeometry args={[24, 96]} />
      <meshStandardMaterial ref={material} color="#1c3b43" emissive="#31555b" roughness={0.56} metalness={0.1} />
    </mesh>
  );
}

function Island() {
  return (
    <group>
      <IslandTerrain />
      <RigidBody type="fixed" colliders="hull">
        <mesh receiveShadow position-y={-0.43}>
          <cylinderGeometry args={[19.25, 17.1, 0.86, 20]} />
          <meshStandardMaterial color="#31453b" roughness={0.96} />
        </mesh>
        <mesh receiveShadow position-y={-0.89}>
          <cylinderGeometry args={[17.1, 15.4, 0.72, 20]} />
          <meshStandardMaterial color="#243934" roughness={1} />
        </mesh>
      </RigidBody>
    </group>
  );
}

function Paths({ landmarks }: { landmarks: Landmark[] }) {
  return <>{landmarks.map((landmark) => <Path key={landmark.id} landmark={landmark} />)}</>;
}

function Path({ landmark }: { landmark: Landmark }) {
  const { position: destination, accent: color } = landmark;
  const curve = useMemo(() => {
    const approachDistance = hallPortalZ(landmark.id) * 0.78 + 0.4;
    const [endX, endZ] = groundPointToward(destination, approachDistance);
    const end = new THREE.Vector3(endX, terrainHeightAt(endX, endZ) + 0.08, endZ);
    const middle = end.clone().multiplyScalar(0.48);
    middle.x += destination[2] * 0.06;
    middle.y = terrainHeightAt(middle.x, middle.z) + 0.08;
    return new THREE.CatmullRomCurve3([new THREE.Vector3(0, terrainHeightAt(0, 1.5) + 0.08, 1.5), middle, end]);
  }, [destination, landmark.id]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 26, 0.16, 5, false), [curve]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={1} /></mesh>;
}

function StudyLodge({ nearby, onEnter }: { nearby: boolean; onEnter: () => void }) {
  return <group position={[studyArea.position[0], terrainHeightAt(studyArea.position[0], studyArea.position[2]), studyArea.position[2]]} rotation-y={yawToward(studyArea.position)}>
    <group scale={.78}><MuseumExterior kind="study" accent="#e8c87d" nearby={nearby} /></group>
    <Html position={[0, 3.65, 0]} center distanceFactor={16} zIndexRange={[4, 0]} className="world-label study-world-label">
      {nearby ? <button onClick={onEnter}><span>{studyArea.name}</span><small>E 进入阅读亭</small></button> : <span>{studyArea.name}<small>临时停泊 · 阅读亭</small></span>}
    </Html>
  </group>;
}

function LandmarkObject({ landmark, signalCount, tagCounts, nearby, surveyed, collected, onEnter }: { landmark: Landmark; signalCount: number; tagCounts?: Record<string, number>; nearby: boolean; surveyed: boolean; collected: boolean; onEnter: (landmark: Landmark) => void }) {
  const influence = useMemo(
    () => getLandmarkInfluence(signalCount, tagCounts, landmark.tagOptions),
    [landmark.tagOptions, signalCount, tagCounts],
  );
  const responseColor = landmark.influenceColors[Math.max(0, influence.dominantTagIndex)] ?? landmark.accent;
  return (
    <group position={[landmark.position[0], terrainHeightAt(landmark.position[0], landmark.position[2]), landmark.position[2]]}>
      <group>
        <HallExterior landmark={landmark} nearby={nearby} responseColor={responseColor} influence={influence} />
      </group>
      <Beacon color={responseColor} influence={influence} selected={nearby} />
      <Html position={[0, landmark.id === "workshop" ? 4.45 : 3.55, 0]} center distanceFactor={16} zIndexRange={[4, 0]} className="world-label landmark-label">
        {nearby ? (
          <button className={surveyed ? "surveyed" : ""} onClick={(event) => { event.stopPropagation(); onEnter(landmark); }}>
            <span>{landmark.name}</span><small>入口已开启 · E 进入</small>
          </button>
        ) : (
          <span><span>{landmark.name}</span><small>{collected ? "展馆已参观" : surveyed ? `${influence.tierLabel} · 已测绘` : `${signalCount} 道光迹`}</small></span>
        )}
      </Html>
    </group>
  );
}

function HallExterior({ landmark, nearby, responseColor }: { landmark: Landmark; nearby: boolean; responseColor: string; influence: LandmarkInfluence }) {
  return <group scale={.78} rotation-y={yawToward(landmark.position)}>
    <MuseumExterior kind={landmark.id} accent={responseColor} nearby={nearby} />
  </group>;
}

function hallPortalZ(landmarkId: string) {
  if (landmarkId === "observatory") return 3.66;
  if (landmarkId === "memory-grove") return 3.52;
  return 2.72;
}

function Beacon({ color, influence, selected }: { color: string; influence: LandmarkInfluence; selected: boolean }) {
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (rings.current) {
      rings.current.rotation.y += delta * 0.35;
      rings.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.4) * 0.025);
    }
  });
  const intensity = 0.8 + influence.strength * 2.4 + (selected ? 1 : 0);
  return (
    <group ref={rings} position-y={0.6}>
      <mesh rotation-x={Math.PI / 2}><torusGeometry args={[3.55, 0.035, 5, 64]} /><meshBasicMaterial color={color} transparent opacity={0.2 + influence.strength * 0.28} /></mesh>
      <mesh rotation-x={Math.PI / 2} rotation-y={Math.PI / 5}><torusGeometry args={[3.9, 0.018, 4, 64]} /><meshBasicMaterial color={color} transparent opacity={0.1 + influence.strength * 0.18} /></mesh>
      <pointLight color={color} intensity={intensity} distance={9} />
    </group>
  );
}

function Player({ active, moveIntent, initialPlayerPosition, landmarks, onNearby, onStudyNearby }: Pick<CanvasProps, "active" | "moveIntent" | "initialPlayerPosition" | "landmarks" | "onNearby" | "onStudyNearby">) {
  const group = useRef<THREE.Group>(null);
  const avatar = useRef<THREE.Group>(null);
  const travelerMotion = useRef<SpiritMotion>({ speed: 0, stride: 0 });
  const position = useRef(new THREE.Vector3(...initialPlayerPosition));
  const velocity = useRef(new THREE.Vector3());
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraOffset = useRef(new THREE.Vector3(8.5, 10.5, 13));
  const keys = useRef(new Set<string>());
  const nearbyId = useRef<string | null>(null);
  const studyNearby = useRef(false);
  const { camera } = useThree();
  const sendMove = useWorldStore((state) => state.sendMove);
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
    if (active && (inputX !== 0 || inputZ !== 0)) {
      const [movementX, movementZ] = getCameraRelativeMovement(inputX, inputZ, direction.x, direction.z);
      direction.set(movementX, 0, movementZ);
      velocity.current.lerp(direction.multiplyScalar(5), Math.min(1, delta * 8));
    } else velocity.current.multiplyScalar(Math.max(0, 1 - delta * 9));
    position.current.addScaledVector(velocity.current, delta);
    const radius = Math.hypot(position.current.x, position.current.z);
    if (radius > 17.4) position.current.multiplyScalar(17.4 / radius);
    position.current.y = terrainHeightAt(position.current.x, position.current.z) + 0.05;
    group.current.position.copy(position.current);
    if (velocity.current.lengthSq() > 0.08) group.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    if (avatar.current) {
      const speed = Math.min(1, velocity.current.length() / 5);
      const stride = clock.elapsedTime * 10.5;
      avatar.current.rotation.z = THREE.MathUtils.lerp(avatar.current.rotation.z, -inputX * 0.07, Math.min(1, delta * 8));
      avatar.current.rotation.x = THREE.MathUtils.lerp(avatar.current.rotation.x, Math.sin(stride * 0.5) * 0.025 * speed, Math.min(1, delta * 8));
      travelerMotion.current.speed = speed;
      travelerMotion.current.stride = stride;
    }

    cameraTarget.current.copy(position.current).add(cameraOffset.current);
    camera.position.lerp(cameraTarget.current, 1 - Math.pow(0.001, delta));
    camera.lookAt(position.current.x, position.current.y + 0.72, position.current.z);
    if (active) sendMove([position.current.x, position.current.y, position.current.z], group.current.rotation.y);

    let nearest: Landmark | null = null;
    let distance = 5;
    for (const landmark of landmarks) {
      const dx = position.current.x - landmark.position[0];
      const dz = position.current.z - landmark.position[2];
      const current = Math.hypot(dx, dz);
      if (current < distance) { distance = current; nearest = landmark; }
    }
    const nextId = nearest?.id ?? null;
    if (nextId !== nearbyId.current) { nearbyId.current = nextId; onNearby(nearest); }
    const nextStudyNearby = isWithinInteractionRange(
      [position.current.x, position.current.z],
      [studyArea.position[0], studyArea.position[2]],
      studyArea.interactionRadius,
      studyArea.interactionReleaseRadius,
      studyNearby.current,
    );
    if (nextStudyNearby !== studyNearby.current) {
      studyNearby.current = nextStudyNearby;
      onStudyNearby(nextStudyNearby);
    }
  });

  return (
    <group ref={group}>
      <group ref={avatar}>
        <SpiritTraveler appearance={playerAppearance} motion={travelerMotion} />
      </group>
    </group>
  );
}

function OtherPlayers() {
  const players = useWorldStore((state) => state.players);
  return <>{Object.values(players).filter((player) => !player.room || player.room === "island").map((player) => <RemotePlayer key={player.id} player={player} />)}</>;
}

function RemotePlayer({ player }: { player: ReturnType<typeof Object.values<import("@/lib/protocol").PublicPlayer>>[number] }) {
  const group = useRef<THREE.Group>(null);
  const travelerMotion = useRef<SpiritMotion>({ speed: 0, stride: 0 });
  const target = useRef(new THREE.Vector3(player.position[0], terrainHeightAt(player.position[0], player.position[2]) + 0.05, player.position[2]));
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    target.current.set(player.position[0], terrainHeightAt(player.position[0], player.position[2]) + 0.05, player.position[2]);
    const movement = group.current.position.distanceTo(target.current);
    group.current.position.lerp(target.current, 1 - Math.pow(0.002, delta));
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, player.rotation, delta * 8);
    travelerMotion.current.speed = Math.min(1, movement * 7);
    travelerMotion.current.stride = clock.elapsedTime * 9 + player.id.charCodeAt(0);
  });
  return (
    <group ref={group} position={[player.position[0], terrainHeightAt(player.position[0], player.position[2]) + 0.05, player.position[2]]}>
      <SpiritTraveler appearance={player.appearance ?? { palette: 0, form: 0 }} motion={travelerMotion} opacity={0.82} remote />
      <Html position={[0, 2.05, 0]} center distanceFactor={13} zIndexRange={[4, 0]} className="traveler-label">
        旅人 {player.id.slice(0, 4).toUpperCase()}
      </Html>
    </group>
  );
}
