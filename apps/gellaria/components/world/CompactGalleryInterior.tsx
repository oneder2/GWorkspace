"use client";

import type { MuseumPlan } from '@/lib/exhibition';
import type { MuseumTheme } from '@/lib/museum-theme';
import { Block, SightlineCutaway } from './MuseumArchitecture';

// Open at the camera side, solid at the far side. Roof structure frames the
// gallery without an opaque lid; only perimeter elements can cross sightlines.
export function CompactGalleryInterior({ plan, palette }: { plan: MuseumPlan; palette: MuseumTheme }) {
  const shell = plan.shell!;
  const archive = palette.layout === 'archive';
  const centerZ = (shell.frontZ + shell.backZ) / 2;
  const timber = '#756557', copper = '#ab8263';
  const trim = archive ? timber : copper;
  return <group name="compact-gallery-shell">
    <Block at={[0, -.18, centerZ]} size={[shell.width, .3, plan.length]} color={palette.floor}/>
    {/* A narrow central shortcut joins the cross-aisles of the three clusters. */}
    {[-1.3, 1.3].map(x => <Block key={x} at={[x, -.02, centerZ]} size={[.035, .018, plan.length - .8]} color={trim} metal={archive ? 0 : .6}/>)}
    {plan.rooms.filter(room => room.count && room.kind !== 'daily-signal').map(room => <group key={room.id}>
      <Block at={[room.centerX || 0, -.022, room.centerZ]} size={[room.width - .65, .018, room.depth - .55]} color={archive ? '#666c77' : '#768383'}/>
      {/* A low, shared material field groups independent objects without walls. */}
      {!archive && [-1, 1].map(side => <Block key={side} at={[(room.centerX || 0) + side * (room.width / 2 - .45), -.006, room.centerZ]} size={[.028, .016, room.depth - .7]} color={copper} metal={.65}/>)}
    </group>)}
    {plan.furnishings?.map(item => <SightlineCutaway key={item.id}>
      <group name={item.id} position={[item.position[0], 0, item.position[1]]}>
        {item.kind === 'reading-bench' ? <>
          <Block at={[0, item.height - .1, 0]} size={[item.size[0], .2, item.size[1]]} color={timber}/>
          {[-.9, .9].map(x => <Block key={x} at={[x, .25, 0]} size={[.16, .5, .54]} color={palette.dark}/>)}
          <Block at={[0, item.height + .01, -.24]} size={[2.3, .015, .025]} color={palette.accent}/>
        </> : <>
          <Block at={[0, item.height / 2, 0]} size={[item.size[0], item.height, item.size[1]]} color={timber}/>
          <Block at={[0, item.height - .17, 0]} size={[item.size[0] + .01, .025, item.size[1] + .01]} color={palette.accent}/>
          <Block at={[0, .2, 0]} size={[item.size[0] + .01, .22, item.size[1] + .01]} color={palette.dark}/>
        </>}
      </group>
    </SightlineCutaway>)}
    <SightlineCutaway>
      <Block at={[0, 2.15, shell.backZ + .12]} size={[shell.width, 4.3, .24]} color={palette.wall}/>
      <Block at={[0, .3, shell.backZ + .27]} size={[shell.width, .6, .15]} color={trim}/>
      <Block at={[0, 3.45, shell.backZ + .27]} size={[shell.width - 1.2, .04, .04]} color={palette.accent} glow/>
      {[-6.2, -2.7, 2.7, 6.2].map(x => <group key={x}>
        <Block at={[x, 2.12, shell.backZ + .27]} size={[2.7, 2.1, .08]} color={archive ? '#455269' : '#56676c'}/>
        {archive ? [0, 1, 2].map(row => <group key={row}>
          <Block at={[x, .95 + row * .67, shell.backZ + .43]} size={[2.65, .07, .36]} color={timber}/>
          {Array.from({ length: 7 }, (_, i) => <Block key={i} at={[x - .98 + i * .32, 1.2 + row * .67, shell.backZ + .43]} size={[.18, .4 + i % 2 * .07, .23]} color={i % 3 ? palette.paper : trim}/>)}
        </group>) : [-.82, 0, .82].map(dx => <Block key={dx} at={[x + dx, 2.12, shell.backZ + .35]} size={[.035, 1.5, .035]} color={copper} metal={.7}/>)}
      </group>)}
    </SightlineCutaway>
    {[-1, 1].map(side => <group key={side}>
      <SightlineCutaway>
        <Block at={[side * (shell.width / 2 - .12), 1.35, centerZ]} size={[.24, 2.7, plan.length]} color={palette.wall}/>
        <Block at={[side * (shell.width / 2 - .27), .44, centerZ]} size={[.08, .16, plan.length - .6]} color={trim}/>
        <Block at={[side * (shell.width / 2 - .12), 4.3, centerZ]} size={[.3, .22, plan.length]} color={trim} metal={archive ? 0 : .5}/>
        {[shell.frontZ - .4, centerZ, shell.backZ + .4].map(z => <Block key={z} at={[side * (shell.width / 2 - .12), 2.15, z]} size={[.24, 4.3, .24]} color={trim}/>)}
      </SightlineCutaway>
      {/* Clerestory ends, no full roof or repeated doorway partitions. */}
      <SightlineCutaway><Block at={[side * 6.7, 4.3, shell.backZ + .4]} size={[5.2, .18, .28]} color={trim}/></SightlineCutaway>
    </group>)}
    {/* Entrance threshold and small invitation lights replace corridor rails. */}
    <Block at={[0, -.015, shell.frontZ - .6]} size={[3.6, .025, .75]} color={trim}/>
    {[-1.3, 1.3].map(x => <Block key={x} at={[x, .01, shell.frontZ - .7]} size={[.06, .025, .35]} color={palette.accent} glow/>)}
  </group>;
}
