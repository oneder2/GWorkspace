"use client";
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { landmarkExhibitSchema, type Landmark } from '@/lib/content';

const catalogSchema = z.object({ page: z.number().int(), pages: z.number().int(), total: z.number().int(), themes: z.array(z.string()), exhibits: z.array(landmarkExhibitSchema).max(8) });
export function ExhibitionCatalog({ landmark, onSelect, onClose }: { landmark: Landmark; onSelect: (landmark: Landmark, name: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [collection, setCollection] = useState('all'), [theme, setTheme] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<z.infer<typeof catalogSchema> | null>(null), [error, setError] = useState(''), [fetching, setFetching] = useState(true), [loadedQuery, setLoadedQuery] = useState('');
  const query = new URLSearchParams({ region: landmark.id, collection, theme, search, page: String(page) }).toString();
  const loading = fetching || loadedQuery !== query;
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFetching(true); setError('');
      try {
        const response = await fetch(`/explore/api/catalog?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error('暂时无法载入收藏，请稍后再试。');
        const result = catalogSchema.parse(await response.json());
        if (!controller.signal.aborted) setData(result);
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '载入失败'); }
      finally { if (!controller.signal.aborted) { setFetching(false); setLoadedQuery(query); } }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, retry]);
  const title = collection === 'archive' ? '往期收藏' : collection === 'featured' ? '入口精选' : theme || '主题展出';
  return <dialog ref={dialog} className="museum-catalog-dialog" onCancel={onClose} onClose={onClose} aria-label="展馆收藏目录">
    <header><div><small>COLLECTION INDEX</small><h2>{landmark.name} · 收藏目录</h2></div><button onClick={onClose} aria-label="关闭收藏目录">关闭</button></header>
    <p>每次选择最多八件作品，在同一大厅中参观。所有已公开藏品都可在这里查找。</p>
    <div className="catalog-filters"><label>收藏范围<select value={collection} onChange={event => { setCollection(event.target.value); setPage(1); }}><option value="all">全部主题</option><option value="featured">入口精选</option><option value="archive">往期收藏</option></select></label><label>主题<select value={theme} onChange={event => { setTheme(event.target.value); setPage(1); }}><option value="">全部</option>{data?.themes.map(value => <option key={value}>{value}</option>)}</select></label><label>查找内容<input value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setPage(1); }}/></label></div>
    {error && <p role="alert">{error} <button onClick={() => { setFetching(true); setRetry(value => value + 1); }}>重新载入</button></p>}
    <div aria-busy={loading}>{loading ? <p>正在整理展出内容…</p> : data?.exhibits.map(exhibit => <article key={exhibit.id}><span>{exhibit.artifactSpec?.zone}</span><h3>{exhibit.title}</h3><p>{exhibit.summary}</p></article>)}</div>
    {!loading && !error && !data?.total && <p>没有匹配的公开藏品。</p>}
    <footer><button disabled={loading || !data || data.page <= 1} onClick={() => setPage(value => value - 1)}>上一组</button><span>{data?.page || 1} / {data?.pages || 1} · {data?.total || 0} 件</span><button disabled={loading || !data || data.page >= data.pages} onClick={() => setPage(value => value + 1)}>下一组</button><button disabled={loading || Boolean(error) || !data?.exhibits.length} onClick={() => { if (data) onSelect({ ...landmark, exhibits: data.exhibits }, `${title} · ${data.page}`); }}>参观这组作品</button></footer>
  </dialog>;
}
