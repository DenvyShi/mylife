'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { assessFortune } from '@/lib/interpretation';

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

const QUESTION_LABELS: Record<string, string> = {
  '事業': '📊', '財運': '💰', '感情': '💕', '學業': '📚',
  '健康': '🏥', '人際': '👥', '出行': '✈️', '決策': '⚖️', '其他': '🔮',
};

interface DivinationRecord {
  id: number;
  timestamp: string;
  hexagramId: number;
  hexagramName: string;
  questionType?: string;
  hasChangedHexagram: boolean;
  changingLinesCount: number;
  shareUrl?: string;
  gender?: string;
  birthYear?: number;
  timeBucket?: string;
  dayOfWeek?: string;
  deviceType?: string;
}

interface Stats {
  totalDivinations: number;
  hexagramCounts: Record<number, number>;
  questionTypeCounts: Record<string, number>;
  changedHexagramRatio: number;
  avgChangingLines: string;
  topHexagrams: Array<{ id: number; count: number }>;
  genderCounts: Record<string, number>;
  timeBucketCounts: Record<string, number>;
  dayOfWeekCounts: Record<string, number>;
  deviceTypeCounts: Record<string, number>;
  avgQuestionLength: number;
  topBirthYears: Array<{ decade: string; count: number }>;
}

type Tab = 'recent' | 'stats' | 'analytics';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Hong_Kong',
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function getFortuneClass(rating: string): string {
  if (rating.includes('吉') && !rating.includes('凶')) return 'fortune-legendary';
  if (rating.includes('平') && !rating.includes('凶')) return 'fortune-rare';
  if (rating.includes('凶')) return 'fortune-poor';
  return 'fortune-default';
}

function getFortuneEmoji(rating: string): string {
  if (rating.includes('大吉')) return '⭐';
  if (rating.includes('吉')) return '✔';
  if (rating.includes('平')) return '○';
  if (rating.includes('凶') && !rating.includes('大')) return '✘';
  if (rating.includes('大凶')) return '💀';
  return '◐';
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const [showSettings, setShowSettings] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, recordsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/analytics?all=true'),
      ]);
      if (!statsRes.ok || !recordsRes.ok) throw new Error('Fetch failed');
      const statsData = await statsRes.json();
      const recordsData = await recordsRes.json();
      setStats(statsData.stats || statsData);
      setRecords(recordsData.records || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    document.cookie = 'admin_auth=; Max-Age=0; path=/';
    window.location.href = '/admin/login';
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
  };

  const topHexCount = stats ? Math.max(...Object.values(stats.hexagramCounts), 1) : 1;

  return (
    <div className="min-h-screen" style={{ background: '#0a0806', color: '#F0D060' }}>
      {/* ── Top Navigation ── */}
      <nav className="wow-nav sticky top-0 z-50">
        <div className="flex items-center justify-between px-3 h-12">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(201,162,39,0.5))' }}>⚔️</span>
            <div className="min-w-0">
              <div className="wow-title text-xs leading-tight truncate">易經占卜</div>
              <div className="text-[9px] text-[#5c4a2a] tracking-wider">GUILD MANAGEMENT</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowSettings(true)} className="wow-btn text-[10px] px-2 py-1 rounded-sm">
              ⚙
            </button>
            <button onClick={handleLogout} className="wow-btn text-[10px] px-2 py-1 rounded-sm">
              登出
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-[#3d2e1a]">
          {([
            ['recent', '📋 最近'],
            ['stats', '📊 統計'],
            ['analytics', '📈 分析'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`wow-tab flex-1 text-center ${activeTab === tab ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="p-3 space-y-3 max-w-2xl mx-auto">

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="wow-panel p-4 space-y-2">
                <div className="wow-skeleton h-4 w-3/4" />
                <div className="wow-skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="wow-panel p-5 text-center">
            <div className="text-[#FCA5A5] text-sm mb-3">載入失敗：{error}</div>
            <button onClick={fetchData} className="wow-btn wow-btn-gold rounded-sm text-xs">重新載入</button>
          </div>
        )}

        {/* ── TAB: RECENT DIVINATIONS ── */}
        {!loading && !error && activeTab === 'recent' && (
          <>
            {/* Header stats strip */}
            {stats && (
              <div className="wow-panel">
                <div className="wow-panel-header py-2">
                  <span className="wow-title text-[10px] tracking-widest">占卜概覽</span>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2">
                  {[
                    { label: '總次數', value: stats.totalDivinations, color: '#F0D060' },
                    { label: '變卦率', value: `${stats.changedHexagramRatio}%`, color: '#A335EE' },
                    { label: '平均動爻', value: stats.avgChangingLines, color: '#0070DD' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="text-base font-bold" style={{ color }}>{value}</div>
                      <div className="text-[9px] text-[#5c4a2a] mt-0.5 tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent list */}
            {records.length === 0 ? (
              <div className="wow-panel p-8 text-center">
                <div className="text-3xl mb-3 opacity-30">☰☷</div>
                <div className="text-[#5c4a2a] text-xs tracking-wider">暫無占卜記錄</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-[#5c4a2a] tracking-widest">最近 {Math.min(records.length, 20)} 條記錄</span>
                  <span className="text-[10px] text-[#5c4a2a]">共 {records.length} 條</span>
                </div>
                {records.slice(0, 20).map((r) => {
                  const fortune = assessFortune(r.hexagramId, r.changingLinesCount);
                  const hexName = HEXAGRAM_NAMES[r.hexagramId] || '?';
                  return (
                    <div key={r.id} className="wow-panel overflow-hidden">
                      <div className="wow-panel-header py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Fortune badge */}
                          <span className={`text-xs font-bold shrink-0 ${getFortuneClass(fortune.rating)}`}>
                            {getFortuneEmoji(fortune.rating)} {fortune.rating}
                          </span>
                          {/* Hexagram */}
                          <span className="hex-symbol text-sm shrink-0" style={{ color: '#F0D060' }}>
                            {hexName}卦
                          </span>
                          {/* Meta */}
                          <span className="text-[10px] text-[#5c4a2a] truncate">
                            {r.questionType ? `${QUESTION_LABELS[r.questionType] || ''} ${r.questionType}` : ''}
                          </span>
                          {r.hasChangedHexagram && (
                            <span className="text-[9px] px-1 py-0.5 rounded-sm shrink-0" style={{ background: 'rgba(163,53,238,0.15)', color: '#A335EE', border: '1px solid rgba(163,53,238,0.3)' }}>
                              變
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-[#3d2e1a] mt-0.5">{formatTime(r.timestamp)}</div>
                      </div>

                      {/* Share URL row */}
                      {r.shareUrl && (
                        <div className="px-3 py-2 border-t border-[#2a1f14] flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              readOnly
                              value={r.shareUrl}
                              className="w-full text-[10px] bg-transparent border-none outline-none text-[#5c4a2a] truncate cursor-pointer"
                              onClick={() => { if (r.shareUrl) copyUrl(r.shareUrl); }}
                              title="點擊複製"
                            />
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <a
                              href={r.shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wow-btn text-[10px] px-2 py-1 rounded-sm"
                              style={{ fontSize: '10px', padding: '3px 8px' }}
                            >
                              查看
                            </a>
                            <button
                              onClick={() => { if (r.shareUrl) copyUrl(r.shareUrl); }}
                              className="wow-btn text-[10px] px-2 py-1 rounded-sm"
                              style={{ fontSize: '10px', padding: '3px 8px' }}
                            >
                              複製
                            </button>
                          </div>
                        </div>
                      )}

                      {!r.shareUrl && (
                        <div className="px-3 py-2 border-t border-[#2a1f14]">
                          <a
                            href={`/r/${btoa(JSON.stringify({ h: r.hexagramId, c: 0, l: '0'.repeat(r.changingLinesCount).padStart(6,'0'), ls: '0'.repeat(6) })).replace(/=/g,'')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wow-btn text-[10px] inline-block"
                            style={{ fontSize: '10px', padding: '3px 10px' }}
                          >
                            查看卦象
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── TAB: STATS ── */}
        {!loading && !error && activeTab === 'stats' && stats && (
          <div className="space-y-3">
            {/* KPI */}
            <div className="wow-panel">
              <div className="wow-panel-header">
                <span className="wow-title text-[10px] tracking-widest">關鍵指標</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  { label: '占卜總次數', value: stats.totalDivinations, color: '#F0D060' },
                  { label: '有變卦比例', value: `${stats.changedHexagramRatio}%`, color: '#A335EE' },
                  { label: '平均動爻數', value: stats.avgChangingLines, color: '#0070DD' },
                  { label: '不同卦象', value: Object.keys(stats.hexagramCounts).length, color: '#1EFF00' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-sm text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2a1f14' }}>
                    <div className="text-xl font-bold" style={{ color }}>{value}</div>
                    <div className="text-[9px] text-[#5c4a2a] mt-0.5 tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hexagram heatmap */}
            <div className="wow-panel">
              <div className="wow-panel-header">
                <span className="wow-title text-[10px] tracking-widest">六十四卦分佈</span>
              </div>
              <div className="p-3">
                <div className="overflow-x-auto">
                  <div className="grid gap-[2px] w-max mx-auto" style={{ gridTemplateColumns: 'repeat(8, minmax(24px, 32px))' }}>
                    {Array.from({ length: 64 }, (_, i) => {
                      const id = i + 1;
                      const count = stats.hexagramCounts[id] || 0;
                      const intensity = count / topHexCount;
                      return (
                        <div
                          key={id}
                          className="aspect-square rounded-sm flex items-center justify-center text-[9px] cursor-default select-none"
                          style={{
                            backgroundColor: count > 0 ? `rgba(201,162,39,${0.15 + intensity * 0.6})` : 'rgba(42,31,20,0.3)',
                            color: count > 0 ? '#F0D060' : '#3d2e1a',
                            minWidth: 24,
                            minHeight: 24,
                          }}
                          title={`${HEXAGRAM_NAMES[id]}第${id}卦：${count}次`}
                        >
                          {count > 0 ? count : '·'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {[
                    { color: 'rgba(42,31,20,0.3)', label: '無' },
                    { color: 'rgba(201,162,39,0.3)', label: '少' },
                    { color: 'rgba(201,162,39,0.75)', label: '多' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-[9px] text-[#5c4a2a]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top hexagrams */}
            <div className="wow-panel">
              <div className="wow-panel-header">
                <span className="wow-title text-[10px] tracking-widest">熱門卦象 TOP 5</span>
              </div>
              <div className="p-3">
                {stats.topHexagrams.length === 0 ? (
                  <div className="text-center text-[#3d2e1a] text-xs py-4">暫無數據</div>
                ) : (
                  <div className="space-y-2">
                    {stats.topHexagrams.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div className="text-lg w-7 text-center" style={{ color: '#F0D060' }}>{HEXAGRAM_NAMES[item.id]}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#5c4a2a]">第{item.id}卦</span>
                            <span className="text-xs font-bold" style={{ color: '#F0D060' }}>{item.count}次</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2a1f14' }}>
                            <div className="h-full rounded-full" style={{ width: `${(item.count / topHexCount) * 100}%`, background: 'linear-gradient(90deg, #8B6914, #D4AF37)' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Question types */}
            <div className="wow-panel">
              <div className="wow-panel-header">
                <span className="wow-title text-[10px] tracking-widest">問題類別</span>
              </div>
              <div className="p-3 space-y-2">
                {Object.entries(stats.questionTypeCounts).sort(([,a],[,b]) => b-a).length === 0 ? (
                  <div className="text-center text-[#3d2e1a] text-xs py-4">暫無數據</div>
                ) : (
                  Object.entries(stats.questionTypeCounts).sort(([,a],[,b]) => b-a).map(([type, count]) => {
                    const max = Math.max(...Object.values(stats.questionTypeCounts));
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-sm w-6 text-center shrink-0">{QUESTION_LABELS[type] || '🔮'}</span>
                        <span className="text-[10px] text-[#5c4a2a] w-12 shrink-0">{type}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#2a1f14' }}>
                          <div className="h-full rounded-full" style={{ width: `${(count/max)*100}%`, background: '#0070DD' }} />
                        </div>
                        <span className="text-[10px] text-[#5c4a2a] w-6 text-right shrink-0">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ANALYTICS ── */}
        {!loading && !error && activeTab === 'analytics' && stats && (
          <div className="space-y-3">
            {/* Time / Device / Gender */}
            <div className="wow-panel">
              <div className="wow-panel-header">
                <span className="wow-title text-[10px] tracking-widest">使用分析</span>
              </div>
              <div className="p-3 space-y-4">
                {/* Time buckets */}
                <div>
                  <div className="text-[10px] text-[#5c4a2a] tracking-wider mb-2">時段分佈</div>
                  <div className="space-y-1.5">
                    {Object.entries({ morning: '🌅 早晨', afternoon: '☀️ 午後', evening: '🌆 傍晚', night: '🌙 深夜' }).map(([bucket, label]) => {
                      const count = stats.timeBucketCounts?.[bucket] || 0;
                      const total = Object.values(stats.timeBucketCounts || {}).reduce((a,b) => a+b, 1);
                      return (
                        <div key={bucket} className="flex items-center gap-2 text-[10px]">
                          <span className="w-14 shrink-0 text-[#8B6914]">{label}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#2a1f14' }}>
                            <div className="h-full rounded-full" style={{ width: `${(count/total)*100}%`, background: '#D4AF37' }} />
                          </div>
                          <span className="w-4 text-right text-[#5c4a2a]">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day of week */}
                <div>
                  <div className="text-[10px] text-[#5c4a2a] tracking-wider mb-2">星期分佈</div>
                  <div className="flex gap-1">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                      const count = stats.dayOfWeekCounts?.[d] || 0;
                      const max = Math.max(...Object.values(stats.dayOfWeekCounts || {}), 1);
                      return (
                        <div key={d} className="flex-1 text-center">
                          <div className="h-8 rounded-sm overflow-hidden flex flex-col justify-end" style={{ background: '#2a1f14' }}>
                            <div className="rounded-sm" style={{ height: `${Math.max((count/max)*100, 4)}%`, background: '#0070DD' }} />
                          </div>
                          <div className="text-[8px] text-[#5c4a2a] mt-1">{d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device / Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-[#5c4a2a] tracking-wider mb-2">裝置</div>
                    <div className="space-y-1">
                      {Object.entries(stats.deviceTypeCounts || {}).map(([d, c]) => {
                        const icons: Record<string,string> = { mobile: '📱', tablet: '📲', desktop: '💻', unknown: '❓' };
                        return (
                          <div key={d} className="flex items-center gap-1.5 text-[10px]">
                            <span>{icons[d] || '📱'}</span>
                            <span className="capitalize text-[#8B6914]">{d}</span>
                            <span className="ml-auto text-[#5c4a2a]">{c}</span>
                          </div>
                        );
                      })}
                      {Object.keys(stats.deviceTypeCounts || {}).length === 0 && <div className="text-[9px] text-[#3d2e1a]">暫無</div>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5c4a2a] tracking-wider mb-2">性別</div>
                    <div className="space-y-1">
                      {Object.entries(stats.genderCounts || {}).map(([g, c]) => (
                        <div key={g} className="flex items-center gap-1.5 text-[10px]">
                          <span>{g === '男' ? '♂' : g === '女' ? '♀' : '⚪'}</span>
                          <span className="text-[#8B6914]">{g || '未知'}</span>
                          <span className="ml-auto text-[#5c4a2a]">{c}</span>
                        </div>
                      ))}
                      {Object.keys(stats.genderCounts || {}).length === 0 && <div className="text-[9px] text-[#3d2e1a]">暫無</div>}
                      <div className="pt-1 border-t border-[#2a1f14] text-[10px]">
                        <span className="text-[#5c4a2a]">平均問題：</span>
                        <span className="text-[#F0D060]">{stats.avgQuestionLength}字</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div className="wow-panel w-full max-w-xs rounded-sm overflow-hidden">
            <div className="wow-ornament-corner tl" />
            <div className="wow-ornament-corner tr" />
            <div className="wow-ornament-corner bl" />
            <div className="wow-ornament-corner br" />
            <div className="wow-panel-header">
              <span className="wow-title text-xs tracking-widest">設置</span>
              <button onClick={() => setShowSettings(false)} className="ml-auto text-[#5c4a2a] hover:text-[#D4AF37] text-sm">✕</button>
            </div>
            <div className="p-4 space-y-3 text-xs text-[#8B6914] leading-relaxed">
              <p>管理員密碼由伺服器環境變量 <span className="text-[#F0D060]">ADMIN_PASSWORD</span> 控制。更改密碼請更新伺服器環境變量後重啟服務。</p>
              <p className="text-[#5c4a2a]">預設密碼：<span className="text-[#F0D060]">mylife-admin-2026</span></p>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Link href="/admin/snapshots" className="wow-btn flex-1 text-center text-[10px] rounded-sm">
                📋 記錄
              </Link>
              <Link href="/" className="wow-btn flex-1 text-center text-[10px] rounded-sm">
                ← 占卜
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
