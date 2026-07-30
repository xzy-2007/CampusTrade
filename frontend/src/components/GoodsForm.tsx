'use client';

import { useState, FormEvent, useEffect } from 'react';
import api from '@/lib/api';
import type { Category, CreateGoodsRequest } from '@/types';

interface GoodsFormProps {
  initialData?: Partial<CreateGoodsRequest>;
  onSubmit: (data: CreateGoodsRequest) => Promise<void>;
  submitLabel?: string;
}

export default function GoodsForm({ initialData, onSubmit, submitLabel = '提交' }: GoodsFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId?.toString() || '');
  const [imagesInput, setImagesInput] = useState(initialData?.images?.join('\n') || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Category[]>('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('请输入有效的价格');
      return;
    }
    if (!categoryId) {
      setError('请选择分类');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        price: priceNum,
        categoryId: parseInt(categoryId),
        images: imagesInput.split('\n').map((s) => s.trim()).filter(Boolean),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">标题</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="商品标题"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">描述</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="商品描述"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">价格 (¥)</label>
        <input
          type="number"
          required
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">分类</label>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">图片（每行一个图片 URL）</label>
        <textarea
          value={imagesInput}
          onChange={(e) => setImagesInput(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? '提交中...' : submitLabel}
      </button>
    </form>
  );
}