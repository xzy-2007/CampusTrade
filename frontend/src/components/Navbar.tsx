'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">CampusTrade</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/goods" className="hover:text-blue-600">商品</Link>
          {isAuthenticated ? (
            <>
              <Link href="/goods/create" className="hover:text-blue-600">发布</Link>
              <Link href="/favorites" className="hover:text-blue-600">收藏</Link>
              <Link href="/orders" className="hover:text-blue-600">订单</Link>
              <Link href="/profile" className="hover:text-blue-600">{user?.username}</Link>
              {user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-red-600">管理</Link>
              )}
              <button onClick={logout} className="text-gray-500 hover:text-gray-700">退出</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600">登录</Link>
              <Link href="/register" className="hover:text-blue-600">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}