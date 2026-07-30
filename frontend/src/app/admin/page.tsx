'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Goods, ReviewRecord } from '@/types';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<'pending' | 'records'>('pending');

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

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">无权访问</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>

      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
            tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          待审核商品
        </button>
        <button
          onClick={() => setTab('records')}
          className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
            tab === 'records' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          审核记录
        </button>
      </div>

      {tab === 'pending' ? <PendingGoods /> : <ReviewRecords />}
    </div>
  );
}

function PendingGoods() {
  const [goodsList, setGoodsList] = useState<Goods[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ goodsId: number; reason: string } | null>(null);
  const pageSize = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ total: number; items: Goods[] }>('/admin/goods', {
        params: { page, pageSize },
      });
      setGoodsList(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = async (goodsId: number) => {
    try {
      await api.put(`/admin/goods/${goodsId}/review`, { action: 'approved' });
      fetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const reject = async (goodsId: number, reason: string) => {
    try {
      await api.put(`/admin/goods/${goodsId}/review`, { action: 'rejected', reason });
      setRejectModal(null);
      fetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const forceRemove = async (goodsId: number) => {
    if (!confirm('确定强制下架该商品？')) return;
    try {
      await api.put(`/admin/goods/${goodsId}/force-remove`);
      fetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : goodsList.length > 0 ? (
        <>
          <div className="space-y-3">
            {goodsList.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                <Link href={`/goods/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs">无图</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-red-500 text-sm">¥{item.price}</p>
                    <p className="text-xs text-gray-400">发布者：{item.user?.username}</p>
                  </div>
                </Link>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(item.id)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => setRejectModal({ goodsId: item.id, reason: '' })}
                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    驳回
                  </button>
                  <button
                    onClick={() => forceRemove(item.id)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-500 rounded text-sm hover:bg-gray-50"
                  >
                    下架
                  </button>
                </div>
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
        <div className="text-center py-12 text-gray-400">暂无待审核商品</div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium mb-4">驳回商品</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="请输入驳回理由..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => reject(rejectModal.goodsId, rejectModal.reason)}
                disabled={!rejectModal.reason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewRecords() {
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    setLoading(true);
    api.get<{ total: number; items: ReviewRecord[] }>('/admin/review-records', {
      params: { page, pageSize },
    }).then((res) => {
      setRecords(res.data.items);
      setTotal(res.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : records.length > 0 ? (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">商品</th>
                  <th className="text-left px-4 py-3 font-medium">操作</th>
                  <th className="text-left px-4 py-3 font-medium">理由</th>
                  <th className="text-left px-4 py-3 font-medium">管理员</th>
                  <th className="text-left px-4 py-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/goods/${r.goods.id}`} className="text-blue-600 hover:underline">
                        {r.goods.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.action === 'approved' ? '通过' : '驳回'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.reason || '-'}</td>
                    <td className="px-4 py-3">{r.admin.username}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <div className="text-center py-12 text-gray-400">暂无审核记录</div>
      )}
    </>
  );
}