"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ExhibitSlot } from '@/lib/exhibition';
import { useMotionPreference } from '@/lib/use-motion-preference';

export const InspectionContext = createContext({ artifactId: '', step: 0 });
export const useInspection = () => useContext(InspectionContext);
export const interactionSteps: Record<string, { action: string; steps: string[] }> = {
  'citation-bench': { action: '追踪一次引用', steps: ['送入需要引用的论断', '汇集证据并通过检索透镜', '将引用写回文档'] },
  'offline-vault': { action: '打开一份离线文档', steps: ['打开本地文档抽屉', '连接同步环，保留本地副本', '导出独立的文档页'] },
  'memory-bridge': { action: '连接两个人的记忆', steps: ['点亮两端的伴侣节点', '沿共享时间线传递记忆', '将共同经历留在桥上'] },
};
export type ViewMove = { action: 'left' | 'right' | 'up' | 'down' | 'in' | 'out'; sequence: number };
export function InspectionCamera({ slot, move }: { slot: ExhibitSlot; move: ViewMove | null }) {
  const camera = useThree(state => state.camera);
  const reduced = useMotionPreference();
  const [settled, setSettled] = useState(false);
  const time = useRef(0);
  const target = useMemo(() => new THREE.Vector3(slot.position[0], slot.kind === 'blog-constellation' || slot.kind === 'daily-signal' ? 1.65 : 1.35, slot.position[2]), [slot]);
  const destination = useMemo(() => target.clone().add(new THREE.Vector3(slot.position[0] < 0 ? 2.6 : -2.6, 1.1, 1.8)), [slot, target]);
  useEffect(() => {
    if (!move) return;
    const offset = camera.position.clone().sub(target), spherical = new THREE.Spherical().setFromVector3(offset);
    if (move.action === 'left') spherical.theta -= Math.PI / 8;
    if (move.action === 'right') spherical.theta += Math.PI / 8;
    if (move.action === 'up') spherical.phi -= .15;
    if (move.action === 'down') spherical.phi += .15;
    if (move.action === 'in') spherical.radius *= .8;
    if (move.action === 'out') spherical.radius *= 1.25;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, .25, Math.PI / 2 - .04);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, 2.2, 6);
    camera.position.copy(target).add(offset.setFromSpherical(spherical)); camera.lookAt(target);
  }, [move, camera, target]);
  useFrame(({ camera }, delta) => {
    if (settled) return;
    time.current += delta;
    camera.position.lerp(destination, reduced ? 1 : 1 - Math.exp(-delta * 5)); camera.lookAt(target);
    if (reduced || time.current > 1.1) setSettled(true);
  });
  return <><object3D name="museum-inspection-target" position={target}/>{settled && <OrbitControls makeDefault target={target} enablePan={false} minDistance={2.2} maxDistance={6} minPolarAngle={.25} maxPolarAngle={Math.PI / 2 - .04} enableDamping={!reduced}/>}</>;
}
export function InspectionPanel({ slot, step, onStep, onReset, onMove, onClose, onRead }: { slot: ExhibitSlot; step: number; onStep: (step: number) => void; onReset: () => void; onMove: (action: ViewMove['action']) => void; onClose: () => void; onRead: () => void }) {
  const panel = useRef<HTMLElement>(null), recipe = slot.exhibit?.artifactSpec?.design;
  const interaction = recipe ? interactionSteps[recipe.motif] : null;
  useEffect(() => {
    const element = panel.current, parent = element?.parentElement;
    if (!element || !parent) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.focus();
    const observer = new ResizeObserver(() => parent.style.setProperty('--inspection-height', `${element.getBoundingClientRect().height + 48}px`));
    observer.observe(element);
    return () => { observer.disconnect(); parent.style.removeProperty('--inspection-height'); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <aside ref={panel} tabIndex={-1} className="museum-inspection" aria-label="驻足观看">
    <div><small>驻足观看 · 拖动旋转 / 双指缩放</small><h2>{slot.exhibit?.title}</h2><p aria-live="polite">{interaction && step ? interaction.steps[step - 1] : recipe?.rationale || slot.exhibit?.summary}</p></div>
    <div className="inspection-actions">{interaction && <button onClick={() => onStep(step >= interaction.steps.length ? 0 : step + 1)}>{step === 0 ? interaction.action : step >= interaction.steps.length ? '重置演示' : '继续演示'}{step > 0 && ` · ${step}/${interaction.steps.length}`}</button>}<button onClick={onReset}>重置视角</button><button onClick={onRead}>阅读展签</button><button onClick={onClose}>继续漫步 <kbd>Esc</kbd></button></div>
    <details className="inspection-camera-controls"><summary>视角控制</summary><div className="inspection-actions">{([['left', '向左旋转'], ['right', '向右旋转'], ['up', '升高视角'], ['down', '降低视角'], ['in', '拉近'], ['out', '拉远']] as const).map(([action, label]) => <button key={action} onClick={() => onMove(action)}>{label}</button>)}</div></details>
  </aside>;
}
