<template>
  <section class="artifact-manager admin-panel" aria-label="展品设计管理">
    <header><div><small>EXHIBIT ATELIER</small><h3>展品设计</h3><p>查看模型依据、调整意象，或锁定一个满意的版本。</p></div><button @click="$emit('legacy')">旧版模型记录</button></header>
    <p v-if="message" role="status">{{ message }}</p>
    <div class="artifact-toolbar"><label>查找作品或文章<input v-model="search" placeholder="标题、主题" /></label><label>内容<select v-model="kind"><option value="">全部</option><option value="project">项目</option><option value="blog">文章</option></select></label><button @click="load">刷新</button></div>
    <div class="atelier-layout">
      <nav aria-label="模型目录"><button v-for="item in filtered" :key="`${item.kind}:${item.sourceId}`" :aria-current="selected?.artifact.id === item.artifact?.id ? 'true' : undefined" :disabled="!item.artifact" @click="select(item)"><strong>{{ item.title }}</strong><span>{{ !item.artifact ? '尚未发布建模' : item.sourceStatus !== 'published' ? '已撤回 · 模型保留' : item.surfaces.includes('gellaria') ? (item.collection === 'archive' ? '往期收藏' : item.collection === 'featured' ? '入口精选' : '主题分室') : '已有模型 · 未在 Gellaria 发布' }}{{ item.locked ? ' · 已锁定' : '' }}</span></button><p v-if="!filtered.length">没有匹配的记录。</p></nav>
      <div v-if="selected" class="atelier-editor">
        <h4>{{ selected.title }}</h4>
        <iframe ref="previewFrame" :src="previewUrl" title="可旋转的展品预览" @load="sendPreview" />
        <p class="preview-note">{{ historyPreview ? `预览历史 r${historyPreview.revision}` : '预览当前编辑 · 保存后展馆才会更新' }} · 拖动旋转 / 滚轮缩放</p>
        <p v-if="previewError" role="status">{{ previewError }}</p>
        <button v-if="historyPreview" @click="historyPreview = null">返回当前编辑</button>
        <dl><dt>建模依据</dt><dd>{{ selected.artifact.spec.design?.basis }}</dd><dt>内容摘要</dt><dd>{{ selected.artifact.spec.design?.synopsis }}</dd><dt>内容锚点</dt><dd>{{ selected.artifact.spec.design?.anchors?.join(' · ') || '暂无章节或标签' }}</dd><dt>模型状态</dt><dd>r{{ selected.artifact.revision }} · {{ selected.artifact.generator }}</dd><template v-if="selected.kind === 'blog'"><dt>阅读成长</dt><dd>{{ selected.views }} 次阅读 · 第 {{ selected.artifact.spec.design?.level }} 阶 · 下一门槛 {{ selected.artifact.spec.design?.nextThreshold ?? '已达上限' }}{{ selected.locked ? '（已锁定，自动成长暂停）' : '' }}</dd></template></dl>
        <form @submit.prevent="save">
          <div class="atelier-fields"><label>意象<select v-model="form.motif"><option v-for="motif in selected.motifs" :key="motif" :value="motif">{{ selected.motifNames?.[motif] || motif }}</option></select></label><label>模型名称<input v-model="form.name" maxlength="60" required /></label><label>主题分室<input v-model="form.zone" maxlength="40" required /></label><label>策展位置<select v-model="form.collection"><option value="auto">主题分室</option><option value="featured">入口精选</option><option value="archive">往期收藏</option></select></label></div>
          <label>模型寓意<textarea v-model="form.rationale" maxlength="240" rows="3" required /></label>
          <div class="atelier-colors"><label v-for="(_, i) in form.colors" :key="i">{{ ['主体', '结构', '光色'][i] }}<input v-model="form.colors[i]" type="color" /></label></div>
          <label class="atelier-lock"><input v-model="form.locked" type="checkbox" />锁定模型，暂停内容与阅读量触发的自动更新</label>
          <div class="atelier-actions"><button type="submit" :disabled="busy">{{ busy ? '保存中…' : '保存设计' }}</button><button type="button" :disabled="busy" @click="resetAutomatic">清除手动设计并恢复自动建模</button></div>
        </form>
        <details><summary>模型版本与恢复</summary><article v-for="event in selected.history" :key="event.revision" class="atelier-history"><span>r{{ event.revision }} · {{ event.reason }} · {{ event.created_at }}</span><div><button @click="historyPreview = event">预览</button><button :disabled="busy || event.revision === selected.artifact.revision" @click="restore(event)">恢复并锁定</button></div></article></details>
        <details><summary>管理操作记录</summary><p v-for="(event, i) in selected.audit" :key="i">{{ event.action }} · {{ event.created_at }}</p></details>
      </div>
      <p v-else class="atelier-empty">选择一件已有模型的作品，查看设计与版本。</p>
    </div>
  </section>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { contentAdminApi } from '../../utils/api'
defineEmits(['legacy'])
const records = ref([]), selected = ref(null), search = ref(''), kind = ref(''), busy = ref(false), message = ref(''), previewFrame = ref(null), historyPreview = ref(null)
const previewError = ref('')
const previewUrl = new URL('/explore/model-preview', import.meta.env.VITE_GELLARIA_URL || window.location.origin).toString()
const form = reactive({ motif: '', name: '', zone: '', rationale: '', colors: ['#7799bb', '#ccbbaa', '#eeeecc'], collection: 'auto', locked: false })
const filtered = computed(() => records.value.filter(item => (!kind.value || item.kind === kind.value) && `${item.title} ${item.artifact?.spec.zone || ''}`.toLowerCase().includes(search.value.toLowerCase())))
const draftSpec = computed(() => {
  if (historyPreview.value) return historyPreview.value.spec
  if (!selected.value) return null
  const spec = structuredClone(JSON.parse(JSON.stringify(selected.value.artifact.spec)))
  Object.assign(spec, { zone: form.zone, colors: [...form.colors], caption: form.rationale })
  Object.assign(spec.design, { motif: form.motif, name: form.name, rationale: form.rationale })
  return spec
})
function sendPreview() { if (draftSpec.value) previewFrame.value?.contentWindow?.postMessage({ type: 'gellaria:model-preview', spec: JSON.parse(JSON.stringify(draftSpec.value)) }, new URL(previewUrl).origin) }
function ready(event) {
  if (event.origin !== new URL(previewUrl).origin || event.source !== previewFrame.value?.contentWindow) return
  if (event.data?.type === 'gellaria:preview-ready') sendPreview()
  if (event.data?.type === 'gellaria:preview-loaded') previewError.value = ''
  if (event.data?.type === 'gellaria:preview-invalid') previewError.value = '请填写完整的模型名称、主题和寓意；预览暂时保留上一个有效设计。'
}
watch(draftSpec, sendPreview, { deep: true })
async function load() { try { records.value = await contentAdminApi.getArtifacts() } catch (error) { message.value = error.message } }
let selectionRequest = 0
async function select(item) { if (busy.value) return; const request = ++selectionRequest; try { const detail = await contentAdminApi.getArtifact(item.artifact.id); if (request === selectionRequest) accept(detail) } catch (error) { message.value = error.message } }
function accept(detail) { selected.value = detail; historyPreview.value = null; const s = detail.artifact.spec; Object.assign(form, { motif: s.design.motif, name: s.design.name, zone: s.zone, rationale: s.design.rationale, colors: [...s.colors], collection: detail.collection, locked: detail.locked }) }
async function update(payload) { if (busy.value || !selected.value) return; ++selectionRequest; busy.value = true; message.value = ''; try { accept(await contentAdminApi.updateArtifact(selected.value.artifact.id, { revision: selected.value.artifact.revision, ...payload })); await load(); message.value = '设计已保存，展馆将在公开内容缓存更新后显示。' } catch (error) { message.value = `${error.message}；你的编辑仍保留，可重新选择这条记录以载入最新版本。` } finally { busy.value = false } }
function save() {
  const spec = selected.value.artifact.spec
  const original = { motif: spec.design.motif, name: spec.design.name, rationale: spec.design.rationale, colors: spec.colors, zone: spec.zone }
  const changes = Object.fromEntries(Object.keys(original).filter(key => JSON.stringify(original[key]) !== JSON.stringify(form[key])).map(key => [key, form[key]]))
  return update({ locked: form.locked, collection: form.collection, ...(Object.keys(changes).length ? { overrides: { ...selected.value.overrides, ...changes } } : {}) })
}
function resetAutomatic() { return update({ locked: false, overrides: {} }) }
function restore(event) { return update({ restoreRevision: event.revision, locked: true }) }
onMounted(() => { load(); window.addEventListener('message', ready) })
onBeforeUnmount(() => window.removeEventListener('message', ready))
</script>
<style scoped>
.artifact-manager { padding: 24px; }.artifact-manager header { display: flex; justify-content: space-between; gap: 20px; }.artifact-manager h3 { margin: 8px 0; font-size: 24px; }.artifact-manager p { line-height: 1.7; }.artifact-manager small { letter-spacing: .16em; color: var(--text-muted); }.artifact-toolbar,.atelier-fields,.atelier-colors,.atelier-actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0; }.artifact-manager label { display: grid; gap: 7px; font-size: 13px; flex: 1; }.artifact-manager input,.artifact-manager select,.artifact-manager textarea { color: var(--text-primary); background: var(--bg-secondary); border: 1px solid var(--border-strong); padding: 10px; min-width: 0; }.artifact-manager button { color: var(--text-primary); border: 1px solid var(--border-strong); background: var(--bg-secondary); min-height: 42px; padding: 8px 12px; cursor: pointer; }.artifact-manager button:disabled { opacity: .5; cursor: default; }.atelier-layout { display: grid; grid-template-columns: minmax(200px, 1fr) minmax(0, 2fr); gap: 24px; border-top: 1px solid var(--border-strong); padding-top: 24px; }.atelier-layout nav { max-height: 880px; overflow: auto; }.atelier-layout nav button { display: grid; gap: 8px; text-align: left; width: 100%; padding: 16px; border-width: 0 0 1px; }.atelier-layout nav span { font-size: 11px; opacity: .7; }.atelier-layout nav button[aria-current=true] { border-left: 3px solid var(--accent); background: var(--bg-tertiary); }.atelier-editor h4 { font-size: 20px; margin: 0 0 18px; }.atelier-editor iframe { width: 100%; height: 340px; border: 0; background: #10222e; }.preview-note { font-size: 12px; opacity: .7; }.atelier-editor dl { display: grid; grid-template-columns: 76px 1fr; gap: 10px; font-size: 13px; line-height: 1.6; }.atelier-editor dd { margin: 0; word-break: break-word; }.atelier-editor dt { opacity: .6; }.atelier-colors input { width: 100%; height: 38px; padding: 3px; }.artifact-manager .atelier-lock { display: flex; align-items: center; line-height: 1.6; }.atelier-history { padding: 12px 0; border-bottom: 1px solid var(--border-strong); font-size: 12px; }.atelier-history div { display: flex; gap: 8px; margin-top: 8px; }.atelier-editor details { padding: 15px 0; }.artifact-manager :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }@media(max-width:760px) { .artifact-manager { padding: 16px; }.atelier-layout { grid-template-columns: 1fr; }.atelier-layout nav { max-height: 240px; }.atelier-editor iframe { height: 280px; }.artifact-manager header { flex-direction: column; }.atelier-fields { display: grid; grid-template-columns: 1fr 1fr; } }
</style>
