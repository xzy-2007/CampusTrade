'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import FavoriteButton from '@/components/FavoriteButton';
import type { Goods } from '@/types';

export default function GoodsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [buying, setBuying] = useState(false);
  const [goods, setGoods] = useState<Goods | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    api.get<Goods>(`/goods/${id}`).then((res) => {
      setGoods(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!goods) {
    return <div className="text-center py-12 text-gray-400">商品不存在</div>;
  }

  const isOwner = user?.id === goods.user?.id;
  const images = goods.images || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/goods" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; 返回商品列表
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {images.length > 0 ? (
              <img src={images[currentImg]} alt={goods.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">暂无图片</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${i === currentImg ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{goods.title}</h1>
          <p className="text-3xl text-red-500 font-bold mt-2">¥{goods.price}</p>

          <div className="mt-4 flex gap-2">
            <FavoriteButton goodsId={goods.id} />
            {goods.status === 'Approved' && !isOwner && (
              <button
                onClick={async () => {
                  if (!isAuthenticated) { router.push('/login'); return; }
                  setBuying(true);
                  try {
                    const res = await api.post('/orders', {
                      goodsId: goods.id,
                      goodsVersion: goods.version,
                    });
                    router.push(`/orders/${res.data.id}`);
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : '购买失败');
                  } finally {
                    setBuying(false);
                  }
                }}
                disabled={buying}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                {buying ? '处理中...' : '立即购买'}
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><span className="text-gray-400">分类：</span>{goods.category?.name || '未分类'}</p>
            <p><span className="text-gray-400">发布者：</span>{goods.user?.username || '未知'}</p>
            <p><span className="text-gray-400">发布时间：</span>{new Date(goods.createdAt).toLocaleString('zh-CN')}</p>
            <p>
              <span className="text-gray-400">状态：</span>
              <span className={`font-medium ${
                goods.status === 'Approved' ? 'text-green-600' :
                goods.status === 'Sold' ? 'text-gray-500' :
                goods.status === 'Reserved' ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {goods.status === 'PendingReview' ? '审核中' :
                 goods.status === 'Approved' ? '在售' :
                 goods.status === 'Rejected' ? '已驳回' :
                 goods.status === 'Reserved' ? '已预定' :
                 goods.status === 'Sold' ? '已售出' :
                 goods.status === 'Removed' ? '已下架' : goods.status}
              </span>
            </p>
          </div>

          {isOwner && goods.review && (
            <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
              <p className="font-medium">
                审核{goods.review.action === 'approved' ? '通过' : '驳回'}
              </p>
              {goods.review.reason && (
                <p className="text-gray-600 mt-1">理由：{goods.review.reason}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                审核人：{goods.review.adminName} | {new Date(goods.review.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          )}

          {goods.description && (
            <div className="mt-6">
              <h2 className="font-medium mb-2">商品描述</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{goods.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}