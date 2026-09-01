"use client";

import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { LandmarkInfluence } from "@/lib/influence";

type InfluencedLandmarkProps = {
  influence: LandmarkInfluence;
  responseColor: string;
};

const surveyDirections = [
  { angle: 1.39, color: "#ef8d63" },
  { angle: -2.91, color: "#9ec5e8" },
  { angle: -1.41, color: "#9fbd73" },
];

export function CentralCamp({ journeyComplete }: { journeyComplete: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  const compass = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (light.current) light.current.intensity = 7 + Math.sin(clock.elapsedTime * 5) * 1.2;
    if (compass.current) {
      compass.current.rotation.y += delta * 0.18;
      compass.current.position.y = 2.35 + Math.sin(clock.elapsedTime * 0.9) * 0.05;
    }
  });

  return (
    <group position={[0, 0.15, 1]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.85, 3.25, 0.42, 10]} />
        <meshStandardMaterial color="#505b4e" roughness={1} />
      </mesh>
      <mesh receiveShadow position-y={0.24}>
        <cylinderGeometry args={[2.45, 2.62, 0.12, 10]} />
        <meshStandardMaterial color="#6a6858" roughness={0.92} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * Math.PI / 4;
        return (
          <mesh key={index} castShadow position={[Math.sin(angle) * 1.72, 0.38, Math.cos(angle) * 1.72]} rotation-y={angle}>
            <boxGeometry args={[0.08, 0.08, 1.15]} />
            <meshStandardMaterial color="#9b7654" metalness={0.22} roughness={0.65} />
          </mesh>
        );
      })}
      {Array.from({ length: 7 }, (_, index) => {
        const angle = index * Math.PI * 2 / 7;
        return (
          <mesh key={index} castShadow position={[Math.sin(angle) * 0.82, 0.42, Math.cos(angle) * 0.82]} rotation-y={angle}>
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color={index % 2 ? "#5c5549" : "#6a6252"} roughness={1} />
          </mesh>
        );
      })}
      {Array.from({ length: 5 }, (_, index) => {
        const angle = index * Math.PI * 2 / 5;
        return (
          <mesh key={index} castShadow position={[Math.sin(angle) * 0.52, 0.63, Math.cos(angle) * 0.52]} rotation-y={angle + 0.42}>
            <boxGeometry args={[0.82, 0.18, 0.24]} />
            <meshStandardMaterial color="#694735" roughness={0.95} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.88, 0]} scale={[0.72, 1.25, 0.72]}>
        <octahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color="#f3aa68" emissive="#e56f48" emissiveIntensity={2.8} transparent opacity={0.92} />
      </mesh>
      <mesh position={[-0.16, 1.22, 0.08]} scale={0.48}>
        <octahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial color="#f4d095" emissive="#f0a168" emissiveIntensity={2.4} />
      </mesh>
      <pointLight ref={light} position={[0, 2.1, 0]} color="#ff9864" distance={13} decay={2} castShadow />

      {surveyDirections.map(({ angle, color }) => (
        <group key={color} position={[Math.sin(angle) * 2.35, 0.48, Math.cos(angle) * 2.35]} rotation-y={angle}>
          <mesh castShadow position-y={0.48}>
            <cylinderGeometry args={[0.12, 0.22, 0.95, 5]} />
            <meshStandardMaterial color="#3c4640" roughness={0.9} />
          </mesh>
          <mesh position-y={1.02} rotation-z={Math.PI / 4}>
            <boxGeometry args={[0.25, 0.25, 0.08]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.15} />
          </mesh>
        </group>
      ))}

      <group ref={compass} position-y={2.35}>
        <mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.18, 0.028, 5, 64]} /><meshBasicMaterial color="#d7b581" transparent opacity={0.62} /></mesh>
        <mesh rotation-x={Math.PI / 2} rotation-y={0.62}><torusGeometry args={[0.82, 0.018, 4, 48]} /><meshBasicMaterial color="#9fc0bd" transparent opacity={0.42} /></mesh>
        <mesh rotation-z={Math.PI / 4}><boxGeometry args={[1.55, 0.035, 0.06]} /><meshBasicMaterial color="#e1c08d" /></mesh>
        <mesh rotation-z={-Math.PI / 4}><boxGeometry args={[1.55, 0.035, 0.06]} /><meshBasicMaterial color="#e1c08d" /></mesh>
      </group>

      {journeyComplete && <CampConstellation />}
      <Html position={[0, journeyComplete ? 4.55 : 3.45, 0]} center distanceFactor={14} zIndexRange={[4, 0]} className="world-label">
        <span>{journeyComplete ? "星图已闭合" : "抵达营地"}<small>{journeyComplete ? "三件遗物彼此定位" : "沿发光小径探索"}</small></span>
      </Html>
    </group>
  );
}

function CampConstellation() {
  const constellation = useRef<THREE.Group>(null);
  const linePositions = useMemo(() => new Float32Array([
    -1.5, 0, 0.45, 0.15, 1.05, -0.35,
    0.15, 1.05, -0.35, 1.45, -0.05, 0.35,
    1.45, -0.05, 0.35, -1.5, 0, 0.45,
  ]), []);
  useFrame(({ clock }, delta) => {
    if (!constellation.current) return;
    constellation.current.rotation.y += delta * 0.13;
    constellation.current.position.y = 3.1 + Math.sin(clock.elapsedTime * 0.7) * 0.08;
  });
  return (
    <group ref={constellation} position-y={3.1}>
      <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[linePositions, 3]} /></bufferGeometry><lineBasicMaterial color="#f3d39a" transparent opacity={0.72} /></lineSegments>
      {[
        [-1.5, 0, 0.45, "#ef8d63"],
        [0.15, 1.05, -0.35, "#9ec5e8"],
        [1.45, -0.05, 0.35, "#9fbd73"],
      ].map(([x, y, z, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]}><octahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={2.8} /></mesh>
      ))}
    </group>
  );
}

export function Workshop({ influence, responseColor }: InfluencedLandmarkProps) {
  return (
    <group rotation-y={-0.22}>
      <mesh castShadow receiveShadow position-y={0.22}><cylinderGeometry args={[3.3, 3.65, 0.45, 10]} /><meshStandardMaterial color="#56544b" roughness={1} /></mesh>
      <mesh castShadow receiveShadow position={[-0.82, 1.42, -0.1]}><boxGeometry args={[3.45, 2.55, 2.8]} /><meshStandardMaterial color="#745a48" roughness={0.9} /></mesh>
      <mesh castShadow position={[-0.82, 2.78, -0.08]} rotation-z={-0.13}><boxGeometry args={[3.9, 0.24, 3.25]} /><meshStandardMaterial color="#332f2d" metalness={0.12} roughness={0.78} /></mesh>

      <group position={[-1.05, 1.05, 1.33]}>
        <mesh><planeGeometry args={[1.45, 1.35]} /><meshStandardMaterial color="#241e1c" /></mesh>
        <mesh position-z={0.05} scale={[0.72, 0.46, 1]}><octahedronGeometry args={[0.62, 0]} /><meshStandardMaterial color="#ef8d63" emissive={responseColor} emissiveIntensity={2.2 + influence.strength * 3.2} /></mesh>
        <mesh position-y={0.78}><boxGeometry args={[1.7, 0.16, 0.16]} /><meshStandardMaterial color="#493832" /></mesh>
      </group>

      <group position={[-1.4, 3.55, -0.5]}>
        <mesh castShadow position-y={0.4}><cylinderGeometry args={[0.34, 0.46, 2.15, 8]} /><meshStandardMaterial color="#403733" roughness={0.84} /></mesh>
        <mesh castShadow position-y={1.52}><cylinderGeometry args={[0.48, 0.48, 0.18, 8]} /><meshStandardMaterial color="#292a29" /></mesh>
      </group>

      <group position={[1.45, 0, 0]}>
        {[-1.28, 1.28].map((z) => <mesh key={z} castShadow position={[0.82, 1.28, z]}><boxGeometry args={[0.16, 2.5, 0.16]} /><meshStandardMaterial color="#3a302b" /></mesh>)}
        <mesh castShadow position={[0.82, 2.55, 0]} rotation-z={0.04}><boxGeometry args={[2.2, 0.2, 3.05]} /><meshStandardMaterial color="#403936" roughness={0.82} /></mesh>
        <mesh castShadow position={[0.45, 0.93, 0]}><boxGeometry args={[2.35, 0.28, 1.05]} /><meshStandardMaterial color="#765842" roughness={0.82} /></mesh>
        {[-0.35, 1.2].map((x) => <mesh key={x} castShadow position={[x, 0.42, 0]}><boxGeometry args={[0.2, 0.92, 0.82]} /><meshStandardMaterial color="#493832" /></mesh>)}
        <mesh castShadow position={[0.1, 1.3, 0]}><boxGeometry args={[0.9, 0.18, 0.45]} /><meshStandardMaterial color="#343b3a" metalness={0.35} /></mesh>
        <mesh castShadow position={[0.1, 1.48, 0]}><cylinderGeometry args={[0.18, 0.34, 0.32, 6]} /><meshStandardMaterial color="#59605c" metalness={0.32} /></mesh>
      </group>

      <WorkshopGear speed={0.18 + influence.strength * 0.92} responseColor={responseColor} strength={influence.strength} />
      <ForgeSparks influence={influence} responseColor={responseColor} />
      <group position={[2.25, 2.9, -1.05]}>
        <mesh castShadow position-y={-0.9}><cylinderGeometry args={[0.12, 0.16, 2.25, 7]} /><meshStandardMaterial color="#4a3b32" /></mesh>
        <mesh castShadow position={[-0.75, 0.2, 0]} rotation-z={Math.PI / 2}><boxGeometry args={[1.7, 0.16, 0.2]} /><meshStandardMaterial color="#72513c" /></mesh>
        <mesh position={[-1.55, -0.25, 0]}><torusGeometry args={[0.16, 0.035, 6, 18, Math.PI * 1.5]} /><meshStandardMaterial color="#ad7b52" metalness={0.52} /></mesh>
      </group>
      <pointLight position={[-0.9, 2.8, 1.5]} color={responseColor} intensity={4.8 + influence.strength * 6.2} distance={11} />
    </group>
  );
}

function WorkshopGear({ speed, responseColor, strength }: { speed: number; responseColor: string; strength: number }) {
  const gear = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (gear.current) gear.current.rotation.z += delta * speed; });
  return (
    <group ref={gear} position={[1.85, 1.35, 1.56]}>
      <mesh><torusGeometry args={[0.78, 0.16, 8, 32]} /><meshStandardMaterial color="#a86b46" emissive={responseColor} emissiveIntensity={strength * 0.55} metalness={0.48} roughness={0.48} /></mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = index * Math.PI / 5;
        return <mesh key={index} position={[Math.cos(angle) * 0.93, Math.sin(angle) * 0.93, 0]} rotation-z={angle}><boxGeometry args={[0.3, 0.18, 0.24]} /><meshStandardMaterial color="#bc744d" metalness={0.42} roughness={0.48} /></mesh>;
      })}
      {Array.from({ length: 4 }, (_, index) => <mesh key={index} rotation-z={index * Math.PI / 2}><boxGeometry args={[1.35, 0.1, 0.18]} /><meshStandardMaterial color="#79523c" metalness={0.28} /></mesh>)}
      <mesh><cylinderGeometry args={[0.22, 0.22, 0.34, 10]} /><meshStandardMaterial color="#d2925d" metalness={0.55} /></mesh>
    </group>
  );
}

function ForgeSparks({ influence, responseColor }: InfluencedLandmarkProps) {
  const sparks = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!sparks.current) return;
    sparks.current.rotation.y += delta * (0.2 + influence.strength * 0.45);
    sparks.current.position.y = Math.sin(clock.elapsedTime * 1.4) * 0.08;
  });
  return (
    <group ref={sparks} position={[-1.05, 2.05, 1.48]}>
      {Array.from({ length: influence.tier * 2 }, (_, index) => {
        const angle = index * Math.PI * 0.83;
        const radius = 0.34 + index * 0.08;
        return <mesh key={index} position={[Math.cos(angle) * radius, 0.18 + (index % 3) * 0.3, Math.sin(angle) * radius]}><octahedronGeometry args={[0.055 + index * 0.005, 0]} /><meshBasicMaterial color={responseColor} /></mesh>;
      })}
    </group>
  );
}

export function Observatory({ influence, responseColor }: InfluencedLandmarkProps) {
  return (
    <group rotation-y={0.2}>
      <mesh castShadow receiveShadow position-y={0.24}><cylinderGeometry args={[3.25, 3.62, 0.48, 14]} /><meshStandardMaterial color="#45545c" roughness={0.95} /></mesh>
      <mesh castShadow receiveShadow position-y={1.35}><cylinderGeometry args={[2.48, 2.65, 2.3, 14]} /><meshStandardMaterial color="#667984" roughness={0.76} /></mesh>
      <mesh castShadow receiveShadow position={[0, 2.45, 0]}><sphereGeometry args={[2.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#81949d" metalness={0.24} roughness={0.5} /></mesh>
      <mesh position-y={2.46} rotation-x={Math.PI / 2}><torusGeometry args={[2.44, 0.08, 6, 64]} /><meshStandardMaterial color="#344b57" metalness={0.42} /></mesh>
      {[0, Math.PI / 3, Math.PI * 2 / 3].map((rotation) => (
        <mesh key={rotation} position-y={2.45} rotation-y={rotation}><torusGeometry args={[2.43, 0.035, 4, 52, Math.PI]} /><meshStandardMaterial color="#b1c1c5" metalness={0.5} roughness={0.38} /></mesh>
      ))}
      <group position={[0, 3.28, 2.05]}>
        <mesh><boxGeometry args={[0.58, 1.95, 0.14]} /><meshStandardMaterial color="#1c3038" /></mesh>
        {[-0.38, 0.38].map((x) => <mesh key={x} position-x={x}><boxGeometry args={[0.08, 1.95, 0.18]} /><meshStandardMaterial color="#a6bbc0" metalness={0.38} /></mesh>)}
      </group>
      {[-0.92, 0.92].map((x) => (
        <group key={x} position={[x, 1.25, 2.52]}>
          <mesh><planeGeometry args={[0.62, 0.85]} /><meshStandardMaterial color="#9ec5e8" emissive="#72a7bb" emissiveIntensity={0.95} /></mesh>
          <mesh><boxGeometry args={[0.06, 0.78, 0.08]} /><meshStandardMaterial color="#2d444e" /></mesh>
        </group>
      ))}
      <mesh castShadow receiveShadow position={[0, 0.18, 3]}><boxGeometry args={[1.8, 0.25, 0.85]} /><meshStandardMaterial color="#5a6870" roughness={0.9} /></mesh>
      <mesh castShadow receiveShadow position={[0, 0.06, 3.55]}><boxGeometry args={[2.2, 0.16, 0.62]} /><meshStandardMaterial color="#44535a" roughness={0.95} /></mesh>
      <ObservatoryTelescope influence={influence} responseColor={responseColor} />
      <ObservationSignals influence={influence} responseColor={responseColor} />
      <pointLight position={[0, 4.6, 1.8]} color={responseColor} intensity={3.8 + influence.strength * 5.2} distance={12} />
    </group>
  );
}

function ObservatoryTelescope({ influence, responseColor }: InfluencedLandmarkProps) {
  const mount = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (mount.current) {
      const sweepSpeed = 0.12 + influence.strength * 0.32;
      const sweepRange = 0.08 + influence.strength * 0.24;
      mount.current.rotation.y = Math.sin(clock.elapsedTime * sweepSpeed) * sweepRange;
    }
  });
  return (
    <group ref={mount} position={[0, 3.55, 0]}>
      <mesh castShadow position-y={-0.62}><cylinderGeometry args={[0.28, 0.46, 1.55, 10]} /><meshStandardMaterial color="#344b57" metalness={0.38} /></mesh>
      <group rotation-z={-0.76} position={[0, 0.45, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.38, 0.48, 3.5, 12]} /><meshStandardMaterial color="#405d69" metalness={0.42} roughness={0.45} /></mesh>
        <mesh position-y={1.82}><cylinderGeometry args={[0.58, 0.58, 0.28, 14]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={1.1 + influence.strength * 2.2} metalness={0.22} /></mesh>
        <mesh position-y={-1.62}><cylinderGeometry args={[0.28, 0.34, 0.45, 10]} /><meshStandardMaterial color="#2b424c" metalness={0.38} /></mesh>
      </group>
      <mesh position={[1.05, -0.25, 0]}><sphereGeometry args={[0.32, 12, 8]} /><meshStandardMaterial color="#53646c" metalness={0.35} /></mesh>
      <mesh rotation-z={Math.PI / 2} position={[0.5, -0.25, 0]}><cylinderGeometry args={[0.08, 0.08, 1.1, 8]} /><meshStandardMaterial color="#8ba1a8" metalness={0.48} /></mesh>
    </group>
  );
}

function ObservationSignals({ influence, responseColor }: InfluencedLandmarkProps) {
  const signals = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (signals.current) signals.current.rotation.y += delta * (0.06 + influence.strength * 0.16);
  });
  return (
    <group ref={signals} position-y={3.25}>
      {Array.from({ length: 2 + influence.tier * 2 }, (_, index) => {
        const angle = index * Math.PI * 0.72;
        const radius = 2.8 + (index % 2) * 0.35;
        return <mesh key={index} position={[Math.cos(angle) * radius, 0.55 + (index % 3) * 0.38, Math.sin(angle) * radius]} rotation-z={Math.PI / 4}><boxGeometry args={[0.11, 0.11, 0.06]} /><meshStandardMaterial color={responseColor} emissive={responseColor} emissiveIntensity={1.2 + influence.strength} /></mesh>;
      })}
    </group>
  );
}

const groveTrees = [
  { position: [-1.7, 0.35, -0.75] as [number, number, number], height: 3.9, scale: 1.0, color: "#617d57" },
  { position: [0.25, 0.35, -0.9] as [number, number, number], height: 5.1, scale: 1.18, color: "#728d62" },
  { position: [1.75, 0.35, -1.15] as [number, number, number], height: 3.55, scale: 0.92, color: "#5f7856" },
  { position: [-0.7, 0.35, 1.35] as [number, number, number], height: 3.25, scale: 0.84, color: "#789068" },
];

export function Grove({ influence, responseColor }: InfluencedLandmarkProps) {
  return (
    <group>
      <mesh receiveShadow position-y={0.2}><cylinderGeometry args={[3.55, 3.88, 0.42, 12]} /><meshStandardMaterial color="#465b43" roughness={1} /></mesh>
      <mesh receiveShadow position-y={0.43}><cylinderGeometry args={[1.24, 1.42, 0.13, 12]} /><meshStandardMaterial color="#3b5149" roughness={0.82} /></mesh>
      <mesh position-y={0.51} rotation-x={-Math.PI / 2}><circleGeometry args={[1.1, 24]} /><meshStandardMaterial color="#2b4a49" emissive={responseColor} emissiveIntensity={0.25 + influence.strength * 1.35} metalness={0.18} roughness={0.32} /></mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = index * Math.PI * 2 / 7;
        return (
          <group key={index} position={[Math.sin(angle) * 2.75, 0.47, Math.cos(angle) * 2.75]} rotation-y={angle}>
            <mesh castShadow position-y={0.36}><boxGeometry args={[0.32, 0.72, 0.22]} /><meshStandardMaterial color="#596258" roughness={0.95} /></mesh>
            <mesh position={[0, 0.38, 0.12]} rotation-z={Math.PI / 4}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#9fbd73" emissive="#789b61" emissiveIntensity={0.72} /></mesh>
          </group>
        );
      })}
      {groveTrees.map((tree, index) => <MemoryTree key={index} {...tree} />)}
      <MemoryLanterns influence={influence} responseColor={responseColor} />
      <pointLight position={[0, 4.1, 0]} color={responseColor} intensity={3.2 + influence.strength * 4.8} distance={11} />
    </group>
  );
}

function MemoryTree({ position, height, scale, color }: { position: [number, number, number]; height: number; scale: number; color: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position-y={height / 2}><cylinderGeometry args={[0.24, 0.42, height, 8]} /><meshStandardMaterial color="#57483c" roughness={1} /></mesh>
      <group position={[0, height * 0.62, 0]} rotation-z={0.78}>
        <mesh castShadow position-y={height * 0.22}><cylinderGeometry args={[0.1, 0.2, height * 0.48, 7]} /><meshStandardMaterial color="#5e4c3e" roughness={1} /></mesh>
      </group>
      <group position={[0, height * 0.7, 0]} rotation-z={-0.88} rotation-y={0.7}>
        <mesh castShadow position-y={height * 0.18}><cylinderGeometry args={[0.09, 0.18, height * 0.4, 7]} /><meshStandardMaterial color="#5e4c3e" roughness={1} /></mesh>
      </group>
      <mesh castShadow position={[0, height, 0]} scale={[1.05, 0.82, 0.98]}><icosahedronGeometry args={[1.08, 1]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
      <mesh castShadow position={[0.82, height * 0.88, 0.14]} scale={[0.72, 0.62, 0.68]}><icosahedronGeometry args={[0.94, 1]} /><meshStandardMaterial color="#6b865f" roughness={1} /></mesh>
      <mesh castShadow position={[-0.7, height * 0.84, -0.22]} scale={[0.68, 0.6, 0.72]}><icosahedronGeometry args={[0.9, 1]} /><meshStandardMaterial color="#789068" roughness={1} /></mesh>
    </group>
  );
}

function MemoryLanterns({ influence, responseColor }: InfluencedLandmarkProps) {
  const lanterns = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!lanterns.current) return;
    lanterns.current.rotation.y += delta * (0.05 + influence.strength * 0.16);
    lanterns.current.position.y = Math.sin(clock.elapsedTime * 0.75) * 0.09;
  });
  return (
    <group ref={lanterns}>
      {[
        [-1.3, 3.2, 0.8], [0.85, 4.35, 0.45], [1.55, 2.7, -0.15], [-0.15, 2.4, 1.6],
        [-1.85, 2.55, -0.4], [1.1, 3.55, -1.4], [0.2, 5.1, -0.65], [-0.9, 4.55, 1.15],
        [1.85, 3.9, 0.85], [-1.45, 3.7, -1.15],
      ].slice(0, 4 + influence.tier * 2).map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh><octahedronGeometry args={[0.18 + index * 0.008, 0]} /><meshStandardMaterial color="#d7dfc0" emissive={responseColor} emissiveIntensity={1.5 + influence.strength * 1.8} transparent opacity={0.9} /></mesh>
          <mesh position-y={0.34}><cylinderGeometry args={[0.015, 0.015, 0.5, 5]} /><meshBasicMaterial color="#a8b993" transparent opacity={0.52} /></mesh>
        </group>
      ))}
    </group>
  );
}
