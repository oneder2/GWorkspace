import type { Landmark } from './content';
import type { Exhibit, ExhibitKind, ExhibitSlot, MuseumPlan, MuseumRoom } from './exhibition';

export const GALLERY_CAPACITY = 12;
export const GALLERY_LAYOUT_VERSION = 1;
// Three open clusters share a continuous floor. Row passages connect to the
// central shortcut; no topic gets an enclosed room. Units are scene units.
const zoneSites = [[0, 1, 4, 5], [2, 3, 6, 7], [8, 9, 10, 11]];
const columns = [-6.2, -2.7, 2.7, 6.2];
const rows = [1.5, -4.1, -9.7];
const zoneFor = (site: number) => zoneSites.findIndex(sites => sites.includes(site));
const compareKeys = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function buildCompactGallery(landmark: Landmark, getKind: (id: string, exhibit: Exhibit) => ExhibitKind, previous: Record<string, number> = {}): MuseumPlan {
  if (landmark.exhibits.length > GALLERY_CAPACITY) throw new RangeError('Select a gallery batch of at most 12 exhibits.');
  // Database artifact IDs survive source slug changes. If a collection exposes
  // the same artifact more than once, its separate placements still need IDs.
  const artifactCounts = new Map<string, number>();
  for (const item of landmark.exhibits) if (item.artifactId) artifactCounts.set(item.artifactId, (artifactCounts.get(item.artifactId) || 0) + 1);
  const keyFor = (item: Exhibit) => item.artifactId && artifactCounts.get(item.artifactId) === 1 ? item.artifactId : item.id;
  const archive = landmark.id === 'observatory';
  const placements: Record<string, number> = {};
  const occupied = new Set<number>();
  // Keep surviving exhibit IDs in place regardless of API order, views, model
  // revision or removal of a neighbour. Only new objects occupy vacant sites.
  for (const item of landmark.exhibits) {
    // Migrate the first local layout format without moving existing works.
    const site = previous[keyFor(item)] ?? previous[item.id];
    if (Number.isInteger(site) && site >= 0 && site < GALLERY_CAPACITY && !occupied.has(site)) {
      placements[keyFor(item)] = site; occupied.add(site);
    }
  }
  const ordered = [...landmark.exhibits].sort((a, b) =>
    Number(getKind(landmark.id, b) === 'daily-signal') - Number(getKind(landmark.id, a) === 'daily-signal') ||
    Number(Boolean(b.artifactSpec?.featured) || b.collection === 'featured') - Number(Boolean(a.artifactSpec?.featured) || a.collection === 'featured') ||
    compareKeys(a.artifactSpec?.zone || '', b.artifactSpec?.zone || '') || compareKeys(keyFor(a), keyFor(b)));
  for (const item of ordered) {
    if (Object.hasOwn(placements, keyFor(item))) continue;
    const batchCapacity = Math.max(4, Math.ceil(landmark.exhibits.length / 4) * 4);
    const candidates = Array.from({ length: batchCapacity }, (_, i) => i).filter(site => !occupied.has(site));
    if (getKind(landmark.id, item) === 'daily-signal') {
      const preferred = Math.min(11, Math.ceil(landmark.exhibits.length / 4) * 4 - 1);
      candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
    }
    else candidates.sort((a, b) => {
      const matching = (site: number) => landmark.exhibits.filter(other => Object.hasOwn(placements, keyFor(other)) &&
        zoneFor(placements[keyFor(other)]) === zoneFor(site) && other.artifactSpec?.zone && other.artifactSpec.zone === item.artifactSpec?.zone).length;
      return matching(b) - matching(a) || a - b;
    });
    placements[keyFor(item)] = candidates[0]; occupied.add(candidates[0]);
  }
  const rooms: MuseumRoom[] = [], slots: ExhibitSlot[] = [];
  for (let group = 0; group < 4; group++) {
    const contents = landmark.exhibits.filter(item => getKind(landmark.id, item) === 'daily-signal' ? group === 3 : zoneFor(placements[keyFor(item)]) === group)
      .sort((a, b) => placements[keyFor(a)] - placements[keyFor(b)]);
    if (!contents.length) continue;
    const title = group === 3 ? '今日赠语窗' : [...new Set(contents.map(item => item.artifactSpec?.zone).filter(Boolean))].slice(0, 2).join(' · ') || (archive ? `阅读湾 ${group + 1}` : `造物展岛 ${group + 1}`);
    const id = `${landmark.id}:bay:${group}`;
    const room: MuseumRoom = { id, title, layout: archive ? 'archive' : 'fabrication', kind: getKind(landmark.id, contents[0]),
      centerX: group === 0 ? -4.45 : group === 1 ? 4.45 : group === 3 ? 6.2 : 0,
      centerZ: group < 2 ? -1.3 : -9.7, width: group < 2 ? 8 : group === 3 ? 3 : 17,
      depth: group < 2 ? 10.5 : 4.5, startIndex: slots.length, count: contents.length };
    rooms.push(room);
    for (const exhibit of contents) {
      const site = placements[keyFor(exhibit)], col = site % 4, row = Math.floor(site / 4);
      const x = columns[col], z = rows[row] - (archive ? (col % 2 ? .35 : 0) : col >= 2 ? .6 : 0);
      slots.push({ id: exhibit.id, index: slots.length, exhibit, kind: getKind(landmark.id, exhibit), site, zoneId: id,
        position: [x, 0, z], rotation: archive ? (col % 2 ? -.1 : .1) : 0,
        // Includes the model's animated envelope and plinth, before adding the
        // traveler radius. Model growth stays inside this reserved envelope.
        footprint: [2.6, 2.6], viewingPoint: [x, z + 2.45] });
    }
    room.arrival = slots[room.startIndex].viewingPoint;
    const contentsSlots = slots.slice(room.startIndex);
    const xs = contentsSlots.map(slot => slot.position[0]), zs = contentsSlots.map(slot => slot.position[2]);
    room.centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    room.centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    room.width = Math.max(...xs) - Math.min(...xs) + 3.2;
    room.depth = Math.max(...zs) - Math.min(...zs) + 3.8;
  }
  if (!rooms.length) rooms.push({ id: `${landmark.id}:foyer`, title: '等待下一次展出', layout: archive ? 'archive' : 'fabrication', kind: archive ? 'blog-constellation' : 'project-model', centerX: 0, centerZ: 0, width: 18.8, depth: 12, count: 0, startIndex: 0, arrival: [0, 6] });
  // Shrink unused depth for small batches; never derive area from text length.
  const lastRow = Math.max(0, ...[...occupied].map(site => Math.floor(site / 4)));
  const backZ = rows[lastRow] - 4.7;
  const furnishings: NonNullable<MuseumPlan['furnishings']> = archive ? [
    { id: 'reading-bench', kind: 'reading-bench', position: [-6.2, 5.85], size: [2.5, .7], height: .65 },
    ...rooms.filter(room => room.count && room.kind !== 'daily-signal').map(room => {
      const rear = room.id.endsWith(':2');
      return { id: `${room.id}:screen`, kind: 'bay-screen' as const,
        position: (rear ? [0, backZ + 1.9] : [(room.centerX || 0) < 0 ? -8.6 : 8.6, room.centerZ]) as [number, number],
        size: (rear ? [3.6, .2] : [.2, Math.min(3.6, room.depth - .4)]) as [number, number], height: 1.35 };
    }),
  ] : [];
  return { rooms, slots, placements, furnishings, entranceZ: 6, backZ, length: 7.2 - backZ, shell: { width: 18.8, frontZ: 7.2, backZ } };
}

export function readGalleryPlacements(storage: Pick<Storage, 'getItem'> | undefined, key: string): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, site]) => id.length < 200 && Number.isInteger(site) && site >= 0 && site < GALLERY_CAPACITY));
  } catch { return {}; }
}
