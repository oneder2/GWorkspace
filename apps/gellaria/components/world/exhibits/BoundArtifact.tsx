"use client";

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import * as THREE from "three";
import type { ArtifactSpec } from "@/lib/artifact";
import { ContentArtifact } from './ContentArtifact';

type V = [number, number, number];
type PieceProps = { at?: V; size?: V; rotate?: V; color: string; metal?: boolean; glow?: boolean };
function Piece({ at, size = [1, 1, 1], rotate, color, metal = false, glow = false }: PieceProps) {
  return <mesh position={at} rotation={rotate} castShadow receiveShadow>
    <boxGeometry args={size} /><meshStandardMaterial color={color} metalness={metal ? .65 : .12} roughness={metal ? .35 : .7} emissive={color} emissiveIntensity={glow ? .65 : 0} />
  </mesh>;
}
function Ring({ at, radius, color, rotate = [0, 0, 0] }: { at: V; radius: number; color: string; rotate?: V }) {
  return <mesh position={at} rotation={rotate} castShadow><torusGeometry args={[radius, .035, 8, 40]} /><meshStandardMaterial color={color} metalness={.7} roughness={.3} /></mesh>;
}
function Book({ color, open = false }: { color: string; open?: boolean }) {
  return <group>
    <Piece at={[0, .08, 0]} size={[1.6, .12, 1.04]} color={color} />
    {[-1, 1].map(side => <group key={side} position={[side * .4, .15, 0]} rotation-z={open ? -side * .15 : 0}>
      <Piece size={[.72, .1, .94]} color="#e2d6b7" />
      {[0, 1, 2, 3].map(i => <Piece key={i} at={[0, .059, -.27 + i * .17]} size={[.47, .01, .014]} color="#928773" />)}
    </group>)}
  </group>;
}

// A constrained recipe persisted by GWorkspace, not geometry inferred on reload.
// Each silhouette describes a subject: evidence, networks, publishing, places...
export function BoundArtifact({ spec, active, writing, artifactId = '' }: { spec: ArtifactSpec; active: boolean; writing: boolean; artifactId?: string }) {
  const root = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const [body, trim, light] = spec.colors;
  const count = spec.detail.count;
  useFrame((_, delta) => {
    if (root.current && active && !reduced) root.current.rotation.y += Math.min(delta, .1) * .18;
  });
  if (spec.design && spec.design.tier !== 'support') return <ContentArtifact artifactId={artifactId} spec={{ ...spec, design: spec.design }} active={active}/>;
  return <group scale={[spec.proportions.width, spec.proportions.height, spec.proportions.depth]}>
    {writing ? <Book color={trim} open /> : <Piece at={[0, .02, 0]} size={[1.9, .08, 1.45]} color={trim} metal />}
    <group ref={root} position-y={writing ? .28 : .09} rotation-y={(spec.seed % 9 - 4) * .045}>
      {spec.form === "world-diorama" && <group>
        <mesh position-y={.15} scale={[1, .23, .85]} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={body} roughness={.9} /></mesh>
        {Array.from({ length: count }, (_, i) => {
          const a = i * Math.PI * 2 / count;
          return <group key={i} position={[Math.cos(a) * .6, .27, Math.sin(a) * .47]}>
            <Piece at={[0, .18, 0]} size={[.24, .36 + (i % 2) * .2, .28]} color={trim} />
            <Piece at={[0, .42 + (i % 2) * .14, 0]} size={[.32, .08, .35]} color={light} metal />
          </group>;
        })}
        <Ring at={[0, .45, 0]} radius={.9} color={trim} rotate={[Math.PI / 2, 0, .12]} />
        <Piece at={[0, .53, 0]} size={[.26, .6, .26]} color={light} glow />
      </group>}
      {spec.form === "research-desk" && <group>
        {Array.from({ length: count }, (_, i) => <Piece key={i} at={[-.45, .06 + i * .075, 0]} size={[.65, .045, .9]} rotate={[0, (i % 2 ? 1 : -1) * .12, 0]} color={i % 2 ? body : "#dcd8ca"} />)}
        <Piece at={[.53, .4, .1]} size={[.065, .8, .07]} color={trim} metal />
        <Ring at={[.36, .96, 0]} radius={.36} color={trim} rotate={[-.25, -.3, 0]} />
        <mesh position={[.36, .96, 0]} rotation={[-.25, -.3, 0]}><circleGeometry args={[.31, 32]} /><meshStandardMaterial color={light} transparent opacity={.26} side={THREE.DoubleSide} /></mesh>
        {[-.6, -.3, 0].map((x, i) => <Piece key={x} at={[x, .65 + i * .12, -.4]} size={[.14, .14, .14]} color={light} glow />)}
      </group>}
      {spec.form === "network-switch" && <group>
        <Piece at={[0, .32, 0]} size={[.55, .64, .55]} color={body} metal />
        {Array.from({ length: count }, (_, i) => { const a = i / count * Math.PI * 2; return <group key={i} rotation-y={a}>
          <Piece at={[.48, .16 + (i % 2) * .17, 0]} size={[.85, .045, .07]} color={trim} metal />
          <Piece at={[.86, .28, 0]} size={[.23, .45, .3]} color={body} metal />
          <Piece at={[.86, .53, 0]} size={[.15, .025, .18]} color={light} glow />
        </group>; })}
        {[.18, .34, .5].map(y => <Piece key={y} at={[0, y, .29]} size={[.36, .025, .02]} color={light} glow />)}
      </group>}
      {spec.form === "publishing-press" && <group>
        {[-.64, .64].map(x => <Piece key={x} at={[x, .48, 0]} size={[.13, .96, .48]} color={body} metal />)}
        {[.33, .8].map(y => <mesh key={y} position={[0, y, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[.19, .19, 1.4, 24]} /><meshStandardMaterial color={trim} metalness={.5} roughness={.4} /></mesh>)}
        <Piece at={[0, .32, .46]} size={[.95, .045, .9]} rotate={[-.2, 0, 0]} color="#e5dcc6" />
        {Array.from({ length: count }, (_, i) => <Piece key={i} at={[-.31 + (i % 3) * .3, .39, .4 + Math.floor(i / 3) * .2]} size={[.18, .018, .05]} color={body} />)}
        <Ring at={[.84, .62, 0]} radius={.27} color={light} rotate={[0, Math.PI / 2, 0]} />
      </group>}
      {spec.form === "mobile-companion" && <group rotation-x={-.15}>
        <Piece at={[0, .65, 0]} size={[.66, 1.26, .17]} color={body} metal />
        <Piece at={[0, .69, .095]} size={[.54, .99, .025]} color="#20383c" />
        {[0, 1, 2].map(i => <Piece key={i} at={[-.17 + i * .17, .5, .115]} size={[.08, .2 + (i % 2) * .28, .025]} color={light} glow />)}
        <Ring at={[0, .61, 0]} radius={.82} color={trim} rotate={[.65, 0, .3]} />
      </group>}
      {spec.form === "planning-clock" && <group>
        <Ring at={[0, .76, 0]} radius={.65} color={trim} />
        <Piece at={[0, .29, 0]} size={[.1, .58, .12]} color={body} metal />
        <Piece at={[0, .9, .02]} size={[.035, .4, .04]} color={light} />
        <Piece at={[.16, .76, .02]} size={[.36, .035, .04]} color={light} />
        {Array.from({ length: 12 }, (_, i) => <group key={i} position={[0, .76, 0]} rotation-z={i * Math.PI / 6}><Piece at={[0, .56, 0]} size={[.03, .09, .04]} color={body} /></group>)}
        {Array.from({ length: count }, (_, i) => <Piece key={i} at={[-.65 + i * .23, .09, .45]} size={[.18, .025, .27]} color={i % 2 ? light : body} />)}
      </group>}
      {spec.form === "growth-garden" && <group>
        {Array.from({ length: count }, (_, i) => { const x = -.65 + (i % 3) * .62, z = -.36 + Math.floor(i / 3) * .66, h = .45 + (i % 3) * .2; return <group key={i} position={[x, 0, z]}>
          <Piece at={[0, .07, 0]} size={[.5, .14, .5]} color={trim} />
          <Piece at={[0, h / 2, 0]} size={[.04, h, .04]} color={body} />
          {[-1, 1].map(side => <mesh key={side} position={[side * .1, h * .75, 0]} rotation-z={side * -.6} scale={[.14, .28, .06]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={side > 0 ? light : body} roughness={.8} /></mesh>)}
        </group>; })}
      </group>}
      {spec.form === "travel-lantern" && <group>
        <Book color={body} open />
        <Piece at={[.3, .64, 0]} size={[.035, 1.2, .035]} color={trim} metal />
        <Piece at={[.04, 1.18, 0]} size={[.57, .045, .06]} color={trim} metal />
        <mesh position={[-.2, .89, 0]} castShadow><cylinderGeometry args={[.18, .24, .4, 8]} /><meshStandardMaterial color={light} emissive={light} emissiveIntensity={.4} /></mesh>
        <Ring at={[-.2, 1.15, 0]} radius={.11} color={trim} />
      </group>}
      {spec.form === "logic-engine" && <group>
        {Array.from({ length: spec.detail.rings + 1 }, (_, i) => <group key={i} position={[(i % 2 ? 1 : -1) * .24, .28 + i * .25, 0]} rotation-y={i * .6}>
          <Ring at={[0, 0, 0]} radius={.42} color={i % 2 ? body : trim} rotate={[Math.PI / 2, 0, 0]} />
          {Array.from({ length: count }, (_, j) => <group key={j} rotation-y={j * Math.PI * 2 / count}><Piece at={[.37, 0, 0]} size={[.24, .12, .12]} color={trim} metal /></group>)}
        </group>)}
        <Piece at={[0, .55, 0]} size={[.08, 1.1, .08]} color={light} metal />
      </group>}
      {(spec.form === "folio" || spec.form === "daily-leaf") && <group rotation-x={-.12}>
        {Array.from({ length: spec.form === "daily-leaf" ? 1 : count }, (_, i) => <group key={i} position={[i * .06, .65 + i * .035, -i * .065]} rotation-y={i * -.07}>
          <Piece size={[.88, 1.15, .025]} color={i === 0 ? "#eee2c7" : body} />
          {[0, 1, 2, 3].map(j => <Piece key={j} at={[-.05, .32 - j * .2, .021]} size={[.57 - (j % 2) * .1, .015, .012]} color={trim} />)}
        </group>)}
        <Ring at={[0, .8, -.28]} radius={.82} color={light} />
      </group>}
    </group>
  </group>;
}
