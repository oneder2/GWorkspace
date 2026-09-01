"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { spiritForms, spiritPalette, type SpiritAppearance } from "@/lib/spirit-identity";

export type SpiritMotion = { speed: number; stride: number };

type SpiritTravelerProps = {
  appearance: SpiritAppearance;
  motion: RefObject<SpiritMotion>;
  opacity?: number;
  remote?: boolean;
};

export function SpiritTraveler({ appearance, motion, opacity = 1, remote = false }: SpiritTravelerProps) {
  const spirit = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Group>(null);
  const palette = spiritPalette(appearance);
  const form = spiritForms[appearance.form] ?? spiritForms[0];
  const phase = appearance.palette * 0.73 + appearance.form * 1.17;

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const speed = motion.current.speed;
    if (spirit.current) {
      spirit.current.position.y = 0.22 + Math.sin(time * 1.85 + phase) * 0.11 + speed * 0.035;
      spirit.current.rotation.z = THREE.MathUtils.lerp(spirit.current.rotation.z, Math.sin(time * 2.4 + phase) * 0.025, Math.min(1, delta * 5));
    }
    if (tail.current) {
      tail.current.rotation.y = Math.sin(time * 1.3 + phase) * 0.14;
      tail.current.scale.y = 1 + Math.sin(time * 2.1 + phase) * 0.07 + speed * 0.08;
    }
    if (halo.current) halo.current.rotation.y += delta * (0.28 + speed * 0.36);
  });

  const transparency = remote ? opacity * 0.82 : opacity * 0.94;
  return (
    <group ref={spirit} scale={remote ? 0.84 : 0.92}>
      <group ref={tail}>
        <mesh position-y={0.55} scale={[1, 1.12, 0.82]}>
          <coneGeometry args={[0.46, 1.18, 9]} />
          <meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={0.5} transparent opacity={transparency * 0.66} roughness={0.48} depthWrite={false} />
        </mesh>
        {[-0.23, 0, 0.23].map((x, index) => (
          <mesh key={x} position={[x, 0.02 - index * 0.05, -0.02]} scale={[0.52, 1, 0.52]}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshBasicMaterial color={palette.glow} transparent opacity={transparency * (0.34 - index * 0.05)} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <mesh castShadow position-y={1.05} scale={[0.92, 1.08, 0.78]}>
        <sphereGeometry args={[0.48, 16, 11]} />
        <meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={0.38} transparent opacity={transparency} roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.08, 0.41]} scale={[0.78, 0.62, 0.2]}>
        <sphereGeometry args={[0.4, 14, 9]} />
        <meshStandardMaterial color="#f3f0df" emissive={palette.glow} emissiveIntensity={0.12} transparent opacity={transparency * 0.96} roughness={0.72} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 1.12, 0.485]}>
          <mesh scale={[1, 1.45, 0.55]}><sphereGeometry args={[0.043, 8, 6]} /><meshBasicMaterial color={palette.face} transparent opacity={opacity} /></mesh>
          <mesh position={[0.012, 0.015, 0.025]}><sphereGeometry args={[0.012, 6, 4]} /><meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.82} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.99, 0.49]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.012, 5, 14, Math.PI]} />
        <meshBasicMaterial color={palette.face} transparent opacity={opacity * 0.72} />
      </mesh>

      <group ref={halo} position-y={1.58}>
        {form === "halo" && <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.32, 0.025, 6, 28]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={1.7} transparent opacity={opacity * 0.78} /></mesh>}
        {form === "comet" && <><mesh rotation-z={Math.PI / 4}><octahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={2.1} /></mesh><mesh position={[-0.24, 0.08, -0.04]} rotation-z={-0.7}><coneGeometry args={[0.045, 0.42, 6]} /><meshBasicMaterial color={palette.glow} transparent opacity={opacity * 0.45} /></mesh></>}
        {form === "sprout" && <>{[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.02, 0]} rotation-z={x < 0 ? 0.55 : -0.55} scale={[0.7, 1.2, 0.45]}><sphereGeometry args={[0.13, 8, 6]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.7} /></mesh>)}</>}
      </group>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.47, 0.88, -0.02]} rotation-z={side * -0.42} scale={[0.62, 1.15, 0.55]}>
          <sphereGeometry args={[0.14, 9, 6]} />
          <meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={0.32} transparent opacity={transparency * 0.78} />
        </mesh>
      ))}
      <pointLight position={[0, 1.05, 0.12]} color={palette.glow} intensity={remote ? 0.85 : 1.35} distance={4.2} decay={2} />
    </group>
  );
}
