"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ArrowLeft, BookOpen, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { Landmark } from "@/lib/content";
import type { Exhibit } from "@/lib/exhibition";
import { constrainLoopForest, nearestForestEcho, advanceEchoTime, echoVisualScale, echoGraphemes, echoPhase, echoPlacement, echoText, forestColors as colors, forestPlan } from "@/lib/echo-forest";
import { workspaceUrl } from "@/lib/workspace-url";
import { useMotionPreference } from "@/lib/use-motion-preference";
import { MuseumTraveler } from "./ExhibitionHall";
import { ForestEnvironment } from './ForestEnvironment';
import type { MoveIntent } from "./WorldExperience";

const noop = () => {};
type ForestProps = { landmark: Landmark; moveIntent: MoveIntent; paused: boolean; onExit: () => void };

export function EchoForest({ landmark, moveIntent, paused, onExit }: ForestProps) {
  const reduced = useMotionPreference();
  const [still, setStill] = useState(false);
  const [reading, setReading] = useState(false);
  const [exitNearby, setExitNearby] = useState(true);
  const [lap, setLap] = useState(0);
  const constrain = useCallback((x: number, z: number): [number, number] => {
    const next = constrainLoopForest(x, z, lap);
    if (next[1] - z > 20) setLap(value => value + 1);
    else if (next[1] - z < -20) setLap(value => value - 1);
    return next;
  }, [lap]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (paused || reading || (event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)))) return;
      if (event.code === "Escape" || (event.code === "KeyE" && exitNearby && !event.repeat)) { event.preventDefault(); onExit(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [exitNearby, onExit, paused, reading]);
  return <section className="exhibition-hall echo-forest" aria-label="回声林地">
    <Canvas className="hall-canvas" shadows="percentage" dpr={[1, 1.4]} camera={{ position: [0, 5, 15], fov: 57, near: .1, far: 100 }}>
      <color attach="background" args={[colors.night]} /><fog attach="fog" args={[colors.night, 16, 53]} />
      <ambientLight intensity={.45} color={colors.echo} /><hemisphereLight args={["#a1d9db", colors.moss, .9]} />
      <directionalLight position={[-8, 14, 5]} color="#b7ddf4" intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-camera-far={85} shadow-normalBias={.07} />
      <ForestEnvironment lap={lap}/>
      <EchoField exhibits={landmark.exhibits} paused={paused || still || reading} reduced={Boolean(reduced)} />
      <MuseumTraveler plan={forestPlan} forest constrain={constrain} paused={paused || reading} moveIntent={moveIntent} onNearby={noop} onRoom={noop} onExitNearby={setExitNearby} />
    </Canvas>
    <header className="hall-header">
      <button className="hall-back" onClick={onExit}><ArrowLeft size={17} />返回中央岛</button>
      <div><p>WORDS IN THE WOODS</p><h1>回声林地</h1></div>
      <span className="hall-occupancy">{landmark.exhibits.length} 段回声</span>
    </header>
    <aside className="forest-guide"><span>循环林径 · {Math.abs(lap) + 1} 段旅途</span><p>{landmark.exhibits.length ? "林径没有尽头。走近一段声音，停留片刻；回声会为你留住。" : "林间暂时安静，等待下一段公开回声。"}</p><small>WASD / 方向键行走 · 随时按 Esc 返回</small></aside>
    <div className="forest-controls">
      <button onClick={() => setStill(value => !value)} disabled={Boolean(reduced)} aria-pressed={still || Boolean(reduced)}>{still || reduced ? <Play size={15} /> : <Pause size={15} />}{reduced ? "静态阅读模式" : still ? "继续回声" : "暂停回声"}</button>
      <button onClick={() => setReading(true)}><BookOpen size={15} />阅读回声</button>
    </div>
    {exitNearby && !reading && !paused && <button className="museum-exit" onClick={onExit}><kbd>E</kbd>返回中央岛</button>}
    {reading && <EchoReader exhibits={landmark.exhibits} onClose={() => setReading(false)} />}
  </section>;
}

function EchoReader({ exhibits, onClose }: { exhibits: Exhibit[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="forest-reader" onCancel={onClose} onClose={onClose} aria-label="阅读完整回声">
    <header><div><small>停留片刻</small><h2>林间的声音</h2></div><button onClick={onClose} aria-label="关闭回声阅读"><X size={20} /></button></header>
    <p>这里保留完整内容；阅读时，林间的回声会暂时停下。</p>
    {!exhibits.length && <p>尚无公开回声。</p>}
    {exhibits.map(exhibit => {
      const href = exhibit.href ? workspaceUrl(exhibit.href) : null;
      const safe = href && /^https?:\/\//i.test(href);
      return <article key={exhibit.id}><small>{exhibit.label}</small><h3>{exhibit.title}</h3><p>{exhibit.summary}</p>{safe && <a href={href}>阅读来源 ↗</a>}</article>;
    })}
  </dialog>;
}

function EchoField({ exhibits, paused, reduced }: { exhibits: Exhibit[]; paused: boolean; reduced: boolean }) {
  const mobile = useThree(state => state.size.width < 640);
  const entries = useMemo(() => exhibits.map((exhibit, index) => ({ exhibit, index, count: Math.min(72, echoGraphemes(echoText(exhibit)).length) })), [exhibits]);
  const timeline = useRef(4);
  const echoTimes = useRef(new Map<string, number>());
  const audible = useRef(new Set<string>());
  const origin = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ scene, camera }, delta) => {
    if (!paused && !reduced) timeline.current += Math.min(delta, .1);
    const traveler = scene.getObjectByName("museum-traveler");
    traveler?.getWorldPosition(origin);
    const candidates = entries.map(({ exhibit, index, count }) => {
      const initial = echoPlacement(exhibit.id, index);
      const phase = echoPhase(echoTimes.current.get(exhibit.id) ?? timeline.current, count, initial.delay, reduced);
      const placement = echoPlacement(exhibit.id, index, phase.cycle);
      const position = new THREE.Vector3(...placement.position);
      position.z = nearestForestEcho(position.z, origin.z);
      if (mobile) { position.x *= .3; position.y = 1.4 + (position.y - 1.5) * .6; }
      const projected = position.clone().project(camera);
      const depth = -position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      const scale = echoVisualScale(placement.size, camera.position.distanceTo(position), depth, camera.projectionMatrix.elements[0], count, mobile);
      const columns = Math.min(mobile ? 8 : 12, count);
      const w = columns * scale * camera.projectionMatrix.elements[0] / Math.max(.1, depth);
      const h = (Math.ceil(count / (columns || 1)) * 1.3 + .4) * scale * camera.projectionMatrix.elements[5] / Math.max(.1, depth);
      const distance = Math.hypot(position.x - origin.x, position.z - origin.z);
      return { id: exhibit.id, distance, alive: phase.opacity > 0 && phase.visible > 0 && depth > 0, left: projected.x - w / 2, right: projected.x + w / 2, top: projected.y + h * .2, bottom: projected.y - h };
    }).filter(item => item.distance < 19 && item.alive && item.left > -.94 && item.right < .94 && item.top < .9 && item.bottom > -.7).sort((a, b) => a.distance - b.distance);
    const selected: typeof candidates = [];
    for (const item of candidates) {
      if (selected.length >= (mobile ? 2 : 4)) break;
      if (!selected.some(other => item.left < other.right + .08 && item.right > other.left - .08 && item.bottom < other.top + .06 && item.top > other.bottom - .06)) selected.push(item);
    }
    audible.current = new Set(selected.map(item => item.id));
  }, -1);
  return <>{exhibits.map((exhibit, index) => <SpatialEcho key={exhibit.id} exhibit={exhibit} index={index} timeline={timeline} echoTimes={echoTimes} audible={audible} reduced={reduced} />)}</>;
}

// Canvas supplies local CJK/emoji glyphs; each glyph is a world-space quad with
// its own reveal index. No HTML text is overlaid on top of the 3D forest.
function glyphResources(text: string, mobile: boolean) {
  const glyphs = echoGraphemes(text).slice(0, 72);
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.font = '600 48px "Noto Serif CJK SC", "Songti SC", "SimSun", serif';
  ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const positions: number[] = [], uv: number[] = [], indexes: number[] = [];
  const columns = 16, lineLength = Math.min(mobile ? 8 : 12, glyphs.length);
  glyphs.forEach((glyph, i) => {
    const col = i % columns, row = Math.floor(i / columns);
    ctx.fillText(glyph, col * 64 + 32, row * 64 + 32, 60);
    const x = (i % lineLength) - lineLength / 2, y = -Math.floor(i / lineLength) * 1.3;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]]) {
      positions.push(x + dx, y + dy, 0); uv.push((col + dx) / 16, 1 - (row + 1 - dy) / 8); indexes.push(i);
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("glyphIndex", new THREE.Float32BufferAttribute(indexes, 1));
  return { texture, geometry, count: glyphs.length };
}
const vertexShader = "attribute float glyphIndex; varying vec2 vUv; varying float vIndex; void main(){vUv=uv;vIndex=glyphIndex;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";
const fragmentShader = `uniform sampler2D atlas; uniform vec3 tint; uniform float visible; uniform float erased; uniform float opacity; varying vec2 vUv; varying float vIndex;
void main(){
  float a=texture2D(atlas,vUv).a*smoothstep(vIndex,vIndex+1.0,visible)*(1.0-smoothstep(vIndex,vIndex+1.5,erased))*opacity;
  if(a<0.005)discard;
  gl_FragColor=vec4(tint,a);
  #include <colorspace_fragment>
}`;
function animateEchoLayers(materials: (THREE.ShaderMaterial | null)[], time: number, count: number, delay: number, reduced: boolean, fade: number) {
  materials.forEach((material, i) => {
    if (!material) return;
    const layer = material.uniforms;
    const phase = echoPhase(Math.max(0, time - i * .7), count, delay, reduced);
    layer.visible.value = phase.visible;
    layer.erased.value = phase.erased;
    layer.opacity.value = phase.opacity * fade * (i ? reduced ? 0 : .13 / i : 1);
  });
}

function SpatialEcho({ exhibit, index, timeline, audible, reduced, echoTimes }: { exhibit: Exhibit; index: number; timeline: RefObject<number>; audible: RefObject<Set<string>>; reduced: boolean; echoTimes: RefObject<Map<string, number>> }) {
  const root = useRef<THREE.Group>(null);
  const materials = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const mobile = useThree(state => state.size.width < 640);
  const text = echoText(exhibit);
  const resources = useMemo(() => glyphResources(text, mobile), [text, mobile]);
  const placement = useMemo(() => echoPlacement(exhibit.id, index), [exhibit.id, index]);
  const layers = useMemo(() => [0, 1, 2].map(i => ({
    atlas: { value: resources.texture }, tint: { value: new THREE.Color(i ? colors.echo : colors.text) },
    visible: { value: -1 }, erased: { value: -1 }, opacity: { value: 0 },
  })), [resources]);
  const fade = useRef(0);
  const personalTime = useRef(4), lastGlobalTime = useRef(4), observer = useMemo(() => new THREE.Vector3(), []), cameraSpace = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => { resources.texture.dispose(); resources.geometry.dispose(); }, [resources]);
  useFrame(({ camera, scene }, delta) => {
    if (!root.current) return;
    scene.getObjectByName('museum-traveler')?.getWorldPosition(observer);
    const distance = Math.hypot(root.current.position.x - observer.x, root.current.position.z - observer.z);
    // Hold a fully revealed nearby echo while the reader stands with it.
    personalTime.current = advanceEchoTime(personalTime.current, timeline.current - lastGlobalTime.current, resources.count, placement.delay, distance, reduced);
    lastGlobalTime.current = timeline.current;
    echoTimes.current.set(exhibit.id, personalTime.current);
    const state = echoPhase(personalTime.current, resources.count, placement.delay, reduced);
    const current = echoPlacement(exhibit.id, index, state.cycle);
    root.current.position.set(...current.position);
    root.current.position.z = nearestForestEcho(root.current.position.z, observer.z);
    if (mobile) { root.current.position.x *= .3; root.current.position.y = 1.4 + (current.position[1] - 1.5) * .6; }
    const depth = -cameraSpace.copy(root.current.position).applyMatrix4(camera.matrixWorldInverse).z;
    root.current.scale.setScalar(echoVisualScale(current.size, camera.position.distanceTo(root.current.position), depth, camera.projectionMatrix.elements[0], resources.count, mobile));
    root.current.quaternion.copy(camera.quaternion);
    fade.current = THREE.MathUtils.damp(fade.current, audible.current.has(exhibit.id) ? 1 : 0, 3, delta);
    animateEchoLayers(materials.current, personalTime.current, resources.count, placement.delay, reduced, fade.current * (distance < 5 ? 1 : .78));
  });
  return <group ref={root} position={placement.position} scale={placement.size}>
    {layers.map((uniforms, i) => <mesh key={i} geometry={resources.geometry} position={[i * .22, -i * .17, -i * .45]} renderOrder={3 - i}>
      <shaderMaterial ref={material => { materials.current[i] = material; }} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>)}
  </group>;
}
