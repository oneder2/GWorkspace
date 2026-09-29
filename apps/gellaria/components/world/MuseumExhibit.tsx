"use client";

import { Html } from "@react-three/drei";
import type { ExhibitSlot } from "@/lib/exhibition";
import type { MuseumTheme } from "@/lib/museum-theme";
import { Block, SightlineCutaway } from "./MuseumArchitecture";
import { SemanticExhibitModel } from "./exhibits/ExhibitModels";

export function MuseumExhibit({ slot, theme, selected, inspecting = false }: { slot: ExhibitSlot; theme: MuseumTheme; selected: boolean; inspecting?: boolean }) {
  const garden = theme.layout === "garden";
  const archive = theme.layout === "archive";
  return <group position={slot.position}>
    <SightlineCutaway disabled={inspecting}>
      {garden ? <group>
        <mesh position-y={.12} scale={[1.45, .25, 1.05]}><icosahedronGeometry args={[1.15, 1]} /><meshStandardMaterial color={theme.wall} roughness={1} /></mesh>
        <mesh position={[.25, .28, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.08, 1.13, 48]} /><meshStandardMaterial color={theme.accent} transparent opacity={selected ? .85 : .28} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 1.25, .08, -.5]} scale={[.5, .3, .7]}><dodecahedronGeometry args={[.6, 0]} /><meshStandardMaterial color="#8fa69b" roughness={1} /></mesh>)}
      </group> : archive ? <group rotation-y={slot.rotation}>
        <mesh position-y={.03}><cylinderGeometry args={[1.65, 1.65, .04, 48]} /><meshStandardMaterial color={theme.dark} /></mesh>
        {[-.85, .85].map((x) => <Block key={x} at={[x, .45, 0]} size={[.17, .9, 1.55]} color={theme.floor} />)}
        <Block at={[0, .92, 0]} size={[2.25, .16, 1.8]} color={theme.wall} />
        <Block at={[0, 1.01, .78]} size={[1.6, .03, .045]} color={theme.accent} />
        <Block at={[-.9, 1.3, -.5]} size={[.05, .65, .05]} color={theme.accent} metal={.5} />
        <mesh position={[-.9, 1.65, -.5]}><sphereGeometry args={[.18, 12, 8]} /><meshStandardMaterial color={theme.light} emissive={theme.light} emissiveIntensity={.8} /></mesh>
      </group> : <group>
        {[-.92, .92].flatMap((x) => [-.85, .85].map((z) => <Block key={`${x}:${z}`} at={[x, .3, z]} size={[.13, .6, .13]} color={theme.wall} metal={.7} />))}
        <Block at={[0, .53, 0]} size={[2.35, .16, 2.05]} color={theme.dark} metal={.6} />
        <Block at={[0, .64, 0]} size={[2.4, .06, 2.15]} color={theme.wall} metal={.45} />
        {[-1.1, 1.1].map((x) => <Block key={x} at={[x, .68, 0]} size={[.05, .035, 2]} color={theme.accent} glow={selected} />)}
      </group>}
      <group position-y={garden ? .3 : archive ? 1.03 : .72} scale={garden ? .85 : .73} rotation-y={slot.rotation}>
        {slot.exhibit && <SemanticExhibitModel exhibit={slot.exhibit} kind={slot.kind} active={selected} accent={theme.accent} />}
      </group>
    </SightlineCutaway>
    <SightlineCutaway>
      <group position={[slot.position[0] < 0 ? -1.9 : 1.9, 0, -.3]} rotation-y={slot.rotation}>
        {garden ? <group>
          {[-.45, 0, .45].map((x, i) => <group key={x}>
            <Block at={[x, .65 + i * .15, 0]} size={[.045, 1.3 + i * .3, .06]} color={theme.dark} rotation={[0, 0, x * .4]} />
            <mesh position={[x, 1.35 + i * .3, 0]} scale={[.14, .35, .1]}><octahedronGeometry args={[1]} /><meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={.2} /></mesh>
          </group>)}
        </group> : archive ? <group>
          <Block at={[0, .45, -.2]} size={[2.4, .9, .45]} color={theme.floor} />
          <mesh position={[0, 1.9, -.2]}><torusGeometry args={[1.2, .07, 8, 40, Math.PI]} /><meshStandardMaterial color={theme.accent} metalness={.4} /></mesh>
          {[-1.2, 1.2].map((x) => <Block key={x} at={[x, 1.1, -.2]} size={[.1, 1.6, .12]} color={theme.accent} />)}
        </group> : <group>
          <Block at={[0, 1.55, -.2]} size={[2.65, 3.1, .16]} color={theme.dark} metal={.4} />
          {[-1.26, 1.26].map((x) => <Block key={x} at={[x, 1.6, -.05]} size={[.08, 3.2, .1]} color={theme.accent} metal={.6} />)}
          {[0, 1, 2, 3, 4].map((row) => <Block key={row} at={[0, .6 + row * .48, -.09]} size={[2.35, .025, .04]} color={theme.wall} />)}
          <Block at={[0, 3.17, .05]} size={[2.8, .09, .5]} color={theme.light} glow />
        </group>}
      </group>
    </SightlineCutaway>
    {selected && !inspecting && <Html center position={[0, garden ? 2.3 : 2.8, 0]} zIndexRange={[2, 0]} className="museum-object-label"><span>{slot.exhibit?.title}</span></Html>}
  </group>;
}
