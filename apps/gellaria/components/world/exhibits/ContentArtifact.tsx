"use client";

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ArtifactDesign, ArtifactSpec } from '@/lib/artifact';
import { sculpturePoint } from '@/lib/artifact-geometry';
import { useMotionPreference } from '@/lib/use-motion-preference';
import { useInspection } from '../ExhibitInspection';

type V = [number, number, number];
function Block({ at, size, color, rotation, glass = false }: { at: V; size: V; color: string; rotation?: V; glass?: boolean }) {
  return <mesh position={at} rotation={rotation} castShadow={!glass} receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={glass ? .05 : .3} roughness={glass ? .18 : .5} transparent={glass} opacity={glass ? .38 : 1} depthWrite={!glass}/></mesh>;
}
function Rod({ from, to, radius = .035, color }: { from: V; to: V; radius?: number; color: string }) {
  const vector = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize());
  return <mesh position={new THREE.Vector3(...from).add(new THREE.Vector3(...to)).multiplyScalar(.5)} quaternion={rotation} castShadow><cylinderGeometry args={[radius, radius, vector.length(), 10]}/><meshStandardMaterial color={color} metalness={.65} roughness={.32}/></mesh>;
}
function Orb({ at, radius = .09, color }: { at: V; radius?: number; color: string }) {
  return <mesh position={at} castShadow><sphereGeometry args={[radius, 14, 10]}/><meshStandardMaterial color={color} metalness={.35} roughness={.3} emissive={color} emissiveIntensity={.18}/></mesh>;
}
function Hoop({ at, radius, color, segments, rotation = [0, 0, 0] }: { at: V; radius: number; color: string; segments: number; rotation?: V }) {
  return <mesh position={at} rotation={rotation} castShadow><torusGeometry args={[radius, .025, 8, segments]}/><meshStandardMaterial color={color} metalness={.7} roughness={.27}/></mesh>;
}
function Frame({ at, width = .55, height = .8, color, fill }: { at: V; width?: number; height?: number; color: string; fill?: string }) {
  return <group position={at}>
    {[-1, 1].map(s => <group key={s}><Block at={[s * width / 2, 0, 0]} size={[.04, height, .06]} color={color}/><Block at={[0, s * height / 2, 0]} size={[width, .04, .06]} color={color}/></group>)}
    {fill && <Block at={[0, 0, -.02]} size={[width - .03, height - .03, .025]} color={fill} glass/>}
  </group>;
}

function KineticSculpture({ design, colors, active }: { design: ArtifactDesign; colors: ArtifactSpec['colors']; active: boolean }) {
  const root = useRef<THREE.Group>(null), bead = useRef<THREE.Mesh>(null);
  const time = useRef(0), reduced = useMotionPreference();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: design.segments }, (_, i) => new THREE.Vector3(...sculpturePoint(i / design.segments, design.geometry))), true), [design]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, design.segments, .028, 8, true), [curve, design.segments]);
  useEffect(() => () => tube.dispose(), [tube]);
  useFrame((_, delta) => {
    if (reduced) return;
    time.current += Math.min(delta, .1) * (active ? 1 : .35);
    if (root.current) { root.current.rotation.y = time.current * .18; root.current.rotation.z = Math.sin(time.current * .3) * .1; }
    bead.current?.position.copy(curve.getPointAt(time.current * .07 % 1));
  });
  return <group ref={root}>
    <mesh geometry={tube} castShadow><meshStandardMaterial color={colors[0]} metalness={.75} roughness={.22}/></mesh>
    <group rotation-y={Math.PI / 2} scale={.8}><mesh geometry={tube}><meshStandardMaterial color={colors[1]} wireframe transparent opacity={.42}/></mesh></group>
    <mesh ref={bead} position={sculpturePoint(0, design.geometry)}><sphereGeometry args={[.075, 14, 10]}/><meshStandardMaterial color={colors[2]} emissive={colors[2]} emissiveIntensity={.65}/></mesh>
  </group>;
}

function Slide({ children, to = [0, 0, 0] }: { children: ReactNode; to?: V }) {
  const group = useRef<THREE.Group>(null), reduced = useMotionPreference();
  const destination = useMemo(() => new THREE.Vector3(...to), [to]);
  useFrame((_, delta) => group.current?.position.lerp(destination, reduced ? 1 : 1 - Math.exp(-delta * 6)));
  return <group ref={group}>{children}</group>;
}
function SubjectModel({ design: d, colors, step }: { design: ArtifactDesign; colors: ArtifactSpec['colors']; step: number }) {
  const [body, trim, light] = colors, n = d.segments;
  const motif = d.motif;
  return <group>
    {motif === 'workspace-orrery' && <>
      <mesh position-y={.55} castShadow><octahedronGeometry args={[.35, 0]}/><meshStandardMaterial color={body} metalness={.55} roughness={.3}/></mesh>
      <Hoop at={[0, .45, 0]} radius={.8} color={trim} segments={n} rotation={[Math.PI / 2, .18, 0]}/>
      {[0, 1, 2].map(i => <group key={i} rotation-y={i * Math.PI * 2 / 3}><Block at={[.76, .35, 0]} size={[.3, .32 + i * .12, .28]} color={trim}/><Rod from={[0, .5, 0]} to={[.76, .5, 0]} color={light}/><Frame at={[.76, .65, 0]} width={.25} height={.2} color={light}/></group>)}
    </>}
    {motif === 'citation-bench' && <>
      <Block at={[0, .15, 0]} size={[1.55, .16, .86]} color={body}/>
      <Slide to={step >= 1 ? [.18, .08, .15] : [0, 0, 0]}>{[0, 1, 2, 3].map(i => <Block key={i} at={[-.43, .29 + i * .065, 0]} size={[.55, .04, .58]} color={i % 2 ? trim : '#dedfc5'} rotation={[0, i % 2 * .1, 0]}/>)}</Slide>
      {step >= 2 && <><Orb at={[.03, .9, .12]} radius={.12} color={light}/><Rod from={[-.25, .6, .15]} to={[.03, .9, .12]} color={light}/></>}
      {[-1, 0, 1].map((s, i) => <group key={s}><Orb at={[.5, .42 + i * .23, -.22 + i * .12]} radius={.085} color={i % 2 ? body : light}/><Rod from={[.5, .42 + i * .23, -.22 + i * .12]} to={[.03, .84, .1]} color={trim}/></group>)}
      <Hoop at={[.03, .9, .12]} radius={.29} color={light} segments={n}/>
      <Rod from={[-.08, .7, .12]} to={[-.25, .3, .12]} color={trim}/>
      <Slide to={step >= 3 ? [0, .16, .3] : [0, 0, 0]}><Block at={[.3, .3, .4]} size={[.5, .025, .46]} color="#d9dac5" rotation={[-.3, 0, 0]}/>{step >= 3 && [0, 1, 2].map(i => <Block key={i} at={[.3, .35, .3 + i * .1]} size={[.32, .016, .018]} color={body}/>)}</Slide>
    </>}
    {motif === 'web-periscope' && <>
      <Rod from={[0, .12, 0]} to={[0, 1.05, 0]} radius={.13} color={body}/>
      <Rod from={[0, 1.05, 0]} to={[.32, 1.05, 0]} radius={.12} color={trim}/>
      <Hoop at={[.34, 1.05, 0]} radius={.14} color={light} segments={n} rotation={[0, Math.PI / 2, 0]}/>
      <Hoop at={[0, .28, 0]} radius={.77} color={trim} segments={n} rotation={[Math.PI / 2, 0, 0]}/>
      {[0, 1, 2].map(i => <group key={i} rotation-y={i * Math.PI * 2 / 3}><Frame at={[.64, .59, 0]} width={.38} height={.43} color={trim} fill={light}/><Block at={[.64, .7, .03]} size={[.25, .025, .02]} color={body}/><Rod from={[0, .3, 0]} to={[.64, .36, 0]} color={light}/></group>)}
    </>}
    {motif === 'offline-vault' && <>
      <Block at={[-.2, .46, 0]} size={[.92, .9, .7]} color={body}/>
      {[0, 1, 2].map(i => <Slide key={i} to={step >= 1 && i === 1 ? [0, 0, .38] : [0, 0, 0]}><Block at={[-.2, .2 + i * .25, .4 + i * .03]} size={[.78, .2, .1]} color={trim}/><Rod from={[-.36, .2 + i * .25, .47 + i * .03]} to={[-.04, .2 + i * .25, .47 + i * .03]} color={light}/></Slide>)}
      <Hoop at={[.1, .75, -.17]} radius={.65} color={step >= 2 ? light : trim} segments={n}/>
      {step >= 2 && [-1, 1].map(s => <Orb key={s} at={[.1 + s * .65, .75, -.17]} radius={.08} color={light}/>)}
      <Slide to={step >= 3 ? [.12, .22, .25] : [0, 0, 0]}>{[0, 1, 2].map(i => <Block key={i} at={[.6, .2 + i * .16, .1]} size={[.4, .03, .5]} color={i % 2 ? trim : light} rotation={[0, i * .2, 0]}/>)}</Slide>
    </>}
    {motif === 'twilight-stage' && <>
      {[0, 1, 2].map(i => <group key={i}><Block at={[0, .07 + i * .07, -.25 + i * .28]} size={[1.65 - i * .13, .1, .35]} color={i % 2 ? body : '#344052'}/><Frame at={[-.42 + i * .38, .68, -.35 + i * .22]} width={.52} height={1.05 - i * .12} color={i % 2 ? trim : body}/></group>)}
      <Orb at={[.51, .42, .45]} radius={.13} color={light}/><Hoop at={[.42, 1.03, -.4]} radius={.19} color={trim} segments={n}/>
    </>}
    {motif === 'resume-typesetter' && <>
      <Rod from={[0, .1, 0]} to={[0, 1.1, 0]} radius={.07} color={body}/>
      {[-1, 1].map(s => <group key={s}><Frame at={[s * .42, .68, 0]} width={.66} height={.86} color={trim} fill={light}/>{[0, 1, 2, 3].map(i => <Block key={i} at={[s * .42, .92 - i * .15, .03]} size={[.42 - i % 2 * .12, .024, .025]} color={body}/>)}</group>)}
      <Block at={[0, .08, .5]} size={[1.2, .08, .25]} color={body}/>
    </>}
    {motif === 'training-balance' && <>
      <Rod from={[-.8, .65, 0]} to={[.8, .65, 0]} radius={.045} color={light}/>
      {[-1, 1].map(s => <group key={s}>{[0, 1, 2].map(i => <mesh key={i} position={[s * (.47 + i * .12), .65, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[.31 - i * .035, .31 - i * .035, .07, n]}/><meshStandardMaterial color={i % 2 ? trim : body} metalness={.5} roughness={.45}/></mesh>)}<Rod from={[s * .33, .08, .07]} to={[s * .33, .6, .07]} color={trim}/></group>)}
      {[0, 1, 2, 3, 4].map(i => <Block key={i} at={[-.6 + i * .3, .1 + i * .035, .46]} size={[.16, .12 + i * .07, .09]} color={body}/>)}
    </>}
    {motif === 'tidal-planner' && <>
      {[0, 1, 2].map(i => <Hoop key={i} at={[0, .75, -i * .08]} radius={.3 + i * .18} color={i % 2 ? body : trim} segments={n}/>)}
      <Rod from={[0, .14, 0]} to={[0, 1.04, 0]} color={light}/><Rod from={[0, .75, 0]} to={[.4, .92, 0]} color={light}/>
      {[-1, 0, 1].map(i => <Block key={i} at={[i * .5, .14, .35]} size={[.32, .15, .48]} color={body} rotation={[0, i * -.18, 0]}/>)}
    </>}
    {motif === 'memory-bridge' && <>
      {[-1, 1].map(s => <group key={s}><Hoop at={[s * .6, .7, 0]} radius={.28} color={s > 0 ? body : trim} segments={n}/><Rod from={[s * .6, .05, 0]} to={[s * .6, .5, 0]} radius={.06} color={body}/>{step >= 1 && <Orb at={[s * .6, .7, 0]} radius={.14} color={light}/>}</group>)}
      {step >= 2 && <Slide to={step >= 3 ? [.6, 0, 0] : [-.6, 0, 0]}><Orb at={[0, .85, .1]} radius={.12} color={light}/></Slide>}
      {step >= 3 && [-.3, 0, .3].map(x => <Frame key={x} at={[x, .65, .17]} width={.15} height={.18} color={light} fill={trim}/>)}
      {Array.from({ length: 9 }, (_, i) => <group key={i}><Block at={[-.6 + i * .15, .27 + Math.sin(i / 8 * Math.PI) * .23, 0]} size={[.13, .04, .34]} color={trim}/><Orb at={[-.6 + i * .15, .52 + Math.sin(i / 8 * Math.PI) * .23, 0]} radius={.045} color={light}/></group>)}
    </>}
    {(motif === 'portfolio-frames' || motif === 'glass-palimsest' || motif === 'image-aperture') && <>
      {[0, 1, 2].map(i => <Frame key={i} at={[-.35 + i * .32, .54 + i * .13, -.26 + i * .26]} width={.72} height={.88} color={i % 2 ? body : trim} fill={motif === 'glass-palimsest' ? light : undefined}/>)}
      {motif === 'image-aperture' && <><Hoop at={[.1, .69, .49]} radius={.28} color={light} segments={n}/>{Array.from({ length: 6 }, (_, i) => <group key={i} position={[.1, .69, .48]} rotation-z={i * Math.PI / 3}><Block at={[.14, .07, 0]} size={[.22, .12, .02]} color={body} rotation={[0, 0, .6]}/></group>)}</>}
    </>}
    {motif === 'simulation-reel' && <>
      <Frame at={[0, .66, 0]} width={.54} height={.96} color={body} fill={light}/>
      {[-1, 1].map(s => <Hoop key={s} at={[s * .62, .72, 0]} radius={.24} color={trim} segments={n}/>)}
      <Rod from={[-.8, .23, .3]} to={[.8, .23, .3]} color={body}/><Orb at={[-.55, .32, .3]} color={light}/><Orb at={[.4, .32, .3]} color={trim}/>
    </>}
    {motif === 'civilization-strata' && <>
      {Array.from({ length: 4 + Math.min(d.level, 6) }, (_, i) => <Block key={i} at={[(i % 3 - 1) * .09, .12 + i * .095, 0]} size={[1.35 - i * .06, .065, .75 - i * .028]} color={i % 2 ? body : trim} rotation={[0, i * .065, 0]}/>)}
      <Rod from={[-.62, .2, .4]} to={[.48, 1.1, .3]} color={light}/><Orb at={[.48, 1.1, .3]} color={light}/>
    </>}
    {motif === 'composition-tree' && <>
      <Rod from={[0, .02, 0]} to={[0, 1.2, 0]} radius={.065} color={body}/>
      {[0, 1, 2, 3, 4].map(i => { const s = i % 2 ? 1 : -1, y = .3 + i * .17; return <group key={i}><Rod from={[0, y, 0]} to={[s * .55, y + .1, (i % 3 - 1) * .16]} color={trim}/><Block at={[s * .55, y + .1, (i % 3 - 1) * .16]} size={[.23, .18, .22]} color={light}/></group>; })}
    </>}
    {motif === 'frontend-horizon' && <>
      {[-1, 0, 1].map((s, i) => <group key={s}><Block at={[s * .55, .3 + i * .12, 0]} size={[.37, .55 + i * .24, .42]} color={i % 2 ? trim : body}/><Hoop at={[s * .55, .6 + i * .24, 0]} radius={.22} color={light} segments={n} rotation={[Math.PI / 2, 0, 0]}/></group>)}
      <Rod from={[-.7, .18, .33]} to={[.7, .18, .33]} color={light}/>
    </>}
    {motif === 'data-weave' && <group rotation-x={-.25}>
      {Array.from({ length: 5 }, (_, i) => <group key={i}><Rod from={[-.65 + i * .325, .13, 0]} to={[-.65 + i * .325, 1.17, 0]} color={body}/><Rod from={[-.7, .15 + i * .24, .03]} to={[.7, .15 + i * .24, .03]} color={trim}/></group>)}
      {Array.from({ length: 12 }, (_, i) => <Orb key={i} at={[-.49 + i % 4 * .325, .28 + Math.floor(i / 4) * .24, .07]} radius={.055} color={i % 3 ? light : body}/>)}
    </group>}
    {motif === 'code-prism' && <>
      <mesh position={[0, .62, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[.38, .38, .62, 3]}/><meshStandardMaterial color={body} metalness={.6} roughness={.3}/></mesh>
      <Rod from={[-.85, .62, 0]} to={[.8, .62, 0]} color={trim}/>
      {[0, 1, 2].map(i => <Orb key={i} at={[.5 + i * .16, .62 + i * .12, 0]} radius={.06} color={light}/>)}
    </>}
    {motif === 'story-mobile' && <>
      <Rod from={[0, .08, 0]} to={[0, 1.2, 0]} color={body}/>
      {Array.from({ length: Math.min(6, Math.max(3, d.structure.paragraphs)) }, (_, i) => <group key={i} rotation-y={i * 2.4}><Rod from={[0, .95, 0]} to={[.6, .95, 0]} color={trim}/><Rod from={[.6, .95, 0]} to={[.6, .48 + i % 3 * .1, 0]} radius={.012} color={trim}/><Block at={[.6, .4 + i % 3 * .1, 0]} size={[.26, .32, .02]} color={light}/></group>)}
    </>}
    {/* A reading milestone adds actual geometry: engraving studs, then filigree. */}
    {Array.from({ length: d.ornaments }, (_, i) => { const a = i / d.ornaments * Math.PI * 2; return <Orb key={i} at={[Math.cos(a) * .83, .045, Math.sin(a) * .58]} radius={.018 + (i % 3) * .004} color={i % 2 ? trim : light}/>; })}
    {d.level >= 3 && Array.from({ length: Math.min(8, d.level - 2) }, (_, i) => <Hoop key={i} at={[0, .04 + i * .017, 0]} radius={.86 + i * .005} color={trim} segments={n} rotation={[Math.PI / 2, 0, 0]}/>)}
  </group>;
}

function ReadingStructure({ design, colors }: { design: ArtifactDesign; colors: ArtifactSpec['colors'] }) {
  const chapters = design.narrative?.chapters || [];
  if (design.level < 2 || !chapters.length) return null;
  const points = chapters.map((_, i): V => { const angle = i / chapters.length * Math.PI * 2 + .3; return [Math.cos(angle) * .75, 1.05 + (i % 2) * .1, Math.sin(angle) * .55]; });
  return <group name="article-chapter-structure">
    {chapters.map((chapter, i) => <group key={i}>
      <Rod from={[0, .15, 0]} to={points[i]} radius={.013} color={colors[1]}/>
      <Block at={points[i]} size={[.24, .035, .18]} color={colors[2]} rotation={[0, i * .5, 0]}/>
      {design.level >= 3 && chapter.excerpt && <><Orb at={[points[i][0], points[i][1] + .15, points[i][2]]} radius={.055} color={colors[0]}/><Rod from={points[i]} to={[points[i][0], points[i][1] + .15, points[i][2]]} radius={.014} color={colors[2]}/></>}
      {design.level >= 4 && i > 0 && <Rod from={points[i - 1]} to={points[i]} radius={.017} color={colors[2]}/>}
    </group>)}
  </group>;
}

export function ContentArtifact({ spec, active, artifactId = '' }: { spec: ArtifactSpec & { design: ArtifactDesign }; active: boolean; artifactId?: string }) {
  const { design, colors } = spec;
  const inspection = useInspection();
  const step = inspection.artifactId === artifactId ? inspection.step : 0;
  return <group rotation-y={(spec.seed % 11 - 5) * .025}>
    <mesh position-y={.015} receiveShadow><cylinderGeometry args={[.96, 1, .06, 48]}/><meshStandardMaterial color={colors[1]} metalness={.55} roughness={.35}/></mesh>
    {design.tier === 'reading' && design.level === 0 ? <><Block at={[0, .14, 0]} size={[.85, .17, .61]} color={colors[0]}/><Block at={[0, .23, 0]} size={[.88, .025, .64]} color={colors[1]}/></> : design.tier === 'kinetic' ? <KineticSculpture design={design} colors={colors} active={active}/> : <SubjectModel design={design} colors={colors} step={step}/>}
    {design.tier === 'reading' && <ReadingStructure design={design} colors={colors}/>}
  </group>;
}
