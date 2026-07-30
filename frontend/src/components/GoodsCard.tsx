'use client';

import Link from 'next/link';
import type { Goods } from '@/types';

export default function GoodsCard({ goods }: { goods: Goods }) {
  const cover = goods.images?.[0];

  return (
    <Link
      href={`/goods/${goods.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={cover} alt={goods.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">暂无图片</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{goods.title}</h3>
        <p className="text-red-500 font-bold mt-1">¥{goods.price}</p>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>{goods.category?.name || '未分类'}</span>
          <span>{new Date(goods.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </Link>
  );
}