<template>
  <button ref="button" type="button" class="terminal-orb" :class="{ dragging, open }" :style="{ left: position.x + 'px', top: position.y + 'px' }"
    :aria-label="copy.ui.openLabel" :title="`${copy.launcher.label} · ${state}`" :aria-expanded="open"
    @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="cancel" @dragstart.prevent @click="activate">
    <span class="orbit" aria-hidden="true"></span><span class="glyph" aria-hidden="true">&gt;_</span><span class="signal" aria-hidden="true"></span>
  </button>
</template>
<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
const props = defineProps({ copy: Object, open: Boolean, state: String })
const emit = defineEmits(['toggle', 'position'])
const button = ref(null), dragging = ref(false)
const position = reactive({ x: window.innerWidth - 72, y: window.innerHeight - 88 })
let dock = { edge: 'right', ratio: .92 }, gesture = null, suppress = false
const bounds = () => ({ x: Math.max(12, window.innerWidth - 68), y: Math.max(12, window.innerHeight - 68) })
function place() {
  const b = bounds(), vertical = ['left', 'right'].includes(dock.edge)
  position.x = vertical ? (dock.edge === 'left' ? 12 : b.x) : 12 + dock.ratio * (b.x - 12)
  position.y = vertical ? 12 + dock.ratio * (b.y - 12) : (dock.edge === 'top' ? 12 : b.y)
  emit('position', { ...position })
}
function snap() {
  const b = bounds()
  dock.edge = [['left', position.x - 12], ['right', b.x - position.x], ['top', position.y - 12], ['bottom', b.y - position.y]].sort((a,b) => a[1]-b[1])[0][0]
  dock.ratio = ['left','right'].includes(dock.edge) ? (position.y-12)/Math.max(1,b.y-12) : (position.x-12)/Math.max(1,b.x-12)
  place()
  try { localStorage.setItem('terminal-orb-dock', JSON.stringify(dock)) } catch { /* Optional preference. */ }
}
function start(e) {
  if (!e.isPrimary || e.button !== 0) return
  e.preventDefault(); suppress = false
  gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, origin: { ...position } }
  e.currentTarget.setPointerCapture(e.pointerId)
}
function move(e) {
  if (!gesture || gesture.id !== e.pointerId) return
  const dx=e.clientX-gesture.x, dy=e.clientY-gesture.y
  if (Math.hypot(dx,dy)>6) dragging.value=true
  if (!dragging.value) return
  const b=bounds()
  position.x=Math.max(12,Math.min(b.x,gesture.origin.x+dx)); position.y=Math.max(12,Math.min(b.y,gesture.origin.y+dy))
}
function end(e) { if (!gesture || gesture.id!==e.pointerId) return; suppress=dragging.value; gesture=null; dragging.value=false; snap() }
function cancel() { gesture=null; dragging.value=false; suppress=true; place() }
function activate(e) { if (suppress && e.detail!==0) { suppress=false; return }; emit('toggle') }
watch(()=>props.open, async value=>{ if (!value) { await nextTick(); button.value?.focus({preventScroll:true}) } })
onMounted(()=>{
  try { const saved=JSON.parse(localStorage.getItem('terminal-orb-dock')); if (saved && ['left','right','top','bottom'].includes(saved.edge) && Number.isFinite(saved.ratio)) dock={edge:saved.edge,ratio:Math.max(0,Math.min(1,saved.ratio))} } catch { /* Use default dock. */ }
  place(); window.addEventListener('resize',place)
})
onUnmounted(()=>window.removeEventListener('resize',place))
</script>
<style scoped>
.terminal-orb { position:fixed; z-index:90; width:56px; height:56px; border-radius:50%; display:grid; place-items:center; touch-action:none; user-select:none; cursor:grab; color:var(--text-main); background:radial-gradient(circle at 30% 20%,var(--surface-elevated),var(--surface-panel)); border:1px solid var(--border-strong); backdrop-filter:blur(14px); box-shadow:0 8px 24px #0f172a26,inset 0 1px 2px #ffffff55; transition:left .25s ease,top .25s ease,box-shadow .2s; }
.terminal-orb > span { pointer-events:none; }
.terminal-orb.dragging { transition:none; cursor:grabbing; }
.terminal-orb.open { visibility:hidden; pointer-events:none; }
.terminal-orb:focus-visible { outline:2px solid var(--theme-primary); outline-offset:4px; }
.terminal-orb:hover { box-shadow:0 8px 30px color-mix(in srgb,var(--agent-signal) 25%,transparent); }
.orbit { position:absolute; inset:5px; border:1px solid color-mix(in srgb,var(--agent-signal) 50%,transparent); border-right-color:transparent; border-radius:50%; transform:rotate(-35deg); }
.glyph { font:700 18px 'JetBrains Mono',monospace; letter-spacing:-2px; }
.signal { position:absolute; right:9px; bottom:10px; width:5px; height:5px; border-radius:50%; background:var(--accent-success); box-shadow:0 0 0 3px var(--surface-panel); }
@media(prefers-reduced-motion:reduce) { .terminal-orb { transition:none; } }
</style>
