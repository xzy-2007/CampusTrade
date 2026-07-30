'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { GoodsListResponse } from '@/types';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [goods, setGoods] = useState<GoodsListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loadingGoods, setLoadingGoods] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingGoods(true);
    api.get<GoodsListResponse>('/users/goods', { params: { page, pageSize: 10 } })
      .then((res) => setGoods(res.data))
      .catch(() => {})
      .finally(() => setLoadingGoods(false));
  }, [isAuthenticated, page]);

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

  const totalPages = goods ? Math.ceil(goods.total / goods.pageSize) : 0;

  const statusLabel: Record<string, string> = {
    PendingReview: '审核中',
    Approved: '在售',
    Rejected: '已驳回',
    Reserved: '已预定',
    Sold: '已售出',
    Removed: '已下架',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-medium mb-3">基本信息</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>用户名：{user?.username}</p>
          <p>邮箱：{user?.email}</p>
          <p>角色：{user?.role === 'admin' ? '管理员' : '用户'}</p>
          {user?.phone && <p>电话：{user?.phone}</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-medium mb-4">我的商品</h2>
        {loadingGoods ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : goods && goods.items.length > 0 ? (
          <>
            <div className="space-y-3">
              {goods.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/goods/${item.id}`}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs">无图</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-red-500 text-sm">¥{item.price}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      item.status === 'PendingReview' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {statusLabel[item.status] || item.status}
                    </span>
                    {item.reviewReason && (
                      <p className="text-xs text-red-500 mt-1">驳回理由：{item.reviewReason}</p>
                    )}
                  </div>
                </Link>
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
          <div className="text-center py-8 text-gray-400">
            暂无商品
            <Link href="/goods/create" className="block mt-2 text-blue-600 hover:underline">
              去发布商品
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}