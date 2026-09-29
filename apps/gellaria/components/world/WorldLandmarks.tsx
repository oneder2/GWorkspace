"use client";

import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

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
