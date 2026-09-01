"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { motion } from "motion/react";
import {
  ArrowLeft,
  AudioLines,
  Calculator,
  CloudRain,
  MoonStar,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Sunrise,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import {
  formatTimer,
  getRemainingTimerSeconds,
  initialCalculatorState,
  pressCalculatorKey,
  type CalculatorKey,
} from "@/lib/study-tools";
import { workspaceUrl } from "@/lib/workspace-url";

type StudyAtmosphere = "night" | "rain" | "dawn";
type Soundscape = "focus" | "rain" | "embers";
type StudyTool = "timer" | "calculator" | "writing";

const atmosphereOptions: Array<{ id: StudyAtmosphere; label: string; icon: typeof MoonStar }> = [
  { id: "night", label: "深夜", icon: MoonStar },
  { id: "rain", label: "雨窗", icon: CloudRain },
  { id: "dawn", label: "晨雾", icon: Sunrise },
];

const timerModes = {
  focus: { label: "专注", seconds: 25 * 60 },
  short: { label: "短休", seconds: 5 * 60 },
  long: { label: "长休", seconds: 15 * 60 },
} as const;

type TimerMode = keyof typeof timerModes;

const calculatorKeys: CalculatorKey[] = [
  "C", "+/-", "%", "÷",
  "7", "8", "9", "×",
  "4", "5", "6", "-",
  "1", "2", "3", "+",
  "0", ".", "=",
];

export function StudyArea({ onExit }: { onExit: () => void }) {
  const [atmosphere, setAtmosphere] = useState<StudyAtmosphere>("night");
  const [soundscape, setSoundscape] = useState<Soundscape>("focus");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(38);
  const [activeTool, setActiveTool] = useState<StudyTool>("timer");
  const [timerMode, setTimerMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(timerModes.focus.seconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [calculator, setCalculator] = useState(initialCalculatorState);
  const timerDeadline = useRef<number | null>(null);
  const timerDuration = timerModes[timerMode].seconds;

  useStudyAudio(soundEnabled, soundscape, volume);

  useEffect(() => {
    if (!timerRunning) return;
    const updateRemaining = () => {
      if (timerDeadline.current === null) return;
      const nextRemaining = getRemainingTimerSeconds(timerDeadline.current, Date.now());
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        timerDeadline.current = null;
        setTimerRunning(false);
      }
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 250);
    document.addEventListener("visibilitychange", updateRemaining);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning) return;
    const originalTitle = document.title;
    document.title = `${formatTimer(remaining)} · 夜航自习室`;
    return () => { document.title = originalTitle; };
  }, [remaining, timerRunning]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExit();
        return;
      }
      if (activeTool !== "calculator" || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      const keyMap: Record<string, CalculatorKey> = {
        Enter: "=", "=": "=", "/": "÷", "*": "×", "+": "+", "-": "-", ".": ".", "%": "%",
        Backspace: "C", Delete: "C",
      };
      const key = /^\d$/.test(event.key) ? event.key as CalculatorKey : keyMap[event.key];
      if (!key) return;
      event.preventDefault();
      setCalculator((current) => pressCalculatorKey(current, key));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeTool, onExit]);

  const changeTimerMode = (mode: TimerMode) => {
    timerDeadline.current = null;
    setTimerMode(mode);
    setRemaining(timerModes[mode].seconds);
    setTimerRunning(false);
  };

  const toggleTimer = () => {
    if (timerRunning) {
      if (timerDeadline.current !== null) setRemaining(getRemainingTimerSeconds(timerDeadline.current, Date.now()));
      timerDeadline.current = null;
      setTimerRunning(false);
      return;
    }
    const nextDuration = remaining === 0 ? timerDuration : remaining;
    if (remaining === 0) setRemaining(nextDuration);
    timerDeadline.current = Date.now() + nextDuration * 1000;
    setTimerRunning(true);
  };

  return (
    <motion.section
      className={`study-area study-${atmosphere}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      aria-label="夜航自习室"
    >
      <StudyRoomCanvas atmosphere={atmosphere} />
      <div className="study-vignette" aria-hidden="true" />

      <header className="study-header">
        <button className="study-back" onClick={onExit}><ArrowLeft size={17} /> 返回岛屿</button>
        <div className="study-title">
          <p>NIGHT WATCH / 04</p>
          <h1>夜航自习室</h1>
        </div>
        <span className="study-session"><i /> 本次停泊</span>
      </header>

      <aside className="study-atmosphere" aria-label="自习氛围设置">
        <p>WINDOW LIGHT / 窗景</p>
        <div className="study-environment-options" role="group" aria-label="选择窗景">
          {atmosphereOptions.map(({ id, label, icon: Icon }) => (
            <button key={id} className={atmosphere === id ? "active" : ""} onClick={() => setAtmosphere(id)} aria-pressed={atmosphere === id}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </div>
        <div className="study-sound-row">
          <button className="study-sound-toggle" onClick={() => setSoundEnabled((current) => !current)} aria-label={soundEnabled ? "关闭背景音乐" : "播放背景音乐"} title={soundEnabled ? "关闭背景音乐" : "播放背景音乐"}>
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <label>
            <span><AudioLines size={13} /> 背景音乐</span>
            <select value={soundscape} onChange={(event) => setSoundscape(event.target.value as Soundscape)}>
              <option value="focus">低频乐流</option>
              <option value="rain">玻璃雨声</option>
              <option value="embers">炉火底噪</option>
            </select>
          </label>
        </div>
        <label className="study-volume">
          <span>音量</span>
          <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="背景音乐音量" />
          <output>{volume}</output>
        </label>
      </aside>

      <motion.section className="study-drawer" initial={{ y: 70 }} animate={{ y: 0 }} transition={{ delay: 0.25, duration: 0.55 }}>
        <header className="study-tool-tabs" role="tablist" aria-label="自习工具">
          <span>DESK UTILITIES</span>
          <button role="tab" aria-selected={activeTool === "timer"} className={activeTool === "timer" ? "active" : ""} onClick={() => setActiveTool("timer")}>
            <Timer size={15} /> 番茄钟
          </button>
          <button role="tab" aria-selected={activeTool === "calculator"} className={activeTool === "calculator" ? "active" : ""} onClick={() => setActiveTool("calculator")}>
            <Calculator size={15} /> 计算器
          </button>
          <button role="tab" aria-selected={activeTool === "writing"} className={activeTool === "writing" ? "active" : ""} onClick={() => setActiveTool("writing")}>
            <PenLine size={15} /> 写作间
          </button>
        </header>

        {activeTool === "timer" ? (
          <div className="study-timer" role="tabpanel">
            <div className="timer-modes" role="group" aria-label="计时模式">
              {(Object.keys(timerModes) as TimerMode[]).map((mode) => (
                <button key={mode} className={timerMode === mode ? "active" : ""} onClick={() => changeTimerMode(mode)}>{timerModes[mode].label}</button>
              ))}
            </div>
            <div className="timer-readout">
              <span>{timerRunning ? "IN FOCUS" : remaining === 0 ? "INTERVAL COMPLETE" : "READY"}</span>
              <strong aria-live="polite">{formatTimer(remaining)}</strong>
              <i style={{ "--timer-progress": `${(timerDuration - remaining) / timerDuration * 100}%` } as CSSProperties} />
            </div>
            <div className="timer-actions">
              <button className="timer-primary" onClick={toggleTimer} aria-label={timerRunning ? "暂停计时" : "开始计时"} title={timerRunning ? "暂停计时" : "开始计时"}>
                {timerRunning ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <button onClick={() => { timerDeadline.current = null; setRemaining(timerDuration); setTimerRunning(false); }} aria-label="重置计时" title="重置计时"><RotateCcw size={17} /></button>
            </div>
          </div>
        ) : activeTool === "calculator" ? (
          <div className="study-calculator" role="tabpanel">
            <div className="calculator-display">
              <span>{calculator.operator ? `${calculator.stored ?? ""} ${calculator.operator}` : "CALC / LOCAL"}</span>
              <output aria-live="polite">{calculator.display}</output>
            </div>
            <div className="calculator-keys">
              {calculatorKeys.map((key, index) => (
                <button
                  key={`${key}-${index}`}
                  className={`${["÷", "×", "-", "+", "="].includes(key) ? "operator" : ""} ${key === "0" ? "zero" : ""}`}
                  onClick={() => setCalculator((current) => pressCalculatorKey(current, key))}
                >{key}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="study-writing-portal" role="tabpanel">
            <div>
              <span>GWORKSPACE / WRITING STUDIO</span>
              <h2>把尚未成形的句子带回桌面。</h2>
              <p>访客进入临时写作实验台；站长登录后继续私人长文、章节与版本。</p>
            </div>
            <dl>
              <div><dt>访客</dt><dd>命题拆解 · Markdown 草稿</dd></div>
              <div><dt>站长</dt><dd>杂文 · 小说 · 版本档案</dd></div>
            </dl>
            <a href={workspaceUrl("/workspace")}>进入写作间 <PenLine size={16} /></a>
          </div>
        )}
      </motion.section>
    </motion.section>
  );
}

const scenePalettes = {
  night: { background: "#071116", fog: "#102027", ambient: "#71899c", window: "#173241", lamp: "#efad6d" },
  rain: { background: "#071318", fog: "#13272c", ambient: "#78959e", window: "#20424a", lamp: "#e8b57a" },
  dawn: { background: "#273337", fog: "#5f6b69", ambient: "#c1bca9", window: "#a88f77", lamp: "#f0c990" },
} satisfies Record<StudyAtmosphere, Record<string, string>>;

function StudyRoomCanvas({ atmosphere }: { atmosphere: StudyAtmosphere }) {
  const palette = scenePalettes[atmosphere];
  return (
    <Canvas className="study-canvas" shadows="basic" dpr={[1, 1.5]} camera={{ position: [11, 7.5, 14], fov: 42, near: 0.1, far: 80 }} gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fog, 15, 38]} />
      <StudyRoomScene atmosphere={atmosphere} palette={palette} />
    </Canvas>
  );
}

function StudyRoomScene({ atmosphere, palette }: { atmosphere: StudyAtmosphere; palette: typeof scenePalettes[StudyAtmosphere] }) {
  return (
    <>
      <ambientLight intensity={atmosphere === "dawn" ? 1.6 : 0.75} color={palette.ambient} />
      <directionalLight castShadow position={[-4, 9, 5]} intensity={atmosphere === "dawn" ? 3.2 : 1.2} color={palette.ambient} shadow-mapSize={[1024, 1024]} />
      <pointLight castShadow position={[1.5, 4.2, 2.4]} color={palette.lamp} intensity={8} distance={13} decay={2} />
      <StudyCamera />
      <StudyRoomGeometry palette={palette} atmosphere={atmosphere} />
      <Sparkles count={atmosphere === "rain" ? 18 : 42} scale={[14, 5, 9]} position={[0, 3, 0]} size={1.2} speed={0.12} opacity={0.22} color={atmosphere === "dawn" ? "#f0d3ae" : "#c8d8d2"} />
    </>
  );
}

function StudyCamera() {
  const targetPosition = useMemo(() => new THREE.Vector3(7.4, 5.25, 8.7), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 1.25, 0.4), []);
  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetPosition, 1 - Math.pow(0.015, delta));
    camera.lookAt(lookTarget);
  });
  return null;
}

function StudyRoomGeometry({ palette, atmosphere }: { palette: typeof scenePalettes[StudyAtmosphere]; atmosphere: StudyAtmosphere }) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.04}><planeGeometry args={[24, 20]} /><meshStandardMaterial color="#27342f" roughness={0.94} /></mesh>
      <mesh receiveShadow position={[0, 3.2, -4.2]}><boxGeometry args={[16, 6.5, 0.28]} /><meshStandardMaterial color="#273338" roughness={0.9} /></mesh>
      <mesh receiveShadow position={[-7.9, 3.2, 1]}><boxGeometry args={[0.28, 6.5, 11]} /><meshStandardMaterial color="#202d2e" roughness={0.94} /></mesh>

      <group position={[1.5, 3.25, -4.02]}>
        <mesh><planeGeometry args={[7.2, 3.7]} /><meshStandardMaterial color={palette.window} emissive={palette.window} emissiveIntensity={atmosphere === "dawn" ? 1.5 : 0.75} /></mesh>
        <mesh position-y={1.95}><boxGeometry args={[7.7, 0.18, 0.2]} /><meshStandardMaterial color="#121d20" /></mesh>
        <mesh position-y={-1.95}><boxGeometry args={[7.7, 0.18, 0.2]} /><meshStandardMaterial color="#121d20" /></mesh>
        <mesh position-x={-3.7}><boxGeometry args={[0.18, 4, 0.2]} /><meshStandardMaterial color="#121d20" /></mesh>
        <mesh position-x={3.7}><boxGeometry args={[0.18, 4, 0.2]} /><meshStandardMaterial color="#121d20" /></mesh>
        <mesh><boxGeometry args={[0.12, 3.8, 0.2]} /><meshStandardMaterial color="#142126" /></mesh>
        {atmosphere === "rain" && <WindowRain />}
        {atmosphere === "night" && <WindowStars />}
      </group>

      <group position={[0, 0, 0.7]}>
        <mesh castShadow receiveShadow position-y={1.45}><boxGeometry args={[6.4, 0.3, 2.5]} /><meshStandardMaterial color="#695644" roughness={0.72} /></mesh>
        {[-2.7, 2.7].map((x) => <mesh key={x} castShadow position={[x, 0.65, 0]}><boxGeometry args={[0.24, 1.55, 2]} /><meshStandardMaterial color="#443b34" /></mesh>)}
        <mesh castShadow position={[0.2, 1.82, 0.15]} rotation-x={-0.12}><boxGeometry args={[2.2, 0.08, 1.45]} /><meshStandardMaterial color="#d9d2ba" roughness={0.9} /></mesh>
        <mesh castShadow position={[-1.8, 1.82, 0.15]}><cylinderGeometry args={[0.34, 0.29, 0.62, 14]} /><meshStandardMaterial color="#7f8d7c" roughness={0.8} /></mesh>
        <group position={[2.05, 1.6, -0.35]} rotation-z={-0.18}>
          <mesh castShadow position-y={1.05}><cylinderGeometry args={[0.07, 0.1, 2.1, 8]} /><meshStandardMaterial color="#b88a5d" metalness={0.35} /></mesh>
          <mesh castShadow position={[0, 2.05, 0]} rotation-z={0.18}><coneGeometry args={[0.62, 0.72, 12, 1, true]} /><meshStandardMaterial color="#d8a66e" emissive={palette.lamp} emissiveIntensity={0.65} side={THREE.DoubleSide} /></mesh>
        </group>
        {[0, 1, 2].map((index) => <mesh key={index} castShadow position={[-2.35 + index * 0.18, 1.82 + index * 0.13, -0.65]} rotation-y={0.08}><boxGeometry args={[1.45, 0.18, 0.58]} /><meshStandardMaterial color={["#755449", "#445f61", "#8b7753"][index]} /></mesh>)}
      </group>

      <group position={[0, 0, 3.2]}>
        <mesh castShadow position-y={0.72}><boxGeometry args={[2.2, 0.24, 2.1]} /><meshStandardMaterial color="#3d4b48" /></mesh>
        <mesh castShadow position={[0, 1.65, 0.85]} rotation-x={-0.2}><boxGeometry args={[2.2, 1.8, 0.22]} /><meshStandardMaterial color="#35413f" /></mesh>
      </group>
    </group>
  );
}

function WindowStars() {
  const points = useMemo(() => {
    const positions = new Float32Array(54 * 3);
    for (let index = 0; index < 54; index += 1) {
      positions[index * 3] = (Math.sin(index * 31.7) * 0.5 + 0.5) * 6.6 - 3.3;
      positions[index * 3 + 1] = (Math.sin(index * 17.3 + 2) * 0.5 + 0.5) * 3.2 - 1.6;
      positions[index * 3 + 2] = 0.04;
    }
    return positions;
  }, []);
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry><pointsMaterial color="#e8e0bc" size={0.035} transparent opacity={0.75} /></points>;
}

function WindowRain() {
  const rain = useRef<THREE.LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(72 * 6);
    for (let index = 0; index < 72; index += 1) {
      const x = (Math.sin(index * 28.1) * 0.5 + 0.5) * 6.8 - 3.4;
      const y = (Math.sin(index * 13.7 + 1) * 0.5 + 0.5) * 3.5 - 1.75;
      values.set([x, y, 0.05, x - 0.07, y - 0.25, 0.05], index * 6);
    }
    return values;
  }, []);
  useFrame(({ clock }) => {
    if (rain.current) rain.current.position.y = -((clock.elapsedTime * 0.38) % 0.28);
  });
  return <lineSegments ref={rain}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#aac6ca" transparent opacity={0.48} /></lineSegments>;
}

function useStudyAudio(enabled: boolean, soundscape: Soundscape, volume: number) {
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const context = new AudioContext();
    const master = context.createGain();
    const sources: AudioScheduledSourceNode[] = [];
    gainRef.current = master;
    master.gain.value = 0;
    master.connect(context.destination);

    const addTone = (frequency: number, type: OscillatorType, level: number) => {
      const oscillator = context.createOscillator();
      const toneGain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      toneGain.gain.value = level;
      oscillator.connect(toneGain).connect(master);
      oscillator.start();
      sources.push(oscillator);
    };

    const addNoise = (frequency: number, level: number) => {
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = frequency;
      noiseGain.gain.value = level;
      source.connect(filter).connect(noiseGain).connect(master);
      source.start();
      sources.push(source);
    };

    if (soundscape === "focus") {
      addTone(82.4, "sine", 0.7);
      addTone(123.5, "triangle", 0.18);
    }
    if (soundscape === "rain") addNoise(1300, 0.58);
    if (soundscape === "embers") {
      addTone(65.4, "sine", 0.5);
      addNoise(360, 0.16);
    }

    return () => {
      gainRef.current = null;
      sources.forEach((source) => source.stop());
      void context.close();
    };
  }, [enabled, soundscape]);

  useEffect(() => {
    const gain = gainRef.current;
    if (!gain) return;
    gain.gain.setTargetAtTime(volume / 100 * 0.055, gain.context.currentTime, 0.03);
  }, [volume, enabled, soundscape]);
}
