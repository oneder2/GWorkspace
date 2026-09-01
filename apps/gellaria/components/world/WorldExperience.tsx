"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Compass, DoorOpen, House, Map, MapPin, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { role, studyArea, type Landmark } from "@/lib/content";
import type { SiteProfile } from "@/lib/gworkspace-content";
import { isJourneyComplete } from "@/lib/journey";
import { workspaceUrl } from "@/lib/workspace-url";
import { CompletionMoment, JourneyJournal } from "./JourneyJournal";
import { ExhibitionHall } from "./ExhibitionHall";
import { StudyArea } from "./StudyArea";
import { useJourneyStore } from "./journey-store";
import { useWorldStore } from "./store";

const WorldCanvas = dynamic(() => import("./WorldCanvas").then((module) => module.WorldCanvas), {
  ssr: false,
  loading: () => <div className="world-loading"><span />正在绘制地平线</div>,
});

export type MoveIntent = { x: number; z: number };

export function WorldExperience({ initialDestination, landmarks, profile }: { initialDestination?: string; landmarks: Landmark[]; profile: SiteProfile }) {
  const initialHall = landmarks.find((item) => item.id === initialDestination) ?? null;
  const [entered, setEntered] = useState(Boolean(initialHall));
  const [nearby, setNearby] = useState<Landmark | null>(null);
  const [activeHall, setActiveHall] = useState<Landmark | null>(initialHall);
  const [moveIntent, setMoveIntent] = useState<MoveIntent>({ x: 0, z: 0 });
  const [mapOpen, setMapOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [newDiscovery, setNewDiscovery] = useState<Landmark | null>(null);
  const [journeyNotice, setJourneyNotice] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [studyNearby, setStudyNearby] = useState(false);
  const [inStudy, setInStudy] = useState(false);
  const [worldSpawn, setWorldSpawn] = useState<[number, number, number]>([0, 0.7, 5]);
  const connect = useWorldStore((state) => state.connect);
  const connection = useWorldStore((state) => state.connection);
  const players = useWorldStore((state) => state.players);
  const signals = useWorldStore((state) => state.signals);
  const notice = useWorldStore((state) => state.notice);
  const clearNotice = useWorldStore((state) => state.clearNotice);
  const discovered = useJourneyStore((state) => state.discovered);
  const collected = useJourneyStore((state) => state.collected);
  const discover = useJourneyStore((state) => state.discover);
  const collect = useJourneyStore((state) => state.collect);
  const onlineCount = Object.keys(players).length + 1;
  const landmarkIds = useMemo(() => landmarks.map((landmark) => landmark.id), [landmarks]);
  const journeyComplete = isJourneyComplete(collected, landmarkIds);

  useEffect(() => connect(), [connect]);
  useAmbientSound(!muted && !inStudy);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(clearNotice, 3600);
    return () => window.clearTimeout(timeout);
  }, [notice, clearNotice]);
  useEffect(() => {
    if (!newDiscovery) return;
    const timeout = window.setTimeout(() => setNewDiscovery(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [newDiscovery]);
  useEffect(() => {
    if (!journeyNotice) return;
    const timeout = window.setTimeout(() => setJourneyNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [journeyNotice]);

  const totalSignals = useMemo(() => Object.values(signals).reduce((sum, count) => sum + count, 0), [signals]);
  const setDirection = (axis: "x" | "z", value: number) => setMoveIntent((current) => ({ ...current, [axis]: value }));

  const handleNearby = useCallback((landmark: Landmark | null) => {
    setNearby(landmark);
    if (landmark && discover(landmark.id)) setNewDiscovery(landmark);
  }, [discover]);

  const enterHall = useCallback((landmark: Landmark) => {
    setMoveIntent({ x: 0, z: 0 });
    setNearby(null);
    setStudyNearby(false);
    setWorldSpawn([landmark.position[0] * 0.72, 0.7, landmark.position[2] * 0.72]);
    setActiveHall(landmark);
    if (collect(landmark.id)) {
      setJourneyNotice(`${landmark.name}已记入参观记录`);
      if (isJourneyComplete([...collected, landmark.id], landmarkIds)) setShowCompletion(true);
    }
  }, [collect, collected, landmarkIds]);

  const enterStudy = useCallback(() => {
    if (!studyNearby) return;
    setMoveIntent({ x: 0, z: 0 });
    setNearby(null);
    setStudyNearby(false);
    setWorldSpawn(studyArea.exitPosition);
    setInStudy(true);
  }, [studyNearby]);

  useEffect(() => {
    if (!entered || activeHall || inStudy || mapOpen || journalOpen || showCompletion) return;
    const handleEntryKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;
      if (!nearby && !studyNearby) return;
      event.preventDefault();
      if (studyNearby) enterStudy();
      else if (nearby) enterHall(nearby);
    };
    window.addEventListener("keydown", handleEntryKey);
    return () => window.removeEventListener("keydown", handleEntryKey);
  }, [activeHall, enterHall, entered, enterStudy, inStudy, journalOpen, mapOpen, nearby, showCompletion, studyNearby]);

  return (
    <main className="world-shell">
      <div className="world-layer" aria-hidden={inStudy} inert={inStudy ? true : undefined}>
        {!inStudy && (activeHall ? (
          <ExhibitionHall landmark={activeHall} moveIntent={moveIntent} onExit={() => setActiveHall(null)} />
        ) : (
          <WorldCanvas landmarks={landmarks} active={entered} moveIntent={moveIntent} onNearby={handleNearby} onStudyNearby={(value) => { setStudyNearby(value); if (value) setNearby(null); }} nearbyId={nearby?.id ?? null} discoveredIds={discovered} collectedIds={collected} journeyComplete={journeyComplete} initialPlayerPosition={worldSpawn} studyNearby={studyNearby} onStudyEnter={enterStudy} onHallEnter={enterHall} />
        ))}

        {!activeHall && <div className="atmosphere" aria-hidden="true" />}

        {!activeHall && (
          <header className="world-header">
            <button className="brand-button" onClick={() => setMapOpen(true)} aria-label="打开展馆地图"><Compass size={22} strokeWidth={1.5} /><span><strong>GELLARIA</strong><small>GWORKSPACE / EXPLORE</small></span></button>
            <div className="world-status" aria-live="polite"><span className={`status-dot ${connection}`} />{connection === "online" ? `${onlineCount} 位旅人正在途中` : connection === "connecting" ? "正在接入世界" : "离线参观"}</div>
            <div className="header-actions">
              <button className="icon-button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "开启声音" : "关闭声音"} title={muted ? "开启声音" : "关闭声音"}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
              <button className="icon-button" onClick={() => setMapOpen(true)} aria-label="打开地图" title="展馆地图"><Map size={18} /></button>
              <button className="icon-button" onClick={() => setJournalOpen(true)} aria-label="打开参观记录" title="参观记录"><BookOpen size={18} /></button>
              <a className="icon-button" href={workspaceUrl("/")} aria-label="返回 GWorkspace" title="返回 GWorkspace"><House size={18} /></a>
            </div>
          </header>
        )}

        {!activeHall && <button className="role-badge" aria-label="打开当前身份的参观记录" onClick={() => setJournalOpen(true)}><span className="role-glyph"><MapPin size={18} /></span><span><small>你的身份</small><strong>{role.name}</strong></span></button>}

        <AnimatePresence>
          {!entered && !activeHall && (
            <motion.section className="arrival" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
              <motion.div className="arrival-copy" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
                <p className="eyebrow">GWORKSPACE / SPATIAL EXHIBITION</p>
                <h1>内容不只被阅读，<br />也可以被抵达。</h1>
                <p className="arrival-owner"><span>{profile.name}</span>{profile.status}</p>
                <p className="arrival-intro">这里是 GWorkspace 的空间展览层。沿展馆之间的光路行走，靠近入口按 E 进入；项目、写作与回声会以各自的形态出现在展厅中。</p>
                <button className="enter-button" onClick={() => setEntered(true)}>开始参观 <ArrowRight size={18} /></button>
                <a className="quiet-link" href={workspaceUrl("/")}>返回 GWorkspace</a>
              </motion.div>
              <div className="arrival-coordinate" aria-hidden="true"><span>EXHIBITION CAMPUS</span><i /><span>WORLD 001</span></div>
            </motion.section>
          )}
        </AnimatePresence>

        {entered && !inStudy && (
          <>
            {!activeHall && <div className="objective"><span><Sparkles size={15} /> 展馆记录</span><strong>{collected.length} / {landmarks.length} 座展馆已参观</strong></div>}
            <div className="mobile-controls" aria-label="移动控制">
              <button onPointerDown={() => setDirection("z", -1)} onPointerUp={() => setDirection("z", 0)} onPointerCancel={() => setDirection("z", 0)} aria-label="向前"><ChevronUp /></button>
              <button onPointerDown={() => setDirection("x", -1)} onPointerUp={() => setDirection("x", 0)} onPointerCancel={() => setDirection("x", 0)} aria-label="向左"><ChevronLeft /></button>
              <button onPointerDown={() => setDirection("z", 1)} onPointerUp={() => setDirection("z", 0)} onPointerCancel={() => setDirection("z", 0)} aria-label="向后"><ChevronDown /></button>
              <button onPointerDown={() => setDirection("x", 1)} onPointerUp={() => setDirection("x", 0)} onPointerCancel={() => setDirection("x", 0)} aria-label="向右"><ChevronRight /></button>
            </div>
            {!activeHall && studyNearby && <button className="nearby-prompt study-entry-prompt" onClick={enterStudy} aria-keyshortcuts="E"><kbd>E</kbd><span>进入功能附馆</span>{studyArea.name}<DoorOpen size={17} /></button>}
            {!activeHall && nearby && <button className="nearby-prompt" onClick={() => enterHall(nearby)} aria-keyshortcuts="E"><kbd>E</kbd><span>进入展馆</span>{nearby.name}<DoorOpen size={17} /></button>}
          </>
        )}

        <AnimatePresence>
          {mapOpen && !activeHall && (
            <motion.div className="map-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.section className="map-sheet" initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }}>
                <button className="panel-close icon-button" onClick={() => setMapOpen(false)} aria-label="关闭地图"><X size={19} /></button>
                <p className="eyebrow">EXHIBITION CAMPUS / 展馆总览</p><h2>沿中央庭院前往四座馆舍</h2>
                <div className="map-diagram" aria-label="三座内容展馆和一座功能附馆">
                  <div className="map-path path-a" /><div className="map-path path-b" /><div className="map-path path-c" />
                  <div className={`map-node workshop static ${discovered.includes("workshop") ? "surveyed" : ""}`}><span />项目馆<small>{collected.includes("workshop") ? "已参观" : "原型陈列"} · {signals.workshop ?? 0} 道光迹</small></div>
                  <div className={`map-node observatory static ${discovered.includes("observatory") ? "surveyed" : ""}`}><span />写作馆<small>{collected.includes("observatory") ? "已参观" : "星图阅览"} · {signals.observatory ?? 0} 道光迹</small></div>
                  <div className={`map-node grove static ${discovered.includes("memory-grove") ? "surveyed" : ""}`}><span />回声馆<small>{collected.includes("memory-grove") ? "已参观" : "记忆温室"} · {signals["memory-grove"] ?? 0} 道光迹</small></div>
                  <div className="map-node study static"><span />夜航自习室<small>功能附馆 · 临时停泊</small></div>
                  <div className="map-origin"><Compass size={20} /><small>中央抵达庭院</small></div>
                </div>
                <footer><span>世界总光迹</span><strong>{totalSignals.toLocaleString("zh-CN")}</strong></footer>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{journalOpen && <JourneyJournal discovered={discovered} collected={collected} onClose={() => setJournalOpen(false)} />}</AnimatePresence>
        <AnimatePresence>{showCompletion && <CompletionMoment onClose={() => setShowCompletion(false)} />}</AnimatePresence>
        <AnimatePresence>{newDiscovery && !activeHall && <motion.div className="discovery-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ "--accent": newDiscovery.accent } as CSSProperties}><span>发现新展馆</span><strong>{newDiscovery.name}</strong><small>靠近入口按 E 进入</small></motion.div>}</AnimatePresence>
        <AnimatePresence>{(journeyNotice ?? notice) && <motion.div className="world-toast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{journeyNotice ?? notice}</motion.div>}</AnimatePresence>
      </div>
      <AnimatePresence>{inStudy && <StudyArea onExit={() => setInStudy(false)} />}</AnimatePresence>
    </main>
  );
}

function useAmbientSound(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const context = new AudioContext();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const lowTone = context.createOscillator();
    const highTone = context.createOscillator();
    const drift = context.createOscillator();
    const driftDepth = context.createGain();
    gain.gain.value = 0.028;
    filter.type = "lowpass";
    filter.frequency.value = 420;
    lowTone.type = "sine"; lowTone.frequency.value = 74;
    highTone.type = "triangle"; highTone.frequency.value = 111;
    drift.frequency.value = 0.08; driftDepth.gain.value = 9;
    drift.connect(driftDepth).connect(highTone.frequency);
    lowTone.connect(filter); highTone.connect(filter); filter.connect(gain).connect(context.destination);
    lowTone.start(); highTone.start(); drift.start();
    return () => { lowTone.stop(); highTone.stop(); drift.stop(); void context.close(); };
  }, [enabled]);
}
