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
import { useWorldStore } from "./store";
import { CentralCamp } from "./WorldLandmarks";
import { IslandTerrain, terrainHeightAt, WorldEcology } from "./WorldEcology";
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
      shadows="basic"
      dpr={[1, 1.55]}
      camera={{ position: [9, 12, 15], fov: 44, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
    >
      <color attach="background" args={["#101d24"]} />
      <fog attach="fog" args={["#172830", 28, 66]} />
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
        shadow-camera-far={46}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <hemisphereLight args={["#688c9d", "#182a22", 1.3]} />
      <Starscape />
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

function Starscape() {
  const points = useMemo(() => {
    const positions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
      const radius = 38 + seededValue(index * 3) * 34;
      const angle = seededValue(index * 3 + 1) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = 12 + seededValue(index * 3 + 2) * 30;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
      <pointsMaterial color="#d9e5df" size={0.13} transparent opacity={0.58} sizeAttenuation />
    </points>
  );
}

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function Ocean() {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 0.45) * 0.025;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.82} receiveShadow>
      <circleGeometry args={[72, 96]} />
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
  return <>{landmarks.map((landmark) => <Path key={landmark.id} destination={landmark.position} color={landmark.accent} />)}</>;
}

function Path({ destination, color }: { destination: [number, number, number]; color: string }) {
  const curve = useMemo(() => {
    const endX = destination[0] * 0.9;
    const endZ = destination[2] * 0.9;
    const end = new THREE.Vector3(endX, terrainHeightAt(endX, endZ) + 0.08, endZ);
    const middle = end.clone().multiplyScalar(0.48);
    middle.x += destination[2] * 0.06;
    middle.y = terrainHeightAt(middle.x, middle.z) + 0.08;
    return new THREE.CatmullRomCurve3([new THREE.Vector3(0, terrainHeightAt(0, 1.5) + 0.08, 1.5), middle, end]);
  }, [destination]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 26, 0.16, 5, false), [curve]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={1} /></mesh>;
}

function StudyLodge({ nearby, onEnter }: { nearby: boolean; onEnter: () => void }) {
  const windowLight = useRef<THREE.PointLight>(null);
  const weatherRing = useRef<THREE.Group>(null);
  const groundRing = useRef<THREE.Group>(null);
  const groundRingMaterial = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, delta) => {
    if (windowLight.current) windowLight.current.intensity = 3.8 + Math.sin(clock.elapsedTime * 0.8) * 0.35;
    if (weatherRing.current) weatherRing.current.rotation.z += delta * (nearby ? 0.65 : 0.18);
    if (groundRing.current) groundRing.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.1) * (nearby ? 0.045 : 0.018));
    if (groundRingMaterial.current) {
      const targetOpacity = nearby ? 0.68 : 0.2;
      groundRingMaterial.current.opacity = THREE.MathUtils.lerp(groundRingMaterial.current.opacity, targetOpacity, Math.min(1, delta * 6));
    }
  });

  return (
    <group position={[studyArea.position[0], terrainHeightAt(studyArea.position[0], studyArea.position[2]), studyArea.position[2]]} rotation-y={-0.42}>
      <group scale={0.76}>
        <mesh receiveShadow position-y={0.18}>
          <cylinderGeometry args={[3.25, 3.55, 0.36, 8]} />
          <meshStandardMaterial color="#46514a" roughness={1} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[4.8, 2.9, 3.9]} />
          <meshStandardMaterial color="#5b5147" roughness={0.92} />
        </mesh>

        {[-2.18, 2.18].map((x) => (
          <mesh key={x} castShadow position={[x, 1.55, 2]}>
            <boxGeometry args={[0.18, 2.9, 0.18]} />
            <meshStandardMaterial color="#3a302b" roughness={0.84} />
          </mesh>
        ))}
        {[0.34, 2.76].map((y) => (
          <mesh key={y} castShadow position={[0, y, 2]}>
            <boxGeometry args={[4.55, 0.18, 0.18]} />
            <meshStandardMaterial color="#3a302b" roughness={0.84} />
          </mesh>
        ))}

        <mesh castShadow receiveShadow position={[-1.28, 3.5, 0]} rotation-z={0.58}>
          <boxGeometry args={[3.25, 0.24, 4.55]} />
          <meshStandardMaterial color="#1b292d" roughness={0.72} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.28, 3.5, 0]} rotation-z={-0.58}>
          <boxGeometry args={[3.25, 0.24, 4.55]} />
          <meshStandardMaterial color="#223238" roughness={0.72} />
        </mesh>

        <group position={[1.48, 3.95, -0.72]} rotation-z={-0.08}>
          <mesh castShadow position-y={0.25}>
            <boxGeometry args={[0.58, 1.75, 0.58]} />
            <meshStandardMaterial color="#4b3e37" roughness={0.9} />
          </mesh>
          <mesh castShadow position-y={1.14}>
            <boxGeometry args={[0.78, 0.16, 0.78]} />
            <meshStandardMaterial color="#302d2c" roughness={0.86} />
          </mesh>
        </group>

        <group position={[0.58, 1.58, 2.01]}>
          <mesh>
            <planeGeometry args={[2.25, 1.35]} />
            <meshStandardMaterial color="#e8c87d" emissive="#d79d61" emissiveIntensity={1.85} />
          </mesh>
          <mesh position-y={0.74}><boxGeometry args={[2.48, 0.13, 0.12]} /><meshStandardMaterial color="#2b3230" /></mesh>
          <mesh position-y={-0.74}><boxGeometry args={[2.48, 0.13, 0.12]} /><meshStandardMaterial color="#2b3230" /></mesh>
          <mesh position-x={-1.18}><boxGeometry args={[0.13, 1.58, 0.12]} /><meshStandardMaterial color="#2b3230" /></mesh>
          <mesh position-x={1.18}><boxGeometry args={[0.13, 1.58, 0.12]} /><meshStandardMaterial color="#2b3230" /></mesh>
          <mesh><boxGeometry args={[0.1, 1.42, 0.13]} /><meshStandardMaterial color="#4b443b" /></mesh>
        </group>

        <group position={[-1.48, 1.16, 2.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.94, 2.18, 0.2]} />
            <meshStandardMaterial color="#263237" roughness={0.82} />
          </mesh>
          <mesh position={[0.28, 0, 0.13]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshStandardMaterial color="#b88a5d" metalness={0.58} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 1.3, 0.12]} rotation-x={-0.12}>
            <boxGeometry args={[1.45, 0.16, 0.88]} />
            <meshStandardMaterial color="#3a302b" roughness={0.82} />
          </mesh>
        </group>

        <mesh castShadow receiveShadow position={[-1.48, 0.24, 2.52]}>
          <boxGeometry args={[1.55, 0.3, 0.75]} />
          <meshStandardMaterial color="#5b5a4e" roughness={1} />
        </mesh>
        <mesh castShadow receiveShadow position={[-1.48, 0.08, 3.02]}>
          <boxGeometry args={[1.95, 0.18, 0.62]} />
          <meshStandardMaterial color="#474b43" roughness={1} />
        </mesh>

        <mesh rotation-x={-Math.PI / 2} position={[-0.65, 0.08, 3.4]} scale={[0.72, 1.55, 1]}>
          <circleGeometry args={[1.85, 24]} />
          <meshBasicMaterial color="#e8c87d" transparent opacity={nearby ? 0.15 : 0.07} depthWrite={false} />
        </mesh>

        <group ref={weatherRing} position={[-1.48, 2.82, 2.13]}>
          <mesh><torusGeometry args={[0.4, 0.045, 6, 28]} /><meshStandardMaterial color="#9d704f" metalness={0.6} roughness={0.36} emissive="#7c4f32" emissiveIntensity={nearby ? 0.8 : 0.25} /></mesh>
          <mesh rotation-z={Math.PI / 4}><boxGeometry args={[0.72, 0.035, 0.06]} /><meshBasicMaterial color="#d2aa72" /></mesh>
          <mesh rotation-z={-Math.PI / 4}><boxGeometry args={[0.72, 0.035, 0.06]} /><meshBasicMaterial color="#d2aa72" /></mesh>
          <mesh><octahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color="#f0d59a" emissive="#e8c87d" emissiveIntensity={1.7} /></mesh>
        </group>

        <group ref={groundRing} position={[-0.6, 0.13, 3.4]}>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[1.72, 0.035, 5, 56]} />
            <meshBasicMaterial ref={groundRingMaterial} color="#e8c87d" transparent opacity={0.2} depthWrite={false} />
          </mesh>
          {[0, 1, 2].map((index) => (
            <mesh key={index} rotation-y={index * Math.PI * 2 / 3} position={[Math.cos(index * Math.PI * 2 / 3) * 1.72, 0, Math.sin(index * Math.PI * 2 / 3) * 1.72]}>
              <octahedronGeometry args={[0.085, 0]} />
              <meshBasicMaterial color="#e8c87d" transparent opacity={nearby ? 0.85 : 0.35} />
            </mesh>
          ))}
        </group>

        <mesh position={[2.41, 1.48, 0.25]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.5, 1.05]} />
          <meshStandardMaterial color="#aa9c71" emissive="#b88a5d" emissiveIntensity={0.65} />
        </mesh>
        <pointLight ref={windowLight} position={[0, 2, 3]} color="#e8c87d" distance={10} decay={2} />
      </group>
      <Html position={[0, 5.35, 0]} center distanceFactor={16} zIndexRange={[4, 0]} className={`world-label study-world-label ${nearby ? "active" : ""}`}>
        {nearby ? (
          <button onClick={onEnter}><span>{studyArea.name}</span><small>入口已开启</small></button>
        ) : (
          <span>{studyArea.name}<small>靠近亮窗进入</small></span>
        )}
      </Html>
    </group>
  );
}

function LandmarkObject({ landmark, signalCount, tagCounts, nearby, surveyed, collected, onEnter }: { landmark: Landmark; signalCount: number; tagCounts?: Record<string, number>; nearby: boolean; surveyed: boolean; collected: boolean; onEnter: (landmark: Landmark) => void }) {
  const group = useRef<THREE.Group>(null);
  const influence = useMemo(
    () => getLandmarkInfluence(signalCount, tagCounts, landmark.tagOptions),
    [landmark.tagOptions, signalCount, tagCounts],
  );
  const responseColor = landmark.influenceColors[Math.max(0, influence.dominantTagIndex)] ?? landmark.accent;
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.7 + landmark.position[0]) * 0.035;
  });
  return (
    <group position={[landmark.position[0], terrainHeightAt(landmark.position[0], landmark.position[2]), landmark.position[2]]}>
      <group ref={group}>
        <HallExterior landmark={landmark} nearby={nearby} responseColor={responseColor} influence={influence} />
      </group>
      <Beacon color={responseColor} influence={influence} selected={nearby} />
      <Html position={[0, landmark.id === "observatory" ? 6.45 : landmark.id === "memory-grove" ? 6.2 : 5.35, 0]} center distanceFactor={16} zIndexRange={[4, 0]} className="world-label landmark-label">
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

function HallExterior({ landmark, nearby, responseColor, influence }: { landmark: Landmark; nearby: boolean; responseColor: string; influence: LandmarkInfluence }) {
  const isObservatory = landmark.id === "observatory";
  const isGrove = landmark.id === "memory-grove";
  const wall = isObservatory ? "#334b57" : isGrove ? "#3f5147" : "#57483e";
  const frame = isObservatory ? "#7792a0" : isGrove ? "#718270" : "#89725f";
  return (
    <group scale={0.78} rotation-y={landmark.id === "workshop" ? -0.18 : landmark.id === "observatory" ? 0.18 : -0.08}>
      <mesh receiveShadow position-y={0.2}><cylinderGeometry args={[4.4, 4.7, 0.4, 8]} /><meshStandardMaterial color="#3c4741" roughness={0.96} /></mesh>
      <mesh castShadow receiveShadow position={[0, 2.25, -0.35]}><boxGeometry args={[7.3, 4.2, 5.6]} /><meshStandardMaterial color={wall} roughness={0.86} /></mesh>
      <mesh position={[-2.45, 2.15, 2.5]}><boxGeometry args={[2.25, 3.6, 0.3]} /><meshStandardMaterial color={wall} roughness={0.86} /></mesh>
      <mesh position={[2.45, 2.15, 2.5]}><boxGeometry args={[2.25, 3.6, 0.3]} /><meshStandardMaterial color={wall} roughness={0.86} /></mesh>
      <mesh position={[0, 3.65, 2.5]}><boxGeometry args={[2.7, 0.62, 0.3]} /><meshStandardMaterial color={frame} metalness={0.25} roughness={0.62} /></mesh>
      <mesh position={[0, 1.55, 2.52]}><boxGeometry args={[2.35, 3.35, 0.18]} /><meshStandardMaterial color="#142023" emissive={responseColor} emissiveIntensity={nearby ? 0.42 : 0.12} /></mesh>
      <mesh position={[0, 1.55, 2.65]}><planeGeometry args={[1.35, 2.55]} /><meshBasicMaterial color={responseColor} transparent opacity={nearby ? 0.32 : 0.11} /></mesh>
      {[-3.35, 3.35].map((x) => <group key={x} position-x={x}><mesh position-y={2.2}><boxGeometry args={[0.28, 4.4, 0.4]} /><meshStandardMaterial color={frame} metalness={0.32} /></mesh><mesh position={[x < 0 ? -0.34 : 0.34, 1.25, 0]}><boxGeometry args={[0.55, 2.2, 3.8]} /><meshStandardMaterial color="#2b3835" roughness={0.9} /></mesh></group>)}
      {isObservatory ? (
        <group position-y={4.25}><mesh rotation-x={Math.PI / 2}><sphereGeometry args={[3.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#29424f" metalness={0.35} roughness={0.5} side={THREE.DoubleSide} /></mesh><mesh position-y={2.75} rotation={[0.35, 0, -0.3]}><cylinderGeometry args={[0.48, 0.72, 2.8, 14]} /><meshStandardMaterial color={frame} metalness={0.55} roughness={0.3} /></mesh></group>
      ) : isGrove ? (
        <group position-y={4.5}>{[-2.2, 0, 2.2].map((x, index) => <group key={x} position-x={x}><mesh rotation-z={index === 1 ? 0 : x < 0 ? -0.35 : 0.35}><cylinderGeometry args={[0.09, 0.16, 3.6, 7]} /><meshStandardMaterial color={frame} /></mesh><mesh position-y={1.55}><icosahedronGeometry args={[0.85, 1]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={0.18 + influence.strength * 0.6} wireframe /></mesh></group>)}</group>
      ) : (
        <group position-y={4.5}>{[-2.45, 0, 2.45].map((x, index) => <mesh key={x} position-x={x} rotation-z={index === 1 ? 0 : x < 0 ? 0.32 : -0.32}><boxGeometry args={[2.8, 0.32, 5.8]} /><meshStandardMaterial color={index === 1 ? "#443b35" : "#39413e"} metalness={0.2} roughness={0.7} /></mesh>)}</group>
      )}
      <pointLight position={[0, 2.1, 3]} color={responseColor} intensity={(nearby ? 4 : 1.2) + influence.strength * 3} distance={9} decay={2} />
    </group>
  );
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
  const travelerMotion = useRef({ speed: 0, stride: 0 });
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
  const playerColor = useWorldStore((state) => state.playerColor);

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
      avatar.current.position.y = Math.sin(stride) * 0.055 * speed;
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
        <TravelerFigure color={playerColor} motion={travelerMotion} />
      </group>
    </group>
  );
}

function OtherPlayers() {
  const players = useWorldStore((state) => state.players);
  return <>{Object.values(players).map((player) => <RemotePlayer key={player.id} player={player} />)}</>;
}

function RemotePlayer({ player }: { player: ReturnType<typeof Object.values<import("@/lib/protocol").PublicPlayer>>[number] }) {
  const group = useRef<THREE.Group>(null);
  const travelerMotion = useRef({ speed: 0, stride: 0 });
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
      <TravelerFigure color={player.color} motion={travelerMotion} opacity={0.78} remote />
      <Html position={[0, 2.05, 0]} center distanceFactor={13} zIndexRange={[4, 0]} className="traveler-label">
        旅人 {player.id.slice(0, 4).toUpperCase()}
      </Html>
    </group>
  );
}

type TravelerMotion = { speed: number; stride: number };

function TravelerFigure({ color, motion, opacity = 1, remote = false }: { color: string; motion: React.RefObject<TravelerMotion>; opacity?: number; remote?: boolean }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const scarf = useRef<THREE.Group>(null);
  const lantern = useRef<THREE.Group>(null);
  const translucent = opacity < 1;
  const materialProps = { transparent: translucent, opacity };
  useFrame(() => {
    const { speed, stride } = motion.current;
    const swing = Math.sin(stride) * 0.62 * speed;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.72;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.72;
    if (scarf.current) scarf.current.rotation.x = -0.18 - speed * 0.24 + Math.sin(stride * 0.45) * 0.05;
    if (lantern.current) lantern.current.rotation.z = Math.sin(stride * 0.55) * 0.12 * speed;
  });
  return (
    <group scale={remote ? 0.86 : 0.92}>
      <group ref={leftLeg} position={[-0.17, 0.64, 0]}>
        <mesh castShadow position-y={-0.26}><capsuleGeometry args={[0.105, 0.38, 4, 7]} /><meshStandardMaterial color="#46505a" roughness={0.9} {...materialProps} /></mesh>
        <mesh castShadow position={[-0.01, -0.55, 0.08]} scale={[1, 0.78, 1.32]}><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#272d31" roughness={0.96} {...materialProps} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.17, 0.64, 0]}>
        <mesh castShadow position-y={-0.26}><capsuleGeometry args={[0.105, 0.38, 4, 7]} /><meshStandardMaterial color="#46505a" roughness={0.9} {...materialProps} /></mesh>
        <mesh castShadow position={[0.01, -0.55, 0.08]} scale={[1, 0.78, 1.32]}><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#272d31" roughness={0.96} {...materialProps} /></mesh>
      </group>

      <mesh castShadow position-y={1.03} scale={[0.92, 1.08, 0.72]}>
        <capsuleGeometry args={[0.32, 0.55, 5, 9]} />
        <meshStandardMaterial color="#d1d1bd" roughness={0.88} {...materialProps} />
      </mesh>
      <mesh castShadow position={[0, 1.07, -0.28]} scale={[0.8, 1, 0.45]}>
        <boxGeometry args={[0.55, 0.58, 0.3]} />
        <meshStandardMaterial color="#384747" roughness={0.92} {...materialProps} />
      </mesh>
      <mesh position={[0, 1.04, -0.46]}><boxGeometry args={[0.34, 0.06, 0.08]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} {...materialProps} /></mesh>

      <group ref={leftArm} position={[-0.37, 1.25, 0]} rotation-z={-0.08}>
        <mesh castShadow position-y={-0.25}><capsuleGeometry args={[0.09, 0.39, 4, 7]} /><meshStandardMaterial color="#b7b9ab" roughness={0.9} {...materialProps} /></mesh>
        <mesh position-y={-0.5}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#bd9178" roughness={0.85} {...materialProps} /></mesh>
      </group>
      <group ref={rightArm} position={[0.37, 1.25, 0]} rotation-z={0.08}>
        <mesh castShadow position-y={-0.25}><capsuleGeometry args={[0.09, 0.39, 4, 7]} /><meshStandardMaterial color="#b7b9ab" roughness={0.9} {...materialProps} /></mesh>
        <mesh position-y={-0.5}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#bd9178" roughness={0.85} {...materialProps} /></mesh>
      </group>

      <mesh castShadow position-y={1.69}><sphereGeometry args={[0.31, 14, 10]} /><meshStandardMaterial color="#c99a7d" roughness={0.88} {...materialProps} /></mesh>
      <mesh castShadow position={[0, 1.76, -0.04]} scale={[1.05, 0.78, 1.04]}>
        <sphereGeometry args={[0.315, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color="#29353a" roughness={0.93} {...materialProps} />
      </mesh>
      <mesh position={[-0.115, 1.72, 0.285]}><sphereGeometry args={[0.025, 6, 5]} /><meshBasicMaterial color="#182126" {...materialProps} /></mesh>
      <mesh position={[0.115, 1.72, 0.285]}><sphereGeometry args={[0.025, 6, 5]} /><meshBasicMaterial color="#182126" {...materialProps} /></mesh>
      <mesh position={[0, 1.64, 0.315]} rotation-x={Math.PI / 2}><coneGeometry args={[0.045, 0.13, 5]} /><meshStandardMaterial color="#a96f5e" {...materialProps} /></mesh>

      <mesh position-y={1.43} rotation-x={Math.PI / 2}><torusGeometry args={[0.275, 0.065, 6, 18]} /><meshStandardMaterial color={color} roughness={0.8} emissive={color} emissiveIntensity={0.18} {...materialProps} /></mesh>
      <group ref={scarf} position={[0.16, 1.42, -0.25]} rotation-x={-0.18}>
        <mesh position-z={-0.26}><boxGeometry args={[0.16, 0.07, 0.55]} /><meshStandardMaterial color={color} roughness={0.82} {...materialProps} /></mesh>
      </group>

      <group ref={lantern} position={[-0.48, 0.72, 0.02]}>
        <mesh position-y={0.18}><torusGeometry args={[0.11, 0.022, 5, 12]} /><meshStandardMaterial color="#80684d" metalness={0.5} roughness={0.45} {...materialProps} /></mesh>
        <mesh><cylinderGeometry args={[0.11, 0.13, 0.25, 6]} /><meshStandardMaterial color="#f0cc83" emissive="#eaa35f" emissiveIntensity={2.1} transparent opacity={opacity * 0.82} /></mesh>
        <pointLight color="#f3b86e" intensity={remote ? 0.65 : 1.2} distance={3.2} />
      </group>
      <pointLight position={[0, 1.52, 0.2]} color={color} intensity={remote ? 0.55 : 0.9} distance={3.4} />
    </group>
  );
}
