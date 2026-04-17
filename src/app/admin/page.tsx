'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalDivinations: number;
  hexagramCounts: Record<number, number>;
  questionTypeCounts: Record<string, number>;
  changedHexagramRatio: number;
  avgChangingLines: string;
  recentDivinations: Array<{
    timestamp: string;
    hexagramName?: string;
    questionType?: string;
    hexagramId?: number;
  }>;
  topHexagrams: Array<{ id: number; count: number }>;
  // Extended analytics
  genderCounts: Record<string, number>;
  timeBucketCounts: Record<string, number>;
  dayOfWeekCounts: Record<string, number>;
  deviceTypeCounts: Record<string, number>;
  avgQuestionLength: number;
  topBirthYears: Array<{ decade: string; count: number }>;
  periodStart: string | null;
  periodEnd: string | null;
}

const HEXAGRAM_NAMES: Record<number, string> = {
  1: '乾', 2: '坤', 3: '屯', 4: '蒙', 5: '需', 6: '讼', 7: '师', 8: '比',
  9: '小畜', 10: '履', 11: '泰', 12: '否', 13: '同人', 14: '大有', 15: '谦', 16: '豫',
  17: '随', 18: '蛊', 19: '临', 20: '观', 21: '噬嗑', 22: '贲', 23: '剥', 24: '复',
  25: '无妄', 26: '大畜', 27: '颐', 28: '大过', 29: '坎', 30: '离', 31: '咸', 32: '恒',
  33: '遁', 34: '大壮', 35: '晋', 36: '明夷', 37: '家人', 38: '睽', 39: '蹇', 40: '解',
  41: '損', 42: '益', 43: '夬', 44: '姤', 45: '萃', 46: '升', 47: '困', 48: '井',
  49: '革', 50: '鼎', 51: '震', 52: '艮', 53: '漸', 54: '歸妹', 55: '豐', 56: '旅',
  57: '巽', 58: '兌', 59: '渙', 60: '節', 61: '中孚', 62: '小過', 63: '既濟', 64: '未濟',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  '事業': '事業', '財運': '財運', '感情': '感情',
  '學業': '學業', '健康': '健康', '人際': '人際',
  '出行': '出行', '決策': '決策', '其他': '其他',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Hong_Kong',
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center min-w-0">
      <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${color} truncate`}>{value}</div>
      <div className="text-gray-400 text-[10px] sm:text-xs mt-1 text-center leading-tight">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data.stats || data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    document.cookie = 'admin_auth=; Max-Age=0; path=/';
    window.location.href = '/admin/login';
  };

  const maxHexCount = stats ? Math.max(...Object.values(stats.hexagramCounts), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl shrink-0">📊</span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-amber-400 leading-tight truncate">易經占卜後台</h1>
                <p className="text-gray-500 text-[10px] sm:text-xs hidden sm:block">系統使用統計</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/admin/snapshots" className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs md:text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap">
                📋 記錄
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors text-sm"
                title="設置"
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs md:text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
              >
                登出
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 sm:p-2 text-gray-400"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 space-y-2">
          <Link href="/admin/snapshots" className="block py-2 text-gray-300 hover:text-amber-400" onClick={() => setMobileMenuOpen(false)}>
            📋 卜卦記錄
          </Link>
          <button onClick={handleLogout} className="block w-full text-left py-2 text-gray-400 hover:text-white">
            登出
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-gray-400">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <div className="text-base sm:text-lg">載入中...</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-red-400 mb-4 text-base sm:text-lg">載入失敗：{error}</div>
            <button onClick={fetchStats} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors">
              重試
            </button>
          </div>
        )}

        {stats && !loading && !error && (
          <>
            {/* KPI Cards */}
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <StatCard label="占卜總次數" value={stats.totalDivinations} color="text-amber-400" />
                <StatCard label="有變卦比例" value={`${stats.changedHexagramRatio}%`} color="text-green-400" />
                <StatCard label="平均動爻數" value={stats.avgChangingLines} color="text-blue-400" />
                <StatCard label="不同卦象數" value={Object.keys(stats.hexagramCounts).length} color="text-purple-400" />
              </div>
            </section>

            {/* Recent + Question Types */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Recent */}
              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-bold text-amber-400 mb-3 sm:mb-4">最近占卜</h2>
                {stats.recentDivinations.length === 0 ? (
                  <div className="text-gray-500 py-6 sm:py-8 text-center text-xs sm:text-sm">暫無記錄</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stats.recentDivinations.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-800 last:border-0 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">{formatDate(r.timestamp)}</span>
                          <span className="text-amber-400 font-bold text-sm sm:text-base shrink-0">
                            {HEXAGRAM_NAMES[r.hexagramId!] || '?'}卦
                          </span>
                        </div>
                        <span className="text-gray-400 text-[10px] sm:text-xs shrink-0 ml-1 sm:ml-2">
                          {r.questionType ? `問${r.questionType}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Types */}
              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-bold text-amber-400 mb-3 sm:mb-4">問題類別分佈</h2>
                {Object.keys(stats.questionTypeCounts).length === 0 ? (
                  <div className="text-gray-500 py-6 sm:py-8 text-center text-xs sm:text-sm">暫無數據</div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(stats.questionTypeCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="w-10 sm:w-14 text-gray-300 text-xs sm:text-sm shrink-0 truncate">{QUESTION_TYPE_LABELS[type] || type}</span>
                          <div className="flex-1 h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden min-w-0">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{
                                width: `${(count / Math.max(...Object.values(stats.questionTypeCounts))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-gray-400 text-[10px] sm:text-xs w-8 sm:w-10 text-right shrink-0">{count}次</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </section>

            {/* Top Hexagrams */}
            <section className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-bold text-amber-400 mb-3 sm:mb-4">熱門卦象 Top 5</h2>
              {stats.topHexagrams.length === 0 ? (
                <div className="text-gray-500 py-6 sm:py-8 text-center text-xs sm:text-sm">暫無數據</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                  {stats.topHexagrams.map((item) => (
                    <div key={item.id} className="bg-gray-800/50 rounded-xl p-2 sm:p-3 text-center min-w-0">
                      <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{HEXAGRAM_NAMES[item.id] || '?'}</div>
                      <div className="text-gray-500 text-[10px] sm:text-xs mb-1 sm:mb-2">第{item.id}卦</div>
                      <div className="h-1 sm:h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(item.count / maxHexCount) * 100}%` }}
                        />
                      </div>
                      <div className="text-amber-400 text-xs sm:text-sm font-bold mt-1">{item.count}次</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 64 Hexagram Heatmap — 移動端左右滑動 */}
            <section className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-bold text-amber-400 mb-3 sm:mb-4">六十四卦分佈圖</h2>

              {/* 移動端：可滑動；桌面端：自適應 */}
              <div className="overflow-x-auto rounded-lg">
                <div
                  className="grid gap-[2px] w-max mx-auto"
                  style={{
                    gridTemplateColumns: 'repeat(8, minmax(28px, 36px))',
                  }}
                >
                  {Array.from({ length: 64 }, (_, i) => {
                    const id = i + 1;
                    const count = stats.hexagramCounts[id] || 0;
                    const intensity = count / maxHexCount;
                    return (
                      <div
                        key={id}
                        className="aspect-square rounded flex items-center justify-center text-[10px] sm:text-xs cursor-default select-none"
                        style={{
                          backgroundColor: count > 0
                            ? `rgba(201, 162, 39, ${0.15 + intensity * 0.6})`
                            : 'rgba(75, 85, 99, 0.2)',
                          color: count > 0 ? '#F5E6D3' : '#4B5563',
                          minWidth: 28,
                          minHeight: 28,
                        }}
                        title={`${HEXAGRAM_NAMES[id]}（第${id}卦）：${count}次`}
                      >
                        {count > 0 ? count : '·'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
                {[
                  { color: 'rgba(75, 85, 99, 0.2)', label: '無記錄' },
                  { color: 'rgba(201,162,39,0.3)', label: '較少' },
                  { color: 'rgba(201,162,39,0.75)', label: '較多' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-gray-500 text-[10px] sm:text-xs whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Extended Analytics */}
            <section className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-bold text-amber-400 mb-3 sm:mb-4">使用分析</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Time Buckets */}
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2">時段分佈</div>
                  <div className="space-y-1">
                    {Object.entries(stats.timeBucketCounts || {}).map(([bucket, count]) => {
                      const labels: Record<string,string> = { morning: '🌅 早晨', afternoon: '☀️ 午後', evening: '🌆 傍晚', night: '🌙 深夜' };
                      return (
                        <div key={bucket} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                          <span className="text-gray-400 w-14 sm:w-16 shrink-0">{labels[bucket] || bucket}</span>
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / Math.max(...Object.values(stats.timeBucketCounts || {}), 1)) * 100}%` }} />
                          </div>
                          <span className="text-gray-500 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                    {Object.keys(stats.timeBucketCounts || {}).length === 0 && <div className="text-gray-600 text-[10px]">暫無數據</div>}
                  </div>
                </div>

                {/* Day of Week */}
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2">星期分佈</div>
                  <div className="space-y-1">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                      const count = stats.dayOfWeekCounts?.[d] || 0;
                      return (
                        <div key={d} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                          <span className="text-gray-400 w-6 shrink-0">{d}</span>
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / Math.max(...Object.values(stats.dayOfWeekCounts || {}), 1)) * 100}%` }} />
                          </div>
                          <span className="text-gray-500 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device Types */}
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2">裝置類型</div>
                  <div className="space-y-1.5">
                    {Object.entries(stats.deviceTypeCounts || {}).map(([device, count]) => {
                      const icons: Record<string,string> = { mobile: '📱', tablet: '📲', desktop: '💻', unknown: '❓' };
                      return (
                        <div key={device} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                          <span className="text-base">{icons[device] || '📱'}</span>
                          <span className="text-gray-400 capitalize">{device}</span>
                          <span className="text-gray-600 ml-auto">{count}</span>
                        </div>
                      );
                    })}
                    {Object.keys(stats.deviceTypeCounts || {}).length === 0 && <div className="text-gray-600 text-[10px]">暫無數據</div>}
                  </div>
                </div>

                {/* Gender & Question Length */}
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2">性別 / 問題長度</div>
                  <div className="space-y-1.5 text-[10px] sm:text-xs">
                    {Object.entries(stats.genderCounts || {}).map(([g, count]) => (
                      <div key={g} className="flex items-center gap-1.5">
                        <span>{g === '男' ? '♂' : g === '女' ? '♀' : '⚪'}</span>
                        <span className="text-gray-400">{g || '未知'}</span>
                        <span className="text-gray-600 ml-auto">{count}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-gray-800">
                      <span className="text-gray-500">平均問題長度：</span>
                      <span className="text-amber-400 ml-1">{stats.avgQuestionLength || 0}字</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div className="bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-amber-400">⚙️ 設置</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-lg sm:text-xl p-1">✕</button>
            </div>

            {/* Environment Config */}
            <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs text-gray-400 leading-relaxed space-y-2">
              <p className="font-semibold text-gray-300">⚙️ 環境配置</p>
              <p>管理員密碼由伺服器環境變量 <code className="text-amber-400">ADMIN_PASSWORD</code> 控制。如需更改密碼，請更新伺服器上的環境變量後重啟服務。</p>
              <p className="text-gray-500">預設密碼：<code className="text-amber-400">mylife-admin-2026</code>（請在生產環境修改）</p>
            </div>

            {/* Links */}
            <div className="flex gap-2 sm:gap-3">
              <Link href="/admin/snapshots" className="flex-1 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-center text-xs sm:text-sm transition-colors">
                📋 卜卦記錄
              </Link>
              <Link href="/" className="flex-1 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-center text-xs sm:text-sm transition-colors">
                ← 占卜首頁
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
