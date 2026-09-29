"use client";

import { Html } from "@react-three/drei";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { studySeats } from "@/lib/study-presence";
import type { SpiritAppearance } from "@/lib/spirit-identity";
import { SpiritTraveler, type SpiritMotion } from "./SpiritTraveler";
import { useWorldStore } from "./store";

function SeatedSpirit({ appearance }: { appearance: SpiritAppearance }) {
  const motion = useRef<SpiritMotion>({ speed: 0, stride: 0 });
  return <group scale={.78}><SpiritTraveler appearance={appearance} motion={motion} /></group>;
}

export function StudyParticipants() {
  const self = useWorldStore((state) => state.playerAppearance);
  const companions = useWorldStore(useShallow((state) => Array.from({ length: 5 }, (_, i) => state.players[state.studyCompanionIds[i] ?? ""])));
  return <group>
    {studySeats.map((seat, i) => {
      const player = i ? companions[i - 1] : undefined;
      const occupied = i === 0 || Boolean(player);
      const label = i === 0 ? "你" : player ? `旅人 ${player.id.slice(0, 4).toUpperCase()}` : "空位";
      return <group key={i} position={seat.position}>
        {occupied && <group rotation-y={seat.rotation}><SeatedSpirit appearance={i === 0 ? self : player?.appearance ?? { palette: 0, form: 0 }} /></group>}
        <Html center position={[0, occupied ? 2 : .45, 0]} zIndexRange={[2, 0]} className={`study-seat-label${i === 0 ? " is-self" : ""}${occupied ? "" : " is-empty"}`}>
          <span data-study-seat={i} data-player-id={i === 0 ? "self" : player?.id ?? ""} aria-label={`座位 ${i + 1}：${label}`}><small>{String(i + 1).padStart(2, "0")}</small>{label}</span>
        </Html>
      </group>;
    })}
  </group>;
}
