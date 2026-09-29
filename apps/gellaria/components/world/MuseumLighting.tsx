"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ExhibitSlot, MuseumPlan, MuseumRoom } from "@/lib/exhibition";
import type { MuseumTheme } from "@/lib/museum-theme";

const lightProfiles = {
  fabrication: { key: "#b5d7ee", focus: "#e4f5ed", ambient: .28, sky: .42, strength: 1.8, spot: 105, height: 5.6, angle: .46 },
  archive: { key: "#a8badf", focus: "#ffdc9d", ambient: .32, sky: .38, strength: 1.5, spot: 78, height: 4.8, angle: .56 },
  garden: { key: "#b2d8ee", focus: "#b9e9da", ambient: .25, sky: .4, strength: 2.1, spot: 62, height: 4.6, angle: .59 },
};

// A small procedural spill avoids a bloom pass while keeping low guide lamps
// legible on mobile. Real lights illuminate surfaces; this is their soft halo.
function LightPool({ position, color, radius, opacity = .14, stretch = 1 }: { position: [number, number, number]; color: string; radius: number; opacity?: number; stretch?: number }) {
  const uniforms = useMemo(() => ({ tint: { value: new THREE.Color(color) }, alpha: { value: opacity } }), [color, opacity]);
  return <mesh position={position} rotation-x={-Math.PI / 2} scale={[radius, radius * stretch, 1]} renderOrder={2}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} uniforms={uniforms}
      vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
      fragmentShader="varying vec2 vUv; uniform vec3 tint; uniform float alpha; void main(){float r=length(vUv*2.0-1.0);float falloff=1.0-smoothstep(0.0,1.0,r);gl_FragColor=vec4(tint,alpha*falloff*falloff);}" />
  </mesh>;
}

function ExhibitLight({ slot, theme, selected }: { slot: ExhibitSlot; theme: MuseumTheme; selected: boolean }) {
  const profile = lightProfiles[theme.layout];
  const lamp = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const side = Math.sign(slot.position[0]);
  useFrame((_, delta) => {
    if (lamp.current) lamp.current.intensity = THREE.MathUtils.damp(lamp.current.intensity, profile.spot * (selected ? 1.35 : 1), 5, delta);
  });
  return <group position={slot.position}>
    <primitive object={target} position={[0, .3, 0]} />
    <spotLight ref={lamp} target={target} position={[-side * .65, profile.height, 1.25]} color={profile.focus} intensity={profile.spot}
      angle={profile.angle} penumbra={.8} decay={2} distance={12} />
    {/* Fixtures are outside the walking footprint and do not cross the view. */}
    <mesh position={[-side * .65, profile.height, 1.25]} rotation-x={.2}>
      <cylinderGeometry args={[.14, .24, .18, 16]} />
      <meshStandardMaterial color={theme.dark} metalness={.55} roughness={.4} />
    </mesh>
    <mesh position={[-side * .65, profile.height - .105, 1.25]} rotation-x={Math.PI / 2}>
      <circleGeometry args={[.19, 20]} /><meshBasicMaterial color={profile.focus} toneMapped={false} />
    </mesh>
    <LightPool position={[0, .09, 0]} color={profile.focus} radius={2.6} opacity={selected ? .2 : .11} stretch={1.05} />
  </group>;
}

export function MuseumLighting({ room, plan, slots, theme, selectedId }: { room: MuseumRoom; plan: MuseumPlan; slots: ExhibitSlot[]; theme: MuseumTheme; selectedId?: string }) {
  const { size } = useThree();
  const profile = lightProfiles[theme.layout];
  const key = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const initialized = useRef(false);
  useFrame((_, delta) => {
    if (!key.current) return;
    const blend = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    key.current.position.lerp(goal.set(-7, 11, room.centerZ + 7), blend);
    target.position.lerp(goal.set(0, 0, room.centerZ), blend);
    target.updateMatrixWorld();
    initialized.current = true;
  });
  return <group>
    <ambientLight color={theme.light} intensity={profile.ambient} />
    <hemisphereLight args={[profile.key, theme.floor, profile.sky]} />
    <primitive object={target} />
    <directionalLight ref={key} target={target} color={profile.key} intensity={profile.strength} castShadow
      shadow-mapSize={size.width < 640 ? [1024, 1024] : [2048, 2048]} shadow-bias={-.00015} shadow-normalBias={.045}
      shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-near={1} shadow-camera-far={45} />
    {slots.map((slot) => <ExhibitLight key={slot.id} slot={slot} theme={theme} selected={selectedId === slot.id} />)}
    {[-1, 1].map((side) => <pointLight key={side} position={[side * 7.5, 2.8, room.centerZ - 1]} color={theme.accent} intensity={theme.layout === "archive" ? 13 : 8} distance={8} decay={2} />)}
    {plan.rooms.map((item) => <group key={item.id}>
      {Array.from({ length: Math.ceil(item.depth / 3) }, (_, i) => {
        const z = item.centerZ + item.depth / 2 - 1.4 - i * 3;
        return <group key={i}>
          <LightPool position={[0, .1, z]} radius={2.25} stretch={.7} color={theme.light} opacity={.16} />
          {[-1, 1].map((side) => <mesh key={side} position={[side * 1.65, .14, z]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[.07, .48]} /><meshBasicMaterial color={theme.accent} toneMapped={false} />
          </mesh>)}
        </group>;
      })}
      <LightPool position={[0, .11, item.centerZ + item.depth / 2 - .5]} radius={2.45} color={theme.accent} opacity={.25} />
    </group>)}
  </group>;
}
