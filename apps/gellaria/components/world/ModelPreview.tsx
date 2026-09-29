"use client";
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { artifactSpecSchema, type ArtifactSpec } from '@/lib/artifact';
import { BoundArtifact } from './exhibits/BoundArtifact';
import { workspaceUrl } from '@/lib/workspace-url';

// Only recipes (never auth tokens) cross this frame boundary. The same renderer
// is used here and in the exhibition, including restored historical recipes.
export function ModelPreview() {
  const [spec, setSpec] = useState<ArtifactSpec | null>(null);
  useEffect(() => {
    const origins = new Set([window.location.origin, new URL(workspaceUrl('/')).origin]);
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || !origins.has(event.origin) || event.data?.type !== 'gellaria:model-preview') return;
      const parsed = artifactSpecSchema.safeParse(event.data.spec);
      if (parsed.success) setSpec(parsed.data);
      window.parent.postMessage({ type: parsed.success ? 'gellaria:preview-loaded' : 'gellaria:preview-invalid' }, event.origin);
    };
    window.addEventListener('message', receive);
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : window.location.origin;
    if (origins.has(parentOrigin)) window.parent.postMessage({ type: 'gellaria:preview-ready' }, parentOrigin);
    return () => window.removeEventListener('message', receive);
  }, []);
  return <main style={{ height: '100dvh', background: '#10222e', color: '#d9ded2' }} aria-label="展品模型预览">
    {spec ? <Canvas camera={{ position: [2.6, 1.9, 3.2], fov: 40 }} dpr={[1, 1.5]}><color attach="background" args={['#10222e']}/><ambientLight intensity={1.4}/><directionalLight position={[3, 5, 4]} intensity={3}/><BoundArtifact spec={spec} active={false} writing={spec.design?.tier === 'reading'}/><OrbitControls target={[0, .65, 0]} minDistance={2} maxDistance={7} enablePan={false}/></Canvas> : <p style={{ padding: 24 }}>等待从管理后台载入模型。</p>}
  </main>;
}
