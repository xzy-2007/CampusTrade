'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import GoodsForm from '@/components/GoodsForm';
import { useAuth } from '@/hooks/useAuth';
import type { CreateGoodsRequest } from '@/types';

export default function CreateGoodsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">请先登录后再发布商品</p>
        <Link href="/login" className="text-blue-600 hover:underline">前往登录</Link>
      </div>
    );
  }

  const handleSubmit = async (data: CreateGoodsRequest) => {
    const res = await api.post('/goods', data);
    router.push(`/goods/${res.data.id}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">发布商品</h1>
      <GoodsForm onSubmit={handleSubmit} submitLabel="提交审核" />
    </div>
  );
}