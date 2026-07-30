'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { OrderStatus } from '@/types';

interface OrderActionsProps {
  orderId: number;
  status: OrderStatus;
  isBuyer: boolean;
  isSeller: boolean;
  onUpdated?: () => void;
}

export default function OrderActions({ orderId, status, isBuyer, isSeller, onUpdated }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doAction = async (url: string) => {
    setLoading(true);
    setError('');
    try {
      await api.put(url);
      if (onUpdated) onUpdated();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'Completed' || status === 'Cancelled') return null;

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
      )}
      <div className="flex gap-2">
        {status === 'Pending' && isSeller && (
          <button
            onClick={() => doAction(`/orders/${orderId}/seller-confirm`)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? '处理中...' : '确认交易'}
          </button>
        )}
        {status === 'Pending' && isBuyer && (
          <button
            onClick={() => doAction(`/orders/${orderId}/cancel`)}
            disabled={loading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
          >
            {loading ? '处理中...' : '取消订单'}
          </button>
        )}
        {status === 'Confirmed' && isBuyer && (
          <button
            onClick={() => doAction(`/orders/${orderId}/buyer-confirm`)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {loading ? '处理中...' : '确认收货'}
          </button>
        )}
      </div>
    </div>
  );
}