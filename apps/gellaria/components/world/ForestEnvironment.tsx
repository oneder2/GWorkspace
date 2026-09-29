"use client";

import { useEffect, useMemo } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { forestColors as colors, forestTrees, forestTreeVisible, randomUnit, forestPathX, FOREST_PERIOD } from '@/lib/echo-forest';
import { treeSkeleton, seededRandom } from '@/lib/forest-generation';
import { SightlineCutaway } from './MuseumArchitecture';

function merge(parts: THREE.BufferGeometry[]) {
  const geometry = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  return geometry;
}
function branchGeometry(from: THREE.Vector3, to: THREE.Vector3, radius: number, topRadius = radius * .56) {
  const direction = to.clone().sub(from);
  return new THREE.CylinderGeometry(topRadius, radius, direction.length(), 7, 2)
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()))
    .translate(...from.clone().add(to).multiplyScalar(.5).toArray());
}
function DetailedTree({ tree, index }: { tree: typeof forestTrees[number]; index: number }) {
  const geometries = useMemo(() => {
    const skeleton = treeSkeleton(index + 107, tree.height, tree.radius), random = seededRandom(index + 567);
    const wood = merge(skeleton.branches.map(b => branchGeometry(new THREE.Vector3(...b.from), new THREE.Vector3(...b.to), b.radius, b.topRadius)));
    // Longitudinal bark ridges, baked into vertex colors rather than extra meshes.
    const barkColors: number[] = [], barkPosition = wood.getAttribute('position'), bark = new THREE.Color();
    for (let i = 0; i < barkPosition.count; i++) {
      const x = barkPosition.getX(i), y = barkPosition.getY(i), z = barkPosition.getZ(i);
      const ridge = .65 + .25 * Math.sin(Math.atan2(z, x) * 17 + Math.sin(y * 1.7) * .6);
      bark.setRGB(ridge, ridge * .95, ridge * .8); barkColors.push(bark.r, bark.g, bark.b);
    }
    wood.setAttribute('color', new THREE.Float32BufferAttribute(barkColors, 3));
    const leaves: THREE.BufferGeometry[] = [];
    // Small individual lenticular leaves, clustered at twig tips, not solid canopy balls.
    skeleton.tips.forEach(tip => {
      for (let j = 0; j < 9; j++) {
        const a = j * 2.399963 + random(), spread = Math.sqrt((j + 1) / 9) * .68;
        leaves.push(new THREE.SphereGeometry(1, 5, 3).scale(.27 + random() * .2, .065, .16 + random() * .12)
          .rotateZ((random() - .5) * 1.5).rotateY(a)
          .translate(tip[0] + Math.cos(a) * spread, tip[1] + (random() - .5) * .42, tip[2] + Math.sin(a) * spread));
      }
    });
    return { wood, leaves: merge(leaves) };
  }, [tree, index]);
  useEffect(() => () => { geometries.wood.dispose(); geometries.leaves.dispose(); }, [geometries]);
  return <group position={tree.position}><SightlineCutaway>
    <mesh geometry={geometries.wood} castShadow receiveShadow><meshStandardMaterial color={index % 3 ? '#8b8c74' : '#b0aa8e'} vertexColors roughness={.94}/></mesh>
    <mesh geometry={geometries.leaves} castShadow receiveShadow><meshStandardMaterial color={index % 3 ? '#507357' : '#739376'} emissive='#314735' emissiveIntensity={.2} roughness={.85}/></mesh>
  </SightlineCutaway></group>;
}

function Undergrowth() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [], random = seededRandom(7834);
    for (let i = 0; i < 110; i++) {
      const x = (i % 2 ? 1 : -1) * (3.6 + random() * 10), z = 5 - random() * 43;
      // Fern rosettes use tapered, opposing pinnae; all below the echo reading band.
      for (let frond = 0; frond < 5; frond++) {
        const a = frond * 2.399963 + random(), length = .45 + random() * .5;
        for (let step = 1; step <= 5; step++) for (const side of [-1, 1]) {
          const t = step / 6, spread = .12 * Math.sin(t * Math.PI);
          parts.push(new THREE.SphereGeometry(1, 4, 2).scale(.035, .017, spread)
            .rotateY(a + side * .55).rotateX(.2)
            .translate(x + Math.cos(a) * length * t + Math.sin(a) * side * spread * .45, .08 + Math.sin(t * Math.PI * .8) * length * .46, z + Math.sin(a) * length * t - Math.cos(a) * side * spread * .45));
        }
      }
    }
    return merge(parts);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color='#477362' roughness={1}/></mesh>;
}

function Floor() {
  const geometry = useMemo(() => {
    const ground = new THREE.PlaneGeometry(80, FOREST_PERIOD, 128, 96).rotateX(-Math.PI / 2).translate(0, -.14, -17);
    const positions = ground.getAttribute('position'), color = new THREE.Color(), shades: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i), edge = THREE.MathUtils.smoothstep(Math.abs(x), 3, 12);
      const periodicZ = (z - 7) / FOREST_PERIOD * Math.PI * 2;
      const noise = Math.sin(x * 1.1 + periodicZ * 3) * Math.cos(periodicZ * 5) * .5 + Math.sin(x * 2.4 - periodicZ * 7) * .2;
      positions.setY(i, -.14 + edge * (.15 + noise * .23));
      color.set('#23473f').lerp(new THREE.Color('#416357'), .4 + noise * .35); shades.push(color.r, color.g, color.b);
    }
    ground.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3)); ground.computeVertexNormals();
    return ground;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>;
}

function ForestTile({ variant }: { variant: number }) {
  return <group>
    <Floor/><Undergrowth/>
    {forestTrees.map((tree, i) => forestTreeVisible(tree, i, variant) && <DetailedTree key={i} tree={tree} index={i}/>)}
    {Array.from({ length: 24 }, (_, i) => <group key={i} position={[forestPathX(6 - i * 2), -.02, 6 - i * 2]}>
      {[-1, 1].map(side => <group key={side} position={[side * (1.7 + randomUnit(`edge:${i}`) * .5), 0, side * .4]}>
        <mesh scale={[.38, .16, .27]} rotation-y={i * 2.4} receiveShadow><dodecahedronGeometry args={[1, 1]}/><meshStandardMaterial color={i % 2 ? '#527168' : '#647c70'} roughness={.95}/></mesh>
        <mesh position-y={.12} rotation-x={-Math.PI / 2}><ringGeometry args={[.055, .075, 14]}/><meshBasicMaterial color={colors.text} transparent opacity={.55}/></mesh>
      </group>)}
    </group>)}
    {Array.from({ length: 18 }, (_, i) => <group key={i} position={[(i % 2 ? 1 : -1) * (4 + randomUnit(`stone:${i}`) * 7), .06, 4 - i * 2.35]}>
      <mesh scale={[.65, .34, .48]} rotation-y={i * 2.4} receiveShadow><dodecahedronGeometry args={[1, 1]}/><meshStandardMaterial color='#566c65' roughness={1}/></mesh>
      <mesh position={[0, .24, 0]} scale={[.51, .1, .4]} receiveShadow><icosahedronGeometry args={[1, 1]}/><meshStandardMaterial color='#486c4f' roughness={1}/></mesh>
      {[0, 1, 2].map(j => <group key={j} position={[.55 + j * .12, 0, j * .09]}>
        <mesh position-y={.13}><cylinderGeometry args={[.017, .025, .24, 6]}/><meshStandardMaterial color='#779588'/></mesh>
        <mesh position-y={.26} scale={[1, .4, 1]}><sphereGeometry args={[.085, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color='#83a594' emissive='#8bb8a1' emissiveIntensity={.12} roughness={.8}/></mesh>
      </group>)}
    </group>)}
    {Array.from({ length: 45 }, (_, i) => <mesh key={i} position={[(randomUnit(`firefly-x:${i}`) - .5) * 26, .2 + randomUnit(`firefly-y:${i}`) * 1.2, 5 - randomUnit(`firefly-z:${i}`) * 48]}><sphereGeometry args={[.018, 5, 4]}/><meshBasicMaterial color={i % 4 ? colors.text : colors.echo} transparent opacity={.42}/></mesh>)}
  </group>;
}

export function ForestEnvironment({ lap = 0 }: { lap?: number }) {
  return <><Stars radius={65} depth={25} count={900} factor={2} saturation={.2} fade speed={0}/>{[-1, 0, 1].map(offset => <group key={lap - offset} position-z={offset * FOREST_PERIOD}><ForestTile variant={lap - offset}/></group>)}</>;
}
