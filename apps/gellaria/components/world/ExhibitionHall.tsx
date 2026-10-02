"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import Image from "next/image";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import * as THREE from "three";
import type { Landmark } from "@/lib/content";
import { buildMuseumPlan, constrainMuseumPosition, exhibitKindNames, getExhibitAction, getHallConfig, selectNearbyExhibit, type ExhibitSlot, type MuseumPlan } from "@/lib/exhibition";
import { getCameraRelativeMovement } from "@/lib/movement";
import { workspaceUrl } from "@/lib/workspace-url";
import { gworkspaceMediaUrl } from "@/lib/gworkspace-resume";
import { MuseumInterior } from "./MuseumInteriors";
import { museumTheme } from "@/lib/museum-theme";
import { MuseumExhibit } from "./MuseumExhibit";
import { MuseumLighting } from "./MuseumLighting";
import { InspectionCamera, InspectionContext, InspectionPanel, type ViewMove } from './ExhibitInspection';
import { ExhibitionCatalog } from './ExhibitionCatalog';
import { MuseumGuide } from './MuseumGuide';
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
import { useWorldStore } from "./store";
import type { MoveIntent } from "./WorldExperience";
import { GALLERY_CAPACITY, GALLERY_LAYOUT_VERSION, readGalleryPlacements } from '@/lib/compact-gallery';

type ExhibitionHallProps = { landmark: Landmark; moveIntent: MoveIntent; paused?: boolean; onExit: () => void };
const subscribeHydration = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;
function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
}
function publicLink(value?: string | null) {
  if (!value) return null;
  const resolved = workspaceUrl(value);
  try { const url = new URL(resolved); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; }
}
function publicImage(value?: string | null) {
  if (!value) return null;
  const media = gworkspaceMediaUrl(value);
  return media.startsWith('/api/gworkspace-media?') ? `/explore${media}` : publicLink(media);
}

export function ExhibitionHall({ landmark, moveIntent, paused = false, onExit }: ExhibitionHallProps) {
  const [selection, setSelection] = useState({ landmark, label: '入口精选', visit: 0 });
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [batch, setBatch] = useState(0);
  const batches = Math.max(1, Math.ceil(selection.landmark.exhibits.length / GALLERY_CAPACITY));
  const visibleLandmark = useMemo(() => ({ ...selection.landmark, exhibits: selection.landmark.exhibits.slice(batch * GALLERY_CAPACITY, (batch + 1) * GALLERY_CAPACITY) }), [selection.landmark, batch]);
  return <><MuseumVisit key={`${selection.visit}:${batch}`} landmark={visibleLandmark} moveIntent={moveIntent} paused={paused || catalogOpen} onExit={onExit} collectionLabel={`${selection.label}${batches > 1 ? ` · ${batch + 1}/${batches}` : ''}`} onCatalog={() => setCatalogOpen(true)} onNextBatch={batches > 1 ? () => setBatch(value => (value + 1) % batches) : undefined}/>{catalogOpen && <ExhibitionCatalog landmark={landmark} onClose={() => setCatalogOpen(false)} onSelect={(next, label) => { setBatch(0); setSelection(current => ({ landmark: next, label, visit: current.visit + 1 })); setCatalogOpen(false); }}/>}</>;
}

function MuseumVisit({ landmark, moveIntent, paused = false, onExit, onCatalog, collectionLabel, onNextBatch }: ExhibitionHallProps & { onCatalog: () => void; collectionLabel: string; onNextBatch?: () => void }) {
  const config = getHallConfig(landmark.id);
  const theme = museumTheme(landmark.id);
  const layoutKey = `gellaria:gallery:${GALLERY_LAYOUT_VERSION}:${landmark.id}:${collectionLabel}`;
  const hydrated = useSyncExternalStore(subscribeHydration, browserSnapshot, serverSnapshot);
  const plan = useMemo(() => {
    if (!hydrated) return buildMuseumPlan(landmark);
    try { return buildMuseumPlan(landmark, readGalleryPlacements(window.localStorage, layoutKey)); }
    catch { return buildMuseumPlan(landmark); }
  }, [hydrated, landmark, layoutKey]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(layoutKey, JSON.stringify(plan.placements)); } catch { /* Private browsing still permits a visit. */ } }, [hydrated, layoutKey, plan]);
  const [nearby, setNearby] = useState<ExhibitSlot | null>(null);
  const [preview, setPreview] = useState<ExhibitSlot | null>(null);
  const [active, setActive] = useState<ExhibitSlot | null>(null);
  const [inspection, setInspection] = useState<ExhibitSlot | null>(null);
  const [inspectionStep, setInspectionStep] = useState(0);
  const [viewMove, setViewMove] = useState<ViewMove | null>(null);
  const [cameraReset, setCameraReset] = useState(0);
  const inspect = useCallback((slot: ExhibitSlot) => { setInspection(slot); setInspectionStep(0); setCameraReset(0); setViewMove(null); }, []);
  const closeDossier = useCallback(() => setActive(null), []);
  const [exitNearby, setExitNearby] = useState(false);
  const [roomId, setRoomId] = useState(plan.rooms[0].id);
  const [arrival, setArrival] = useState<[number, number] | undefined>();
  const [guideOpen, setGuideOpen] = useState(false);
  const signals = useWorldStore((state) => state.signals);
  const sendSignal = useWorldStore((state) => state.sendSignal);
  const sendTag = useWorldStore((state) => state.sendTag);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!nearby) { const timer = setTimeout(() => setPreview(null), 100); return () => clearTimeout(timer); }
    const timer = setTimeout(() => setPreview(nearby), 280);
    return () => clearTimeout(timer);
  }, [nearby]);

  const activate = useCallback(() => {
    if (nearby?.exhibit) inspect(nearby);
    else if (exitNearby) onExit();
  }, [nearby, exitNearby, onExit, inspect]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (paused || guideOpen || isTyping(event.target)) return;
      if (event.code === "Escape") {
        event.preventDefault();
        if (active) setActive(null);
        else if (inspection) setInspection(null);
        else onExit();
      }
      if (event.code === "KeyE" && !event.repeat && !active && !inspection) { event.preventDefault(); activate(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [paused, guideOpen, active, inspection, activate, onExit]);

  const currentRoom = plan.rooms.find((room) => room.id === roomId) ?? plan.rooms[0];
  const roomIndex = plan.rooms.indexOf(currentRoom);
  const visiblePlan = plan.shell ? plan : { ...plan, rooms: plan.rooms.slice(Math.max(0, roomIndex - 1), roomIndex + 2) };
  const activeSlots = plan.slots.slice(currentRoom.startIndex, currentRoom.startIndex + currentRoom.count);
  return <section className={`exhibition-hall museum museum-${theme.layout}${active ? " museum-reading" : ""}${inspection ? " museum-inspecting" : ""}`} aria-label={`${landmark.name}${config.roomLabel}`} style={{ "--museum-accent": theme.accent, "--museum-panel": theme.panel, "--museum-paper": theme.paper, "--museum-ink": theme.ink } as CSSProperties}>
    <Canvas className="hall-canvas" shadows="percentage" dpr={[1, 1.4]} camera={{ position: [0, 9, 16], fov: 52, near: .1, far: 150 }} gl={{ antialias: true, alpha: false }} onCreated={({ gl }) => { gl.transmissionResolutionScale = .4; }}>
      <color attach="background" args={[theme.background]} />
      <MuseumLighting room={currentRoom} plan={visiblePlan} slots={activeSlots} theme={theme} selectedId={nearby?.id ?? active?.id} />
      <MuseumInterior plan={visiblePlan} kind={landmark.id} />
      <InspectionContext.Provider value={{ artifactId: inspection?.exhibit?.artifactId || '', step: inspectionStep }}>
        {(plan.shell ? plan.slots : activeSlots).map((slot) => <MuseumExhibit key={slot.id} slot={slot} theme={theme} inspecting={inspection?.id === slot.id} selected={nearby?.id === slot.id || active?.id === slot.id} />)}
      </InspectionContext.Provider>
      {visiblePlan.rooms.map((room) => <Html key={room.id} position={[room.centerX || 0, .13, room.centerZ + room.depth / 2 - .85]} rotation-x={-Math.PI / 2} transform distanceFactor={8} className="museum-floor-label" zIndexRange={[1, 0]}>
        <span>{String(plan.rooms.indexOf(room) + 1).padStart(2, "0")} / {room.title}</span>
      </Html>)}
      <MuseumTraveler plan={plan} arrival={arrival} paused={paused || guideOpen || Boolean(active) || Boolean(inspection)} cameraOwned={Boolean(inspection)} moveIntent={moveIntent} onNearby={setNearby} onExitNearby={setExitNearby} onRoom={setRoomId} />
      {inspection && <InspectionCamera key={`${inspection.id}:${cameraReset}`} slot={inspection} move={viewMove}/>}
    </Canvas>
    <header className="hall-header" inert={Boolean(active)}>
      <button className="hall-back" onClick={onExit}><ArrowLeft size={17} />返回中央岛</button>
      <div><p>{config.hallLabel}</p><h1>{config.roomLabel}</h1></div>
      <span className="hall-occupancy">{plan.shell ? '连续展厅' : `${plan.rooms.length} 个展室`} · {plan.slots.length} 件展出</span>
    </header>
    <aside className="museum-location" hidden={Boolean(inspection)} inert={Boolean(active)}>
      <span>当前展区 {roomIndex + 1} / {plan.rooms.length}</span>
      <strong>{currentRoom.title}</strong>
      <button className="catalog-open guide-open" onClick={() => setGuideOpen(true)}>{landmark.id === 'workshop' ? '从一件作品开始' : '选一篇文章'} · 参观指南</button>
      <button className="catalog-open" onClick={onCatalog}>{collectionLabel} · 查看全部收藏</button>
      {onNextBatch && <button className="catalog-open" onClick={onNextBatch}>参观下一组展出</button>}
      <small>{plan.slots.length ? theme.route : "展馆已准备好，等待公开内容展出"}</small>
      <details className="museum-route"><summary>主题路线 · {plan.rooms.length} 个区域</summary><ol>{plan.rooms.map((room, index) => <li key={room.id} aria-current={room.id === currentRoom.id ? "location" : undefined}><button onClick={() => { setNearby(null); setPreview(null); setRoomId(room.id); setArrival(room.arrival || [0, room.centerZ + room.depth / 2 - 2]); }}>{index + 1}. {room.title}</button><span>{room.count} 件</span></li>)}</ol><small>各展区相互开放，可以绕行，也可以穿过中间的捷径。</small></details>
      <details><summary>展厅生态 · {signals[landmark.id] ?? 0} 道光迹</summary>
        <button onClick={() => sendSignal(landmark.id)}>留下一道光迹</button>
        {landmark.tagOptions.map((tag) => <button key={tag} onClick={() => sendTag(landmark.id, tag)}>{tag}</button>)}
      </details>
    </aside>
    {guideOpen && <MuseumGuide plan={plan} kind={landmark.id} onClose={() => setGuideOpen(false)} onVisit={slot => {
      const room = plan.rooms.find(item => slot.index >= item.startIndex && slot.index < item.startIndex + item.count)!;
      setRoomId(room.id); setNearby(slot); setPreview(slot);
      setArrival(slot.viewingPoint || [slot.position[0] + (slot.position[0] < 0 ? 2.2 : -2.2), slot.position[2]]);
      setGuideOpen(false); inspect(slot);
    }}/>}
    <AnimatePresence mode="wait">
      {preview?.exhibit && !active && !inspection && !paused && <motion.aside key={preview.id} className="museum-preview" aria-label="附近展品" initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
        <p>{exhibitKindNames[preview.kind]} · {preview.exhibit.label}</p>
        <h2>{preview.exhibit.title}</h2>
        <p className="museum-preview-summary">{preview.exhibit.summary}</p>
        <div className="museum-preview-meta">{preview.exhibit.publishedAt && <time>{preview.exhibit.publishedAt.slice(0, 10)}</time>}{preview.exhibit.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <button onClick={() => inspect(preview)}><kbd>E</kbd>驻足观看<ArrowUpRight size={15} /></button>
        <button onClick={() => setActive(preview)}>阅读展签</button>
      </motion.aside>}
    </AnimatePresence>
    {!active && !nearby && exitNearby && !paused && <button className="museum-exit" onClick={onExit}><kbd>E</kbd>返回中央岛</button>}
    <AnimatePresence>
      {active?.exhibit && !paused && <ExhibitDossier slot={active} onClose={closeDossier} />}
    </AnimatePresence>
    {inspection && !active && !paused && <InspectionPanel slot={inspection} step={inspectionStep} onStep={setInspectionStep} onReset={() => { setViewMove(null); setCameraReset(value => value + 1); }} onMove={action => setViewMove(value => ({ action, sequence: (value?.sequence || 0) + 1 }))} onRead={() => setActive(inspection)} onClose={() => setInspection(null)}/>}
  </section>;
}

function ExhibitDossier({ slot, onClose }: { slot: ExhibitSlot; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const present = useIsPresent();
  useEffect(() => {
    if (!present) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = panel.current?.querySelectorAll<HTMLElement>("button, a[href], summary");
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap, true);
    return () => { document.removeEventListener("keydown", trap, true); previous?.focus(); };
  }, [onClose, present]);
  const exhibit = slot.exhibit!;
  const href = publicLink(exhibit.href);
  const cover = publicImage(exhibit.image);
  const details = exhibit.details;
  return <motion.aside ref={panel} role="dialog" aria-modal="true" aria-label={`${exhibit.title}完整展签`} className="museum-dossier" initial={{ opacity: 0, x: reduced ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
    <button className="exhibit-close" aria-label="关闭展签" onClick={onClose}><X size={18} /></button>
    <p className="museum-catalogue">{String(slot.index + 1).padStart(2, "0")} / {exhibitKindNames[slot.kind]}{slot.kind !== 'project-model' && ` · ${exhibit.label}`}</p>
    <h2>{exhibit.title}</h2>
    {cover && <figure><Image src={cover} alt={`${exhibit.title}封面`} width={720} height={400} unoptimized onError={(event) => { event.currentTarget.hidden = true; }} /></figure>}
    {slot.kind === 'project-model' && <h3>它用来做什么</h3>}
    <p className="museum-body">{exhibit.summary}</p>
    {details && <section className="museum-contribution"><h3>我的参与与实现</h3>
      <p>{details.role}{details.involvement && ` · ${({ creator: '创建者', contributor: '参与贡献', collaborator: '协作开发' })[details.involvement]}`}</p>
      {details.highlights.length > 0 && <ul>{details.highlights.map((item, index) => <li key={index}>{item}</li>)}</ul>}
    </section>}
    {href && <div className="museum-links"><a href={href}>{slot.kind === 'project-model' ? '打开实际项目' : getExhibitAction(slot.kind).destination}<ArrowUpRight size={15}/></a></div>}
    {details?.gallery?.length ? <section><h3>项目图集</h3>{details.gallery.map((media, index) => {
      const image = publicImage(media.url);
      return image ? <figure key={`${media.url}:${index}`}><Image src={image} alt={media.alt} width={720} height={480} unoptimized loading="lazy" onError={event => { event.currentTarget.hidden = true; }}/><figcaption>{media.alt}</figcaption></figure> : null;
    })}</section> : null}
    {exhibit.artifactSpec && <details className="museum-model-story">
      <summary>{exhibit.artifactSpec.design?.name || '模型与内容'} · 模型解读</summary>
      <p>{exhibit.artifactSpec.design?.tier === 'reading' && exhibit.artifactSpec.design.level === 0 ? '书页尚未展开。第一次阅读之后，这篇文章会拥有自己的立体意象。' : exhibit.artifactSpec.caption}</p>
      {exhibit.artifactSpec.design?.tier === 'kinetic' && <p>以{({ 'torus-knot': '环面纽结', superformula: '超公式曲线', lissajous: '李萨如曲线' })[exhibit.artifactSpec.design.geometry.family]}构成流动的数学雕塑。</p>}
      <small>{exhibit.artifactSpec.design?.tier === 'reading' ? `阅读雕刻 · 第 ${exhibit.artifactSpec.design.level} 阶${exhibit.artifactSpec.design.nextThreshold ? ` · ${exhibit.artifactSpec.design.nextThreshold.toLocaleString()} 次阅读后继续生长` : ''}` : `主题转译 · ${exhibit.artifactSpec.zone}`}</small>
      {exhibit.artifactSpec.design?.tier === 'reading' && exhibit.artifactSpec.design.narrative && <details><summary>文章如何长成这件展品</summary><p>首次阅读形成主题；10 次展开章节；50 次长出正文摘录节点；200 次连接阅读顺序。连线表示原文次序。</p><ol>{exhibit.artifactSpec.design.narrative.chapters.map((chapter, index) => <li key={index}><strong>{chapter.title}</strong>{exhibit.artifactSpec!.design!.level >= 3 && <p>{chapter.excerpt}</p>}</li>)}</ol></details>}
    </details>}
    <dl>
      {details?.role && <><dt>参与角色</dt><dd>{details.role}</dd></>}
      {details?.start ? <><dt>时间</dt><dd>{details.start} — {details.end || "至今"}</dd></> : exhibit.publishedAt && <><dt>记录日期</dt><dd>{exhibit.publishedAt.slice(0, 10)}</dd></>}
      <dt>收藏来源</dt><dd>GWorkspace · {slot.kind === 'project-model' ? '项目档案' : exhibit.label}</dd>
    </dl>
    {exhibit.tags?.length ? <div className="exhibit-tags">{exhibit.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
    <div className="museum-links">
      {details && Object.entries(details.links).map(([key, url]) => {
        const link = publicLink(url);
        return link && link !== href ? <a key={key} href={link}>{({ source: "查看源码", demo: "体验作品", case_study: "阅读项目说明" } as Record<string, string>)[key]}<ArrowUpRight size={15} /></a> : null;
      })}
    </div>
    <small>关闭展签后继续参观 · Esc 返回</small>
  </motion.aside>;
}

type TravelerProps = {
  plan: MuseumPlan; paused: boolean; moveIntent: MoveIntent;
  onNearby: (slot: ExhibitSlot | null) => void; onExitNearby: (nearby: boolean) => void; onRoom: (roomId: string) => void;
  forest?: boolean;
  cameraOwned?: boolean;
  arrival?: [number, number];
  constrain?: (x: number, z: number) => [number, number];
};
export function MuseumTraveler({ plan, paused, moveIntent, onNearby, onExitNearby, onRoom, forest = false, constrain, cameraOwned = false, arrival }: TravelerProps) {
  const root = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(0, 0, plan.entranceZ));
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef(new Set<string>());
  const motionState = useRef<SpiritMotion>({ speed: 0, stride: 0 });
  const nearby = useRef<string | null>(null);
  const pending = useRef<string | null>(null);
  const dwell = useRef(0);
  const exit = useRef(false);
  const room = useRef(plan.rooms[0].id);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();
  const appearance = useWorldStore((state) => state.playerAppearance);
  useEffect(() => {
    if (!arrival) return;
    camera.position.set(camera.position.x + arrival[0] - position.current.x, camera.position.y, camera.position.z + arrival[1] - position.current.z);
    position.current.set(arrival[0], 0, arrival[1]); velocity.current.set(0, 0, 0); keys.current.clear(); pending.current = null; nearby.current = null;
  }, [arrival, camera]);
  useEffect(() => {
    const clear = () => keys.current.clear();
    const down = (event: KeyboardEvent) => {
      if (paused || isTyping(event.target)) return;
      if (["KeyW", "KeyS", "KeyA", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) { event.preventDefault(); keys.current.add(event.code); }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    return () => { clear(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); };
  }, [paused]);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, .25);
    if (!root.current) return;
    const inputX = paused ? 0 : Number(keys.current.has("KeyD") || keys.current.has("ArrowRight")) - Number(keys.current.has("KeyA") || keys.current.has("ArrowLeft")) + moveIntent.x;
    const inputZ = paused ? 0 : Number(keys.current.has("KeyS") || keys.current.has("ArrowDown")) - Number(keys.current.has("KeyW") || keys.current.has("ArrowUp")) + moveIntent.z;
    camera.getWorldDirection(scratch);
    if (inputX || inputZ) {
      const [x, z] = getCameraRelativeMovement(inputX, inputZ, scratch.x, scratch.z);
      velocity.current.lerp(scratch.set(x, 0, z).multiplyScalar(4.5), Math.min(1, dt * 10));
    } else velocity.current.multiplyScalar(Math.max(0, 1 - dt * 12));
    if (!paused) for (let remaining = dt; remaining > 0; remaining -= .025) {
      const step = Math.min(.025, remaining);
      const nextX = position.current.x + velocity.current.x * step, nextZ = position.current.z + velocity.current.z * step;
      const [x, z] = constrain ? constrain(nextX, nextZ) : constrainMuseumPosition(plan, nextX, nextZ, [position.current.x, position.current.z]);
      if (forest && Math.abs(z - nextZ) > 20) camera.position.setZ(camera.position.z + z - nextZ);
      position.current.set(x, 0, z);
    }
    root.current.position.copy(position.current);
    if (velocity.current.lengthSq() > .05) root.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    motionState.current = { speed: paused ? 0 : Math.min(1, velocity.current.length() / 4.5), stride: clock.elapsedTime * 9 };
    const mobile = size.width < 640;
    // A centered, steep sectional camera keeps the traveler above mobile cards.
    cameraTarget.set(position.current.x * .72, forest ? (mobile ? 6 : 5) : mobile ? 11.5 : 9, position.current.z + (forest ? 9 : mobile ? 10 : 9));
    if (!cameraOwned) {
      camera.position.lerp(cameraTarget, 1 - Math.pow(.001, dt));
      camera.lookAt(position.current.x * .85, forest ? 2.1 : .6, position.current.z - (forest ? 3 : mobile ? .1 : 1.4));
    }
    const direction: [number, number] | undefined = velocity.current.lengthSq() > .5 ? [velocity.current.x / velocity.current.length(), velocity.current.z / velocity.current.length()] : undefined;
    const next = selectNearbyExhibit(plan.slots, position.current.x, position.current.z, nearby.current, direction);
    if (pending.current !== (next?.id ?? null)) { pending.current = next?.id ?? null; dwell.current = 0; }
    dwell.current += dt;
    if (dwell.current >= .16 && nearby.current !== pending.current) { nearby.current = pending.current; onNearby(next); }
    const nextExit = Math.hypot(position.current.x, position.current.z - plan.entranceZ) < 1.65;
    if (nextExit !== exit.current) { exit.current = nextExit; onExitNearby(nextExit); }
    const closestSlot = plan.shell ? plan.slots.reduce<ExhibitSlot | undefined>((best, slot) => !best || Math.hypot(slot.position[0] - position.current.x, slot.position[2] - position.current.z) < Math.hypot(best.position[0] - position.current.x, best.position[2] - position.current.z) ? slot : best, undefined) : undefined;
    const nextRoom = plan.shell ? plan.rooms.find(item => item.id === closestSlot?.zoneId) : plan.rooms.find((item) => position.current.z <= item.centerZ + item.depth / 2 && position.current.z >= item.centerZ - item.depth / 2);
    if (nextRoom && nextRoom.id !== room.current) { room.current = nextRoom.id; onRoom(nextRoom.id); }
  });
  return <group name="museum-traveler" ref={root} visible={!cameraOwned}><SpiritTraveler appearance={appearance} motion={motionState} /></group>;
}
