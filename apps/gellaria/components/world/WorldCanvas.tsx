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
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
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
    const positions = new Float32Array(760 * 3);
    for (let index = 0; index < 760; index += 1) {
      const radius = 52 + seededValue(index * 4) * 30;
      const angle = seededValue(index * 4 + 1) * Math.PI * 2;
      const elevation = 0.08 + seededValue(index * 4 + 2) * 1.34;
      positions[index * 3] = Math.cos(angle) * Math.cos(elevation) * radius;
      positions[index * 3 + 1] = 5 + Math.sin(elevation) * radius;
      positions[index * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * radius;
    }
    return positions;
  }, []);
  const brightPoints = useMemo(() => {
    const positions = new Float32Array(110 * 3);
    for (let index = 0; index < 110; index += 1) {
      const radius = 45 + seededValue(index * 5 + 900) * 22;
      const angle = seededValue(index * 5 + 901) * Math.PI * 2;
      const elevation = 0.15 + seededValue(index * 5 + 902) * 1.24;
      positions[index * 3] = Math.cos(angle) * Math.cos(elevation) * radius;
      positions[index * 3 + 1] = 6 + Math.sin(elevation) * radius;
      positions[index * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * radius;
    }
    return positions;
  }, []);

  return (
    <group>
      <mesh><sphereGeometry args={[88, 32, 18]} /><meshBasicMaterial color="#071219" side={THREE.BackSide} fog={false} /></mesh>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
        <pointsMaterial color="#c7d9dc" size={0.16} transparent opacity={0.72} sizeAttenuation fog={false} depthWrite={false} />
      </points>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[brightPoints, 3]} /></bufferGeometry>
        <pointsMaterial color="#f2dfb2" size={0.29} transparent opacity={0.88} sizeAttenuation fog={false} depthWrite={false} />
      </points>
    </group>
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
        <mesh castShadow position={[0, 4.18, 0]}><boxGeometry args={[.16, .18, 4.75]} /><meshStandardMaterial color="#718078" metalness={.38} roughness={.52} /></mesh>
        {[-1.55, 0, 1.55].map((x) => <mesh key={x} position={[x, 2.78, 2.08]}><boxGeometry args={[.1, 2.55, .12]} /><meshStandardMaterial color="#443932" roughness={.8} /></mesh>)}
        <group position={[-1.45, 3.18, 2.48]}><mesh rotation-z={-.16}><boxGeometry args={[2.35, .16, 1.15]} /><meshStandardMaterial color="#28383a" metalness={.18} roughness={.66} /></mesh>{[-.92,.92].map((x)=><mesh key={x} position={[x,-.42,.18]}><cylinderGeometry args={[.05,.05,.85,6]} /><meshStandardMaterial color="#7c6b55" metalness={.35} /></mesh>)}</group>

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
  const rotation = landmark.id === "workshop" ? -0.18 : landmark.id === "observatory" ? 0.18 : -0.08;
  return (
    <group scale={0.78} rotation-y={rotation}>
      {landmark.id === "observatory" ? (
        <ObservatoryExterior responseColor={responseColor} influence={influence} />
      ) : landmark.id === "memory-grove" ? (
        <GroveExterior responseColor={responseColor} influence={influence} />
      ) : (
        <WorkshopExterior responseColor={responseColor} influence={influence} />
      )}
      <EntrancePortal responseColor={responseColor} nearby={nearby} />
      <pointLight position={[0, 2.1, 3]} color={responseColor} intensity={(nearby ? 4 : 1.2) + influence.strength * 3} distance={9} decay={2} />
    </group>
  );
}

function EntrancePortal({ responseColor, nearby }: { responseColor: string; nearby: boolean }) {
  return (
    <group position={[0, 0, 2.72]}>
      <mesh position={[-1.42, 1.65, 0]}><boxGeometry args={[0.24, 3.3, 0.36]} /><meshStandardMaterial color="#869084" metalness={0.34} roughness={0.5} /></mesh>
      <mesh position={[1.42, 1.65, 0]}><boxGeometry args={[0.24, 3.3, 0.36]} /><meshStandardMaterial color="#869084" metalness={0.34} roughness={0.5} /></mesh>
      <mesh position={[0, 3.2, 0]}><boxGeometry args={[3.05, 0.25, 0.36]} /><meshStandardMaterial color="#869084" metalness={0.34} roughness={0.5} /></mesh>
      <mesh position={[0, 1.55, 0.02]}><boxGeometry args={[2.55, 3.05, 0.18]} /><meshStandardMaterial color="#101d20" emissive={responseColor} emissiveIntensity={nearby ? 0.48 : 0.12} /></mesh>
      <mesh position={[0, 1.55, 0.15]}><planeGeometry args={[1.45, 2.48]} /><meshBasicMaterial color={responseColor} transparent opacity={nearby ? 0.34 : 0.1} depthWrite={false} /></mesh>
    </group>
  );
}

function WorkshopExterior({ responseColor, influence }: { responseColor: string; influence: LandmarkInfluence }) {
  return (
    <group>
      <mesh receiveShadow position-y={0.2}><cylinderGeometry args={[4.65, 4.9, 0.4, 8]} /><meshStandardMaterial color="#45423b" roughness={0.96} /></mesh>
      <mesh castShadow receiveShadow position={[0, 2.1, -0.25]}><boxGeometry args={[7.5, 3.85, 5.5]} /><meshStandardMaterial color="#62493d" roughness={0.88} /></mesh>
      {[-2.45, 0, 2.45].map((x, index) => (
        <mesh key={x} castShadow position={[x, 4.32 + (index % 2) * 0.28, -0.2]} rotation-z={index === 1 ? -0.04 : x < 0 ? 0.27 : -0.27}>
          <boxGeometry args={[2.85, 0.32, 5.85]} />
          <meshStandardMaterial color={index === 1 ? "#45372f" : "#303b39"} metalness={0.22} roughness={0.68} />
        </mesh>
      ))}
      <group position={[-2.65, 5.05, -1.25]}>
        <mesh castShadow position-y={0.75}><cylinderGeometry args={[0.28, 0.42, 2.6, 8]} /><meshStandardMaterial color="#493c35" roughness={0.78} /></mesh>
        <mesh position-y={2.05}><cylinderGeometry args={[0.48, 0.48, 0.18, 8]} /><meshStandardMaterial color="#232a29" metalness={0.3} /></mesh>
      </group>
      <group position={[2.72, 3.15, 2.56]}>
        <WorkshopFacadeGear color={responseColor} speed={0.12 + influence.strength * 0.48} />
      </group>
      {[-2.35, 2.35].map((x) => [1.35, 2.65].map((y) => <group key={`${x}:${y}`} position={[x, y, 2.57]}><mesh><boxGeometry args={[1.25, .78, .12]} /><meshStandardMaterial color="#263c3e" emissive={responseColor} emissiveIntensity={.2 + influence.strength * .32} metalness={.22} roughness={.38} /></mesh><mesh><boxGeometry args={[.08, .88, .16]} /><meshStandardMaterial color="#a2785b" metalness={.42} /></mesh><mesh><boxGeometry args={[1.35, .08, .16]} /><meshStandardMaterial color="#a2785b" metalness={.42} /></mesh></group>))}
      {[-2.75, -1.38, 0, 1.38, 2.75].map((x) => <mesh key={x} position={[x, .8, 2.64]}><cylinderGeometry args={[.055,.055,.12,8]} /><meshStandardMaterial color="#d29a70" metalness={.72} roughness={.25} /></mesh>)}
      <group position={[-3.45, 2.4, -1.4]} rotation-z={Math.PI / 2}><mesh><cylinderGeometry args={[.27,.27,4.8,10]} /><meshStandardMaterial color="#3d4a47" metalness={.48} roughness={.42} /></mesh>{[-1.75,0,1.75].map((y)=><mesh key={y} position-y={y}><torusGeometry args={[.3,.055,6,18]} /><meshStandardMaterial color="#ad7658" metalness={.62} /></mesh>)}</group>
      {[-3.55, 3.55].map((x) => <mesh key={x} position={[x, 2.05, 0]}><boxGeometry args={[0.26, 4.1, 5.85]} /><meshStandardMaterial color="#94745e" metalness={0.28} roughness={0.56} /></mesh>)}
      <mesh position={[0, 3.65, -3.05]}><boxGeometry args={[5.8, 0.18, 0.26]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={0.24 + influence.strength * 0.7} /></mesh>
    </group>
  );
}

function WorkshopFacadeGear({ color, speed }: { color: string; speed: number }) {
  const gear = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (gear.current) gear.current.rotation.z += delta * speed; });
  return (
    <group ref={gear}>
      <mesh><torusGeometry args={[0.68, 0.13, 7, 28]} /><meshStandardMaterial color="#ad7958" emissive={color} emissiveIntensity={0.3} metalness={0.58} roughness={0.34} /></mesh>
      {Array.from({ length: 10 }, (_, index) => { const angle = index * Math.PI / 5; return <mesh key={index} position={[Math.cos(angle) * 0.84, Math.sin(angle) * 0.84, 0]} rotation-z={angle}><boxGeometry args={[0.25, 0.15, 0.18]} /><meshStandardMaterial color="#bd8661" metalness={0.5} /></mesh>; })}
    </group>
  );
}

function ObservatoryExterior({ responseColor, influence }: { responseColor: string; influence: LandmarkInfluence }) {
  return (
    <group>
      <mesh receiveShadow position-y={0.2}><cylinderGeometry args={[4.35, 4.7, 0.42, 16]} /><meshStandardMaterial color="#374a52" roughness={0.94} /></mesh>
      <mesh castShadow receiveShadow position-y={1.75}><cylinderGeometry args={[3.55, 3.8, 3.2, 16]} /><meshStandardMaterial color="#405b67" metalness={0.18} roughness={0.66} /></mesh>
      <mesh castShadow position-y={3.34}><sphereGeometry args={[3.55, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#29444f" metalness={0.38} roughness={0.45} side={THREE.DoubleSide} /></mesh>
      {[0, Math.PI / 3, Math.PI * 2 / 3].map((rotation) => <mesh key={rotation} position-y={3.34} rotation-y={rotation}><torusGeometry args={[3.56, 0.045, 5, 64, Math.PI]} /><meshStandardMaterial color="#88a2ab" metalness={0.52} /></mesh>)}
      {Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return <group key={index} position={[Math.sin(angle) * 3.72, 1.45, Math.cos(angle) * 3.72]} rotation-y={angle}><mesh rotation-x={-.14}><boxGeometry args={[.38, 3.05, .7]} /><meshStandardMaterial color="#6f8790" metalness={.34} roughness={.48} /></mesh><mesh position={[0,-1.25,.42]}><boxGeometry args={[.76,.28,1.15]} /><meshStandardMaterial color="#334b55" roughness={.75} /></mesh></group>; })}
      <mesh position={[0, 4.7, 2.85]} rotation-x={-0.12}><boxGeometry args={[0.72, 2.8, 0.16]} /><meshStandardMaterial color="#122a34" emissive={responseColor} emissiveIntensity={0.34 + influence.strength * 0.85} /></mesh>
      <ExteriorOrrery color={responseColor} strength={influence.strength} />
      <group position={[0, 5.7, .2]} rotation={[.22,0,-.28]}><mesh><cylinderGeometry args={[.28,.42,2.5,12]} /><meshStandardMaterial color="#253b45" metalness={.5} roughness={.3} /></mesh><mesh position-y={1.25}><cylinderGeometry args={[.55,.34,.3,12]} /><meshStandardMaterial color="#a1bbc2" metalness={.56} /></mesh><mesh position={[0,-1.2,0]}><sphereGeometry args={[.38,12,8]} /><meshStandardMaterial color="#657f88" metalness={.42} /></mesh></group>
      {[-2.5, 2.5].map((x) => <mesh key={x} position={[x, 1.55, 3.22]}><boxGeometry args={[0.68, 1.2, 0.14]} /><meshStandardMaterial color="#8ebbc7" emissive="#689bab" emissiveIntensity={0.45} /></mesh>)}
    </group>
  );
}

function ExteriorOrrery({ color, strength }: { color: string; strength: number }) {
  const orrery = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (orrery.current) orrery.current.rotation.y += delta * (0.07 + strength * 0.16); });
  return (
    <group ref={orrery} position={[0, 6.05, -0.3]}>
      <mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.35, 0.04, 5, 58]} /><meshBasicMaterial color={color} transparent opacity={0.68} /></mesh>
      <mesh rotation={[0.65, 0.3, 0]}><torusGeometry args={[0.92, 0.025, 5, 48]} /><meshBasicMaterial color="#d2e1e4" transparent opacity={0.55} /></mesh>
      <mesh><icosahedronGeometry args={[0.2, 1]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} /></mesh>
    </group>
  );
}

function GroveExterior({ responseColor, influence }: { responseColor: string; influence: LandmarkInfluence }) {
  return (
    <group>
      <mesh receiveShadow position-y={0.2}><cylinderGeometry args={[4.55, 4.9, 0.42, 12]} /><meshStandardMaterial color="#354b3e" roughness={1} /></mesh>
      <mesh receiveShadow position-y={0.44} rotation-x={-Math.PI / 2}><ringGeometry args={[2.1, 4.25, 18]} /><meshStandardMaterial color="#435746" roughness={0.94} /></mesh>
      <mesh position-y={0.46} rotation-x={-Math.PI / 2}><circleGeometry args={[2.05, 32]} /><meshStandardMaterial color="#213f3c" emissive={responseColor} emissiveIntensity={0.18 + influence.strength * 0.65} roughness={0.4} /></mesh>
      <mesh castShadow position={[0, 2.65, -.8]} scale={[1, .72, .78]}><sphereGeometry args={[4.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#78948a" transparent opacity={.13} metalness={.12} roughness={.22} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {[-3.15, -1.55, 1.55, 3.15].map((x, index) => (
        <group key={x} position={[x, 0, index % 2 ? -0.55 : -0.9]} rotation-z={x * -0.035}>
          <mesh castShadow position-y={2.65}><cylinderGeometry args={[0.18, 0.42, 5.3, 7]} /><meshStandardMaterial color="#594b3b" roughness={1} /></mesh>
          <mesh castShadow position={[x < 0 ? 0.25 : -0.25, 5.1, 0]} scale={[1.25, 0.86, 1.05]}><icosahedronGeometry args={[1.25, 1]} /><meshStandardMaterial color={index % 2 ? "#567258" : "#66805f"} roughness={0.96} /></mesh>
        </group>
      ))}
      {[-2.4, 0, 2.4].map((x) => <mesh key={x} position={[x, 3.35, -1.9]} rotation-z={x * -0.1}><torusGeometry args={[2.7, 0.09, 7, 42, Math.PI]} /><meshStandardMaterial color="#7d8972" metalness={0.18} roughness={0.65} /></mesh>)}
      {[-3.2,-1.6,0,1.6,3.2].map((x, index) => <group key={x} position={[x,.32,2.2]} rotation-z={x*.05}><mesh rotation-z={index%2 ? .72 : -.72}><cylinderGeometry args={[.09,.18,2.6,6]} /><meshStandardMaterial color="#68543d" roughness={1} /></mesh><mesh position={[index%2 ? .72 : -.72,.25,0]} rotation-z={index%2 ? -.5 : .5}><cylinderGeometry args={[.06,.12,1.85,6]} /><meshStandardMaterial color="#4f4335" roughness={1} /></mesh></group>)}
      {[-2.7,-.9,.9,2.7].map((x,index)=><group key={x} position={[x,3.65,2.05]}><mesh><cylinderGeometry args={[.025,.025,.7,5]} /><meshStandardMaterial color="#a8b29a" metalness={.35} /></mesh><mesh position-y={-.43}><coneGeometry args={[.16,.3,7]} /><meshStandardMaterial color={index%2 ? responseColor : "#d8c990"} emissive={responseColor} emissiveIntensity={.25 + influence.strength*.45} metalness={.25} /></mesh></group>)}
      <mesh position={[0, 2.5, -2.65]}><planeGeometry args={[5.8, 4.4]} /><meshStandardMaterial color="#52706b" transparent opacity={0.18} roughness={0.25} side={THREE.DoubleSide} /></mesh>
      <GroveEchoCrown color={responseColor} strength={influence.strength} />
    </group>
  );
}

function GroveEchoCrown({ color, strength }: { color: string; strength: number }) {
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!rings.current) return;
    rings.current.rotation.y = Math.sin(clock.elapsedTime * 0.24) * 0.28;
    rings.current.position.y = 4.65 + Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });
  return (
    <group ref={rings}>
      {[0.62, 1.05, 1.48].map((radius, index) => <mesh key={radius} rotation-x={Math.PI / 2}><torusGeometry args={[radius, 0.025, 5, 48]} /><meshBasicMaterial color={color} transparent opacity={0.25 + strength * 0.18 - index * 0.04} /></mesh>)}
      <mesh><octahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color="#e0e5c5" emissive={color} emissiveIntensity={1.3 + strength} /></mesh>
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
  return <>{Object.values(players).map((player) => <RemotePlayer key={player.id} player={player} />)}</>;
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
