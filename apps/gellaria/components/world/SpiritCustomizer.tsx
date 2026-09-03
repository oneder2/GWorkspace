"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { AnimatePresence, motion } from "motion/react";
import { Cloud, CloudOff, LogIn, Palette, Save, Unlink, X } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { spiritForms, spiritPalettes, type SpiritAppearance } from "@/lib/spirit-identity";
import type { AvatarSyncState } from "@/lib/use-gworkspace-avatar";
import type { GWorkspaceAvatarUser } from "@/lib/gworkspace-avatar";
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
import { useWorldStore } from "./store";

const formNames = ["光环", "彗星", "新芽"];

type SpiritCustomizerProps = {
  open: boolean;
  user: GWorkspaceAvatarUser | null;
  syncState: AvatarSyncState;
  connectHref: string;
  onSave: (appearance: SpiritAppearance) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onClose: () => void;
};

export function SpiritCustomizer({ open, user, syncState, connectHref, onSave, onDisconnect, onClose }: SpiritCustomizerProps) {
  return (
    <AnimatePresence>
      {open && <SpiritCustomizerPanel user={user} syncState={syncState} connectHref={connectHref} onSave={onSave} onDisconnect={onDisconnect} onClose={onClose} />}
    </AnimatePresence>
  );
}

function SpiritCustomizerPanel({ user, syncState, connectHref, onSave, onDisconnect, onClose }: Omit<SpiritCustomizerProps, "open">) {
  const appearance = useWorldStore((state) => state.playerAppearance);
  const setAppearance = useWorldStore((state) => state.setPlayerAppearance);
  const [draft, setDraft] = useState(appearance);
  const [initial] = useState(appearance);
  const motionState = useRef<SpiritMotion>({ speed: 0, stride: 0 });

  const update = (next: SpiritAppearance) => {
    setDraft(next);
    setAppearance(next);
  };
  const cancel = () => {
    setAppearance(initial);
    onClose();
  };
  const save = async () => {
    await onSave(draft);
    onClose();
  };
  const connect = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const destination = new URL(connectHref);
    destination.searchParams.set("return", `${window.location.origin}${window.location.pathname}`);
    window.location.assign(destination.toString());
  };

  return (
        <motion.div className="spirit-customizer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section className="spirit-customizer" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.985 }} aria-label="灵体形象校准台">
            <button className="spirit-customizer-close" onClick={cancel} aria-label="关闭形象编辑器"><X size={19} /></button>
            <div className="spirit-preview">
              <Canvas camera={{ position: [0, 1.7, 5.2], fov: 34 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={1.8} color="#cadbd4" />
                <directionalLight position={[3, 5, 4]} intensity={2.7} color="#ffe0ba" />
                <pointLight position={[-2, 1.8, 2]} intensity={2.2} color={spiritPalettes[draft.palette].glow} />
                <group position={[0, -0.72, 0]} scale={1.08}><SpiritTraveler appearance={draft} motion={motionState} /></group>
                <Environment preset="night" />
              </Canvas>
              <div className="spirit-preview-coordinate"><span>CALIBRATION / 01</span><i /><span>LIVE FORM</span></div>
            </div>

            <div className="spirit-controls">
              <header><p>SPIRIT CALIBRATION / 灵体校准</p><h2>调整你在世界中的形态</h2></header>
              <div className="spirit-account-state">
                {user ? <Cloud size={15} /> : <CloudOff size={15} />}
                <span>{user ? `${user.username} · ${syncState === "connecting" ? "正在同步" : "GWorkspace 已连接"}` : "访客形态 · 保存在此浏览器"}</span>
              </div>

              <fieldset className="spirit-field">
                <legend><Palette size={14} /> 核心光谱</legend>
                <div className="spirit-swatches">
                  {spiritPalettes.map((palette, index) => <button key={palette.glow} className={draft.palette === index ? "active" : ""} onClick={() => update({ ...draft, palette: index })} aria-label={`选择光谱 ${index + 1}`} title={`光谱 ${index + 1}`}><i style={{ background: palette.body }} /><span style={{ background: palette.glow }} /></button>)}
                </div>
              </fieldset>

              <fieldset className="spirit-field">
                <legend>漂浮冠饰</legend>
                <div className="spirit-form-options">
                  {spiritForms.map((form, index) => <button key={form} className={draft.form === index ? "active" : ""} onClick={() => update({ ...draft, form: index })}><span>{formNames[index]}</span><small>{form.toUpperCase()}</small></button>)}
                </div>
              </fieldset>

              <footer>
                {user ? <button className="spirit-account-action" onClick={() => void onDisconnect()} title="断开 GWorkspace"><Unlink size={16} /><span>断开</span></button> : <a className="spirit-account-action" href={connectHref} onClick={connect}><LogIn size={16} /><span>连接档案</span></a>}
                <button className="spirit-save" onClick={() => void save()} disabled={syncState === "connecting"}><Save size={16} />{syncState === "connecting" ? "同步中" : "保存形象"}</button>
              </footer>
            </div>
          </motion.section>
        </motion.div>
  );
}
