"use client";

import { Html } from "@react-three/drei";
import type { ExhibitSlot } from "@/lib/exhibition";
import type { MuseumTheme } from "@/lib/museum-theme";
import { Block, SightlineCutaway } from "./MuseumArchitecture";
import { SemanticExhibitModel } from "./exhibits/ExhibitModels";

export function MuseumExhibit({ slot, theme, selected, inspecting = false }: { slot: ExhibitSlot; theme: MuseumTheme; selected: boolean; inspecting?: boolean }) {
  const garden = theme.layout === "garden", archive = theme.layout === "archive", daily = slot.kind === 'daily-signal';
  return <group name={`museum-exhibit:${slot.id}`} position={slot.position}>
    <SightlineCutaway disabled={inspecting}>
      {daily ? <group>
        <Block at={[0, .15, 0]} size={[2.1, .3, 1.4]} color={theme.dark}/>
        {[-.95, .95].map(x => <Block key={x} at={[x, 1.1, -.5]} size={[.065, 1.9, .08]} color={theme.accent} metal={.4}/>)}
        <Block at={[0, 2.03, -.5]} size={[1.96, .045, .08]} color={theme.accent}/>
        <Block at={[0, .95, -.5]} size={[1.96, .045, .08]} color={theme.accent}/>
      </group> : garden ? <mesh position-y={.12} scale={[1.45, .25, 1.05]}><icosahedronGeometry args={[1.15, 1]} /><meshStandardMaterial color={theme.wall} roughness={1} /></mesh> : <group rotation-y={archive ? slot.rotation : 0}>
        {[-.85, .85].map(x => <Block key={x} at={[x, archive ? .44 : .28, 0]} size={[.1, archive ? .88 : .56, 1.55]} color={theme.dark} metal={archive ? 0 : .3} />)}
        <Block at={[0, archive ? .94 : .62, 0]} size={[2.35, .12, 2.05]} color={theme.wall} />
        <Block at={[0, archive ? 1.01 : .69, 1]} size={[.5, .02, .025]} color={theme.accent} glow={selected} />
      </group>}
      <group position-y={garden ? .3 : archive ? 1.03 : .72} scale={garden ? .85 : .73} rotation-y={slot.rotation}>
        {slot.exhibit && <SemanticExhibitModel exhibit={slot.exhibit} kind={slot.kind} active={selected} accent={theme.accent} />}
      </group>
    </SightlineCutaway>
    {selected && !inspecting && <Html center position={[0, garden ? 2.3 : 2.8, 0]} zIndexRange={[2, 0]} className="museum-object-label"><span>{slot.exhibit?.title}</span></Html>}
  </group>;
}
