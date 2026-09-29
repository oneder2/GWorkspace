"use client";

import { useEffect, useRef } from 'react';
import type { ExhibitSlot, MuseumPlan } from '@/lib/exhibition';

const representativeWorks = ['citeai', 'vana', 'oceannect'];

export function MuseumGuide({ plan, kind, onVisit, onClose }: { plan: MuseumPlan; kind: string; onVisit: (slot: ExhibitSlot) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const projects = kind === 'workshop';
  const featured = projects ? representativeWorks.flatMap(key => plan.slots.filter(slot => slot.exhibit?.sourceKey === key)) : [];
  return <dialog ref={dialog} className="museum-catalog-dialog museum-guide" aria-label="参观指南" onCancel={onClose} onClose={onClose}>
    <header><div><small>{projects ? '作品如何解决问题' : '从一个念头到一篇文章'}</small><h2>{projects ? '从一件作品开始' : '选一篇，慢慢读'}</h2></div><button onClick={onClose}>关闭指南</button></header>
    <p>{projects ? '先看它用来做什么，再看我的参与与实现。驻足时可以转动模型、观看示意演示，最后打开真实作品。' : '长文按主题分室，模型随阅读逐步展开。每日赠语有独立的停留区；全文始终在 GWorkspace。'}</p>
    {featured.length > 0 && <section aria-label="代表作品">{featured.map(slot => <article key={slot.id}><h3>{slot.exhibit!.title}</h3><p>{slot.exhibit!.summary}</p><button onClick={() => onVisit(slot)}>观看 {slot.exhibit!.title.split(' - ')[0]}</button></article>)}</section>}
    <details open={!featured.length}><summary>全部展室 · {plan.slots.length} 件内容</summary>{plan.rooms.map(room => <section key={room.id}><h3>{room.title}</h3><ul>{plan.slots.slice(room.startIndex, room.startIndex + room.count).map(slot => <li key={slot.id}><button onClick={() => onVisit(slot)}>{slot.exhibit!.title}</button></li>)}</ul></section>)}</details>
    {!plan.slots.length && <p>这里还没有公开内容，可以返回中央岛继续探索。</p>}
    <p className="guide-note">也可以关闭指南自由漫步，靠近展品后按 E。{projects ? '模型演示是功能示意，真实项目从展签打开。' : '在展签中了解篇章，再打开原文继续阅读。'}</p>
  </dialog>;
}
