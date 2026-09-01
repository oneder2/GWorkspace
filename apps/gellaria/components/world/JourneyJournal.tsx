"use client";

import { motion } from "motion/react";
import { BookOpen, Check, LockKeyhole, Orbit, X } from "lucide-react";
import type { CSSProperties } from "react";
import { landmarks, role } from "@/lib/content";
import { isJourneyComplete } from "@/lib/journey";

type JournalProps = {
  discovered: string[];
  collected: string[];
  onClose: () => void;
};

export function JourneyJournal({ discovered, collected, onClose }: JournalProps) {
  const complete = isJourneyComplete(collected, landmarks.map((landmark) => landmark.id));

  return (
    <motion.div className="journal-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="journal-sheet"
        initial={{ y: 24, scale: 0.985 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, opacity: 0 }}
        aria-label="制图师日志"
      >
        <button className="panel-close icon-button" onClick={onClose} aria-label="关闭制图日志"><X size={19} /></button>
        <header className="journal-heading">
          <p className="eyebrow"><BookOpen size={13} /> CARTOGRAPHER&apos;S FIELD NOTES</p>
          <h2>制图师日志</h2>
          <p>{role.description}</p>
        </header>

        <div className="journal-progress" aria-label={`已收录 ${collected.length} 件遗物`}>
          <strong>{String(collected.length).padStart(2, "0")}</strong>
          <span>/ {String(landmarks.length).padStart(2, "0")} 件遗物已收录</span>
          <i style={{ "--progress": `${collected.length / landmarks.length * 100}%` } as CSSProperties} />
        </div>

        <div className="journal-entries">
          {landmarks.map((landmark, index) => {
            const surveyed = discovered.includes(landmark.id);
            const archived = collected.includes(landmark.id);
            return (
              <article className={`journal-entry ${archived ? "archived" : surveyed ? "surveyed" : "unknown"}`} key={landmark.id}>
                <span className="journal-entry-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p style={{ color: surveyed ? landmark.accent : undefined }}>{surveyed ? landmark.kicker : "UNSURVEYED / 未测绘"}</p>
                  <h3>{surveyed ? landmark.name : "坐标尚未显影"}</h3>
                  <span>{archived ? landmark.artifact : surveyed ? "遗物等待收录" : "沿发光小径亲自抵达"}</span>
                </div>
                <span className="journal-entry-state" aria-label={archived ? "已收录" : surveyed ? "已测绘" : "未发现"}>
                  {archived ? <Check size={18} /> : surveyed ? <Orbit size={18} /> : <LockKeyhole size={16} />}
                </span>
              </article>
            );
          })}
        </div>

        <footer className="journal-footer">
          <span>{complete ? "星图闭合于本次来访" : `还有 ${landmarks.length - collected.length} 件遗物散落在岛上`}</span>
          <strong>{complete ? "CHART COMPLETE" : "WORLD 001"}</strong>
        </footer>
      </motion.section>
    </motion.div>
  );
}

export function CompletionMoment({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="completion-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="completion-copy" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 12, opacity: 0 }}>
        <div className="completion-orbit" aria-hidden="true"><i /><i /><i /><span /></div>
        <p className="eyebrow">THREE RELICS / ONE CHART</p>
        <h2>星图闭合。</h2>
        <p>齿轮、坐标薄片与回声种子在营地上空彼此定位。你带走的不是纪念品，而是一种看待这个世界的顺序。</p>
        <button className="enter-button" onClick={onClose}>带着星图继续漫游</button>
      </motion.section>
    </motion.div>
  );
}
