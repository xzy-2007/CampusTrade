'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { FavoriteItem } from '@/types';

export default function FavoritesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ total: number; items: FavoriteItem[] }>('/favorites', {
        params: { page, pageSize },
      });
      setFavorites(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAuthenticated) fetchFavorites();
  }, [fetchFavorites, isAuthenticated]);

  const removeFavorite = async (goodsId: number) => {
    try {
      await api.delete(`/favorites/${goodsId}`);
      setFavorites((prev) => prev.filter((f) => f.goods.id !== goodsId));
      setTotal((prev) => prev - 1);
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">请先登录</p>
        <Link href="/login" className="text-blue-600 hover:underline">前往登录</Link>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">我的收藏</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : favorites.length > 0 ? (
        <>
          <div className="space-y-3">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 border rounded-lg bg-white"
              >
                <Link href={`/goods/${item.goods.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {item.goods.images?.[0] ? (
                      <img src={item.goods.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs">无图</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.goods.title}</p>
                    <p className="text-red-500 text-sm">¥{item.goods.price}</p>
                  </div>
                </Link>
                <button
                  onClick={() => removeFavorite(item.goods.id)}
                  className="text-sm text-gray-400 hover:text-red-500 shrink-0"
                >
                  取消收藏
                </button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-30 text-sm"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-30 text-sm"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          暂无收藏
          <Link href="/goods" className="block mt-2 text-blue-600 hover:underline">
            去浏览商品
          </Link>
        </div>
      )}
    </div>
  );
}