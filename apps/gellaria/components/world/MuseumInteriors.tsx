"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { MuseumPlan, MuseumRoom } from "@/lib/exhibition";
import { museumTheme, type MuseumTheme } from "@/lib/museum-theme";
import { Block, SightlineCutaway } from "./MuseumArchitecture";

function Disc({ at, radius, color, scale = [1, 1, 1] }: { at: [number, number, number]; radius: number; color: string; scale?: [number, number, number] }) {
  return <mesh position={at} scale={scale} receiveShadow><cylinderGeometry args={[radius, radius, .07, 48]} /><meshStandardMaterial color={color} roughness={.9} /></mesh>;
}

function Laboratory({ room, palette }: { room: MuseumRoom; palette: MuseumTheme }) {
  const { width: w, depth: d } = room;
  return <group>
    <Block at={[0, -.18, 0]} size={[w, .3, d]} color={palette.floor} />
    {[-2.18, 2.18].map((x) => <Block key={x} at={[x, .015, 0]} size={[.025, .015, d]} color={palette.dark} />)}
    {[-1, 1].map((side) => <group key={side}>
      <SightlineCutaway>
        <Block at={[side * (w / 2 - .15), .65, 0]} size={[.22, 1.3, d]} color={palette.wall} />
        <Block at={[side * (w / 2 - .15), 1.32, 0]} size={[.24, .045, d]} color={palette.dark} metal={.3} />
      </SightlineCutaway>
    </group>)}
  </group>;
}

function Shelf({ z, side, palette, width }: { z: number; side: number; palette: MuseumTheme; width: number }) {
  return <SightlineCutaway><group position={[side * (width / 2 - .8), 0, z]} rotation-y={side > 0 ? -Math.PI / 2 : Math.PI / 2}>
    <Block at={[0, .75, -.25]} size={[3.9, 1.5, .36]} color={palette.floor} />
    {[-1.9, 1.9].map((x) => <Block key={x} at={[x, .75, .06]} size={[.1, 1.5, .65]} color={palette.wall} />)}
    {[.2, .95].map((y, row) => <group key={y}>
      <Block at={[0, y, .08]} size={[3.9, .12, .72]} color={palette.wall} />
      {Array.from({ length: 4 }, (_, i) => <Block key={i} at={[-1.3 + i * .7, y + .26, .14]} size={[.24, .42, .4]} color={i % 2 ? palette.paper : palette.dark} rotation={[0, 0, row ? .05 : 0]} />)}
    </group>)}
  </group></SightlineCutaway>;
}

function Archive({ room, palette }: { room: MuseumRoom; palette: MuseumTheme }) {
  const { width: w, depth: d } = room;
  return <group>
    <Block at={[0, -.18, 0]} size={[w, .3, d]} color={palette.floor} />
    {[-1.8, 1.8].map((x) => <Block key={x} at={[x, .015, 0]} size={[.025, .015, d]} color={palette.dark} />)}
    {[-1, 1].map((side) => <group key={side}>
      <SightlineCutaway>
        <Block at={[side * (w / 2 - .15), .65, 0]} size={[.22, 1.3, d]} color={palette.wall} />
      </SightlineCutaway>
      <Shelf z={-d * .3} side={side} width={w} palette={palette} />
    </group>)}
  </group>;
}

function Garden({ room, palette }: { room: MuseumRoom; palette: MuseumTheme }) {
  const { width: w, depth: d } = room;
  const outline = useMemo(() => {
    const shape = new THREE.Shape();
    const x = w / 2, z = d / 2, r = 1.8;
    shape.moveTo(-x + r, -z); shape.lineTo(x - r, -z); shape.quadraticCurveTo(x, -z, x, -z + r);
    shape.lineTo(x, z - r); shape.quadraticCurveTo(x, z, x - r, z); shape.lineTo(-x + r, z);
    shape.quadraticCurveTo(-x, z, -x, z - r); shape.lineTo(-x, -z + r); shape.quadraticCurveTo(-x, -z, -x + r, -z);
    return shape;
  }, [w, d]);
  return <group>
    <mesh rotation-x={-Math.PI / 2} position-y={-.26} receiveShadow><extrudeGeometry args={[outline, { depth: .22, bevelEnabled: false, curveSegments: 12 }]} /><meshStandardMaterial color={palette.floor} roughness={1} /></mesh>
    {Array.from({ length: Math.ceil(d / 1.6) }, (_, i) => <Disc key={i} at={[Math.sin(i * 1.2) * .4, .015, d / 2 - .7 - i * 1.6]} radius={1.45} color={i % 3 ? "#789a84" : "#8fa69b"} scale={[1.15, 1, .65]} />)}
    {[-1, 1].map((side) => <group key={side}>
      {Array.from({ length: Math.ceil(d / 2.5) }, (_, i) => <group key={i} position={[side * (w / 2 - 1), 0, d / 2 - 1.4 - i * 2.5]}>
        <Disc at={[0, .12, 0]} radius={1} color={palette.wall} scale={[.85, 3, 1.45]} />
        <SightlineCutaway>
          <Block at={[.15, 1.25, 0]} size={[.13, 2.5, .15]} color={palette.dark} rotation={[0, 0, side * .13]} />
          {[0, 1, 2].map((leaf) => <mesh key={leaf} position={[Math.sin(leaf * 2) * .45, 1.15 + leaf * .36, Math.cos(leaf * 2) * .25]} rotation-z={side * .7 + leaf} scale={[.22, .7, .15]}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={leaf % 2 ? "#769d87" : palette.wall} roughness={1} /></mesh>)}
        </SightlineCutaway>
        <mesh position={[-side * .7, .38, .2]}><sphereGeometry args={[.12, 10, 8]} /><meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={1.5} /></mesh>
      </group>)}
      {[-.35, .35].map((fraction) => <SightlineCutaway key={fraction}>
        <group position={[side * (w / 2 - .2), 0, d * fraction]}>
          <Block at={[0, 1.8, 0]} size={[.22, 3.6, .25]} color={palette.dark} rotation={[0, 0, side * .07]} />
          <Block at={[-side * .55, 3.5, 0]} size={[1.6, .18, .26]} color={palette.dark} rotation={[0, 0, side * .2]} />
          <mesh position={[-side * 1.05, 3.1, 0]}><octahedronGeometry args={[.22]} /><meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={.6} /></mesh>
        </group>
      </SightlineCutaway>)}
    </group>)}
  </group>;
}

export function MuseumInterior({ plan, kind }: { plan: MuseumPlan; kind: string }) {
  const palette = museumTheme(kind);
  return <group>
    {plan.rooms.map((room, i) => <group key={room.id} position-z={room.centerZ}>
      {room.layout === "fabrication" ? <Laboratory room={room} palette={palette} /> : room.layout === "archive" ? <Archive room={room} palette={palette} /> : <Garden room={room} palette={palette} />}
      {[-1, 1].map((side) => <SightlineCutaway key={side}>
        <Block at={[side * (room.width / 4 + 1.35), .25, -room.depth / 2 + .18]} size={[room.width / 2 - 2.7, .5, .22]} color={palette.wall} />
      </SightlineCutaway>)}
      {i < plan.rooms.length - 1 && <group position-z={-room.depth / 2 - 1.8}>
        <Block at={[0, -.12, 0]} size={[5.4, .24, 3.6]} color={palette.floor} />
        {[-2.1, 2.1].map((x) => <Block key={x} at={[x, .035, 0]} size={[.065, .04, 3.6]} color={palette.accent} />)}
        {room.layout === "garden" && [0, 1, 2, 3, 4].map((j) => <Block key={j} at={[0, .025, -1.4 + j * .7]} size={[4.4, .1, .5]} color="#789a84" />)}
      </group>}
    </group>)}
  </group>;
}
