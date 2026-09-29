import { NextRequest, NextResponse } from 'next/server';
import { fetchGWorkspace } from '@/lib/gworkspace-api';
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ['region', 'page', 'theme', 'search', 'collection']) { const value = request.nextUrl.searchParams.get(key); if (value) params.set(key, value.slice(0, 100)); }
  const upstream = await fetchGWorkspace(`/api/public/world/catalog?${params}`, { revalidate: 30 });
  if (!upstream?.ok) return NextResponse.json({ error: '暂时无法载入收藏，当前展厅仍可继续参观。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json(await upstream.json(), { headers: { 'Cache-Control': 'public, max-age=30' } });
}
