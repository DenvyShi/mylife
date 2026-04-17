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
        setError('密碼錯誤，拒絕訪問');
        setPassword('');
      }
    } catch {
      setError('驗證請求失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#0a0806',
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, rgba(139,105,20,0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 50% 100%, rgba(124,29,29,0.08) 0%, transparent 50%),
          url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A227' fill-opacity='0.04'%3E%3Cpath d='M0 0h40v40H0zM40 40h40v40H40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Main panel */}
      <div className="w-full max-w-sm wow-panel rounded-lg overflow-hidden" style={{ maxWidth: 380 }}>
        {/* Corner ornaments */}
        <div className="wow-ornament-corner tl" />
        <div className="wow-ornament-corner tr" />
        <div className="wow-ornament-corner bl" />
        <div className="wow-ornament-corner br" />

        {/* Header */}
        <div className="wow-panel-header justify-center">
          <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(201,162,39,0.5))' }}>⚔️</span>
          <span className="wow-title text-sm tracking-widest">易經占卜</span>
          <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(201,162,39,0.5))' }}>⚔️</span>
        </div>

        {/* Subtitle bar */}
        <div className="text-center py-3 px-4 border-b border-[#3d2e1a]" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="text-[10px] tracking-[3px] text-[#8B6914] uppercase">Guild Master Access</div>
          <div className="wow-title text-xs mt-1 tracking-wider">管理後台</div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Decorative divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #5c4a2a)' }} />
            <span className="text-[#8B6914] text-[10px] tracking-widest">IDENTIFY</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #5c4a2a, transparent)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#8B6914] uppercase mb-2">
                通行口令
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼..."
                className="wow-input rounded-sm"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="py-2.5 px-3 rounded-sm text-center text-xs"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#FCA5A5',
                }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="wow-btn wow-btn-gold w-full rounded-sm py-3 text-sm tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '驗證中...' : '進入後台'}
            </button>
          </form>

          {/* Decorative bottom */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #3d2e1a)' }} />
            <span className="text-[#3d2e1a] text-xs">☰</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #3d2e1a, transparent)' }} />
          </div>

          {/* Back link */}
          <div className="text-center mt-4">
            <a href="/" className="text-[10px] tracking-widest text-[#5c4a2a] hover:text-[#D4AF37] transition-colors uppercase">
              ← 返回占卜大廳
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
