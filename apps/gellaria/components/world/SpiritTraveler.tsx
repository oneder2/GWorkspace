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
  const wisps = useRef<THREE.Group>(null);
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
    if (wisps.current) {
      wisps.current.rotation.y = Math.sin(time * 1.1 + phase) * 0.18;
      wisps.current.rotation.z = Math.sin(time * 1.65 + phase) * 0.045;
    }
  });

  const transparency = remote ? opacity * 0.82 : opacity * 0.94;
  return (
    <group ref={spirit} scale={remote ? 0.84 : 0.92}>
      <group ref={tail}>
        <mesh position-y={0.57} scale={[1, 1.12, 0.82]}>
          <coneGeometry args={[0.48, 1.22, 12]} />
          <meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={0.5} transparent opacity={transparency * 0.66} roughness={0.48} depthWrite={false} />
        </mesh>
        <group ref={wisps}>
          {[-0.27, 0, 0.27].map((x, index) => (
            <group key={x} position={[x, 0.12 - Math.abs(index - 1) * 0.08, -0.03]} rotation-z={(index - 1) * -0.18}>
              <mesh position-y={-0.24} scale={[0.42, 1, 0.42]}>
                <coneGeometry args={[0.2, 0.72 + (index === 1 ? 0.18 : 0), 7]} />
                <meshBasicMaterial color={index === 1 ? palette.body : palette.glow} transparent opacity={transparency * (index === 1 ? 0.5 : 0.28)} depthWrite={false} />
              </mesh>
              <mesh position={[0, -0.7 - index * 0.025, 0]} scale={[0.72, 1.15, 0.72]}>
                <octahedronGeometry args={[0.11, 0]} />
                <meshBasicMaterial color={palette.glow} transparent opacity={transparency * (0.32 - index * 0.035)} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      <mesh castShadow position-y={1.05} scale={[0.92, 1.08, 0.78]}>
        <sphereGeometry args={[0.48, 24, 16]} />
        <meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={0.38} transparent opacity={transparency} roughness={0.58} />
      </mesh>
      <mesh position-y={1.05} scale={[1.03, 1.18, .88]}>
        <sphereGeometry args={[.49,18,12]} />
        <meshBasicMaterial color={palette.glow} transparent opacity={transparency*.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.08, 0.41]} scale={[0.78, 0.62, 0.2]}>
        <sphereGeometry args={[0.4, 20, 13]} />
        <meshStandardMaterial color="#f3f0df" emissive={palette.glow} emissiveIntensity={0.12} transparent opacity={transparency * 0.96} roughness={0.72} />
      </mesh>
      <mesh position={[0,1.08,.456]} scale={[.82,.66,.2]}><torusGeometry args={[.345,.018,6,32]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={1.1} transparent opacity={transparency*.48} /></mesh>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 1.12, 0.485]}>
          <mesh scale={[1, 1.45, 0.55]}><sphereGeometry args={[0.043, 8, 6]} /><meshBasicMaterial color={palette.face} transparent opacity={opacity} /></mesh>
          <mesh position={[0.012, 0.015, 0.025]}><sphereGeometry args={[0.012, 6, 4]} /><meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.82} /></mesh>
        </group>
      ))}
      {[-.13,.13].map((x)=><mesh key={`brow-${x}`} position={[x,1.235,.491]} rotation-z={x < 0 ? -.16 : .16}><boxGeometry args={[.105,.014,.012]} /><meshBasicMaterial color={palette.face} transparent opacity={opacity*.62} /></mesh>)}
      {[-.25,.25].map((x)=><mesh key={`cheek-${x}`} position={[x,.995,.492]} scale={[1.35,.62,.5]}><sphereGeometry args={[.035,8,5]} /><meshBasicMaterial color="#e9a6a0" transparent opacity={opacity*.38} depthWrite={false} /></mesh>)}
      <mesh position={[0, 0.99, 0.49]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.012, 5, 14, Math.PI]} />
        <meshBasicMaterial color={palette.face} transparent opacity={opacity * 0.72} />
      </mesh>

      <group ref={halo} position-y={1.58}>
        {form === "halo" && <><mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.34, 0.027, 7, 36]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={1.7} transparent opacity={opacity * 0.78} /></mesh><mesh rotation={[Math.PI/2,.2,.45]}><torusGeometry args={[.23,.012,5,28]} /><meshBasicMaterial color="#fff1bd" transparent opacity={opacity*.62} /></mesh></>}
        {form === "comet" && <><mesh rotation-z={Math.PI / 4}><octahedronGeometry args={[0.15, 1]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={2.1} /></mesh>{[-.25,-.38].map((x,index)=><mesh key={x} position={[x,.09-index*.1,-.04]} rotation-z={-.7}><coneGeometry args={[.04-index*.008,.42-index*.08,6]} /><meshBasicMaterial color={palette.glow} transparent opacity={opacity*(.46-index*.1)} /></mesh>)}</>}
        {form === "sprout" && <>{[-0.11, 0.11].map((x) => <mesh key={x} position={[x, 0.02, 0]} rotation-z={x < 0 ? 0.62 : -0.62} scale={[0.72, 1.25, 0.45]}><sphereGeometry args={[0.13, 12, 8]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.7} /></mesh>)}<mesh position-y={-.02}><cylinderGeometry args={[.025,.035,.28,7]} /><meshStandardMaterial color={palette.face} roughness={.72} /></mesh></>}
      </group>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * .45,.97,-.03]} rotation-z={side*-.46}>
          <mesh scale={[.62,1.12,.52]}><sphereGeometry args={[.145,12,8]} /><meshStandardMaterial color={palette.body} emissive={palette.glow} emissiveIntensity={.32} transparent opacity={transparency*.78} /></mesh>
          <mesh position={[side*.015,.16,0]} rotation-z={side*.2} scale={[.42,.82,.4]}><coneGeometry args={[.13,.32,7]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={.72} transparent opacity={transparency*.55} /></mesh>
        </group>
      ))}
      <mesh position={[0,.7,.31]} rotation-x={Math.PI/2}><torusGeometry args={[.34,.028,7,32,Math.PI]} /><meshStandardMaterial color={palette.face} emissive={palette.glow} emissiveIntensity={.32} transparent opacity={transparency*.52} /></mesh>
      <pointLight position={[0, 1.05, 0.12]} color={palette.glow} intensity={remote ? 0.85 : 1.35} distance={4.2} decay={2} />
    </group>
  );
}
