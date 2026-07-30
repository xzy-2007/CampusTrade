'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  goodsId: number;
}

export default function FavoriteButton({ goodsId }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }
    api.get<{ total: number; items: { id: number; goods: { id: number } }[] }>('/favorites', {
      params: { pageSize: 999 },
    }).then((res) => {
      const found = res.data.items.some((item) => item.goods.id === goodsId);
      setFavorited(found);
    }).catch(() => {}).finally(() => setChecking(false));
  }, [goodsId, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      if (favorited) {
        await api.delete(`/favorites/${goodsId}`);
        setFavorited(false);
      } else {
        await api.post('/favorites', { goodsId });
        setFavorited(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [favorited, goodsId, isAuthenticated, router]);

  if (checking) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm transition-colors ${
        favorited
          ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {favorited ? '❤ 已收藏' : '♡ 收藏'}
    </button>
  );
}