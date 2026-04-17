'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        setError('密碼錯誤');
        setPassword('');
      }
    } catch {
      setError('驗證失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xs sm:max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🔐</div>
          <h1 className="text-xl sm:text-2xl font-bold text-amber-400">易經占卜後台</h1>
          <p className="text-gray-500 mt-2 text-xs sm:text-sm">請輸入管理員密碼登入</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入密碼..."
            className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:border-amber-500 text-white text-sm sm:text-base placeholder-gray-500"
            autoFocus
          />

          {error && (
            <div className="text-red-400 text-xs sm:text-sm text-center bg-red-900/20 py-2.5 sm:py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 sm:py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-colors"
          >
            {loading ? '驗證中...' : '登入'}
          </button>
        </form>

        <div className="text-center mt-6 sm:mt-8">
          <a href="/" className="text-gray-500 hover:text-amber-400 text-xs sm:text-sm transition-colors">
            ← 返回占卜首頁
          </a>
        </div>
      </div>
    </div>
  );
}
