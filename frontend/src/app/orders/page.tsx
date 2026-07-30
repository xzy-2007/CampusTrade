'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import type { Order } from '@/types';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'Pending', label: '待确认' },
  { value: 'Confirmed', label: '已确认' },
  { value: 'Completed', label: '已完成' },
  { value: 'Cancelled', label: '已取消' },
];

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ total: number; items: Order[] }>('/orders', {
        params: { page: 1, pageSize: 999 },
      });
      setAllOrders(res.data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [fetchOrders, isAuthenticated]);

  const filtered = allOrders.filter((o) => {
    if (role === 'buyer' && o.buyer.id !== user?.id) return false;
    if (role === 'seller' && o.seller.id !== user?.id) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      <div className="flex gap-3 mb-6">
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => { setRole('buyer'); setPage(1); }}
            className={`px-4 py-2 text-sm ${role === 'buyer' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >
            作为买家
          </button>
          <button
            onClick={() => { setRole('seller'); setPage(1); }}
            className={`px-4 py-2 text-sm ${role === 'seller' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >
            作为卖家
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : paged.length > 0 ? (
        <>
          <div className="space-y-3">
            {paged.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {order.goods.images?.[0] ? (
                    <img src={order.goods.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-300 text-xs">无图</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{order.goods.title}</p>
                  <p className="text-red-500 text-sm">¥{order.goods.price}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {role === 'buyer' ? `卖家：${order.seller.username}` : `买家：${order.buyer.username}`}
                    {' | '}
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
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
        <div className="text-center py-12 text-gray-400">
          暂无订单
          <Link href="/goods" className="block mt-2 text-blue-600 hover:underline">
            去浏览商品
          </Link>
        </div>
      )}
    </div>
  );
}