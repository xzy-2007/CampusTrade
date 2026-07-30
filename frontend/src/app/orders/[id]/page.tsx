'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import OrderActions from '@/components/OrderActions';
import type { Order } from '@/types';

export default function OrderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params.id as string;

  const fetchOrder = () => {
    if (!id) return;
    api.get<Order>(`/orders/${id}`).then((res) => {
      setOrder(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-400">订单不存在</div>;
  }

  const isBuyer = user?.id === order.buyer.id;
  const isSeller = user?.id === order.seller.id;

  if (!isBuyer && !isSeller) {
    return <div className="text-center py-12 text-gray-400">无权查看此订单</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/orders" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; 返回订单列表
      </Link>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">订单详情</h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
            {order.goods.images?.[0] ? (
              <img src={order.goods.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xs">无图</span>
            )}
          </div>
          <div>
            <Link href={`/goods/${order.goods.id}`} className="font-medium hover:text-blue-600">
              {order.goods.title}
            </Link>
            <p className="text-red-500 font-bold text-lg mt-1">¥{order.goods.price}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">订单编号</span>
            <span>#{order.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">卖家</span>
            <span>{order.seller.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">买家</span>
            <span>{order.buyer.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">创建时间</span>
            <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          {order.updatedAt && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-400">更新时间</span>
              <span>{new Date(order.updatedAt).toLocaleString('zh-CN')}</span>
            </div>
          )}
        </div>

        <OrderActions
          orderId={order.id}
          status={order.status}
          isBuyer={isBuyer}
          isSeller={isSeller}
          onUpdated={fetchOrder}
        />
      </div>
    </div>
  );
}