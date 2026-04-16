'use client';

import { useState, useEffect } from 'react';

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
  }>;
  topHexagrams: Array<{ id: number; count: number }>;
  periodStart: string | null;
  periodEnd: string | null;
}

const HEXAGRAM_NAMES: Record<number, string> = {
  1: '乾', 2: '坤', 3: '屯', 4: '蒙', 5: '需', 6: '讼', 7: '师', 8: '比',
  9: '小畜', 10: '履', 11: '泰', 12: '否', 13: '同人', 14: '大有', 15: '谦', 16: '豫',
  17: '随', 18: '蛊', 19: '临', 20: '观', 21: '噬嗑', 22: '贲', 23: '剥', 24: '复',
  25: '无妄', 26: '大畜', 27: '颐', 28: '大过', 29: '坎', 30: '离', 31: '咸', 32: '恒',
  33: '遁', 34: '大壮', 35: '晋', 36: '明夷', 37: '家人', 38: '睽', 39: '蹇', 40: '解',
  41: '损', 42: '益', 43: '夬', 44: '姤', 45: '萃', 46: '升', 47: '困', 48: '井',
  49: '革', 50: '鼎', 51: '震', 52: '艮', 53: '渐', 54: '归妹', 55: '丰', 56: '旅',
  57: '巽', 58: '兑', 59: '涣', 60: '节', 61: '中孚', 62: '小过', 63: '既济', 64: '未济',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  '事業': 'Career',
  '財運': 'Wealth',
  '感情': 'Relationships',
  '學業': 'Studies',
  '健康': 'Health',
  '人際': 'Social',
  '出行': 'Travel',
  '決策': 'Decision',
  '其他': 'Other',
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-400">{error || 'No data'}</div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-HK', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">易經占卜 - 使用統計</h1>
        <p className="text-gray-400 mb-8">Usage Statistics</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl font-bold text-amber-400">{stats.totalDivinations}</div>
            <div className="text-gray-400 mt-1">占卜總次數</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl font-bold text-green-400">{stats.changedHexagramRatio}%</div>
            <div className="text-gray-400 mt-1">有變卦比例</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl font-bold text-blue-400">{stats.avgChangingLines}</div>
            <div className="text-gray-400 mt-1">平均動爻數</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl font-bold text-purple-400">
              {Object.keys(stats.hexagramCounts).length}
            </div>
            <div className="text-gray-400 mt-1">不同卦象數</div>
          </div>
        </div>

        {/* Period */}
        {stats.periodStart && (
          <div className="text-gray-400 mb-6 text-sm">
            統計周期：{formatDate(stats.periodStart)} ～ {formatDate(stats.periodEnd || stats.periodStart)}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Hexagrams */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-amber-400">熱門卦象 Top 5</h2>
            {stats.topHexagrams.length === 0 ? (
              <div className="text-gray-500">No data yet</div>
            ) : (
              <div className="space-y-3">
                {stats.topHexagrams.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="text-gray-500 w-6">{i + 1}</span>
                    <span className="text-2xl w-12">{HEXAGRAM_NAMES[item.id] || '?'}</span>
                    <span className="text-gray-400">第{item.id}卦</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500"
                        style={{ width: `${(item.count / stats.topHexagrams[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-400 w-8">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Types */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-amber-400">問題類別分布</h2>
            {Object.keys(stats.questionTypeCounts).length === 0 ? (
              <div className="text-gray-500">No data yet</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.questionTypeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-4">
                      <span className="w-20 text-gray-300">{QUESTION_TYPE_LABELS[type] || type}</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.questionTypeCounts))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-gray-400 w-8">{count}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Recent Divinations */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-amber-400">最近占卜</h2>
          {stats.recentDivinations.length === 0 ? (
            <div className="text-gray-500">No recent divinations</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">時間</th>
                    <th className="text-left py-2">卦象</th>
                    <th className="text-left py-2">類別</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDivinations.map((item, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      <td className="py-2 text-gray-400">{formatDate(item.timestamp)}</td>
                      <td className="py-2">{item.hexagramName || '?'}</td>
                      <td className="py-2 text-gray-400">
                        {QUESTION_TYPE_LABELS[item.questionType || ''] || item.questionType || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hexagram Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-amber-400">64卦分布</h2>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }, (_, i) => {
              const id = i + 1;
              const count = stats.hexagramCounts[id] || 0;
              const maxCount = Math.max(...Object.values(stats.hexagramCounts), 1);
              const intensity = count / maxCount;
              return (
                <div 
                  key={id}
                  className="aspect-square rounded flex items-center justify-center text-xs relative group"
                  style={{ 
                    backgroundColor: count > 0 
                      ? `rgba(201, 162, 39, ${0.1 + intensity * 0.6})` 
                      : 'rgba(75, 85, 99, 0.3)',
                  }}
                  title={`${HEXAGRAM_NAMES[id]} (${id}): ${count}次`}
                >
                  {count > 0 && <span className="opacity-80">{count}</span>}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                    {HEXAGRAM_NAMES[id]} ({id}): {count}次
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-2 mt-4 text-xs text-gray-500">
            <span>少</span>
            <div className="w-24 h-2 rounded" style={{ 
              background: 'linear-gradient(to right, rgba(75,85,99,0.3), rgba(201,162,39,0.7), rgba(201,162,39,1))' 
            }} />
            <span>多</span>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-8">
          <p>易經占卜 analytics · 匿名統計 · 不記錄個人信息</p>
          <p className="mt-1">每30秒自動刷新</p>
        </div>
      </div>
    </div>
  );
}
