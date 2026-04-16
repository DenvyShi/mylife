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
  }>;
  topHexagrams: Array<{ id: number; count: number }>;
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
  '事業': 'Career', '財運': 'Wealth', '感情': 'Relationships',
  '學業': 'Studies', '健康': 'Health', '人際': 'Social',
  '出行': 'Travel', '決策': 'Decision', '其他': 'Other',
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">易經占卜 - 統計</h1>
        <p className="text-gray-400 mb-8">Usage Statistics</p>

        {loading && (
          <div className="text-center py-12">
            <div className="text-xl mb-4">載入中...</div>
            <button onClick={fetchStats} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
              重試
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">錯誤: {error}</div>
            <button onClick={fetchStats} className="px-6 py-3 bg-amber-600 rounded-lg hover:bg-amber-500">
              重試
            </button>
          </div>
        )}

        {stats && !loading && !error && (
          <>
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

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-amber-400">熱門卦象 Top 5</h2>
                {stats.topHexagrams.length === 0 ? (
                  <div className="text-gray-500">No data</div>
                ) : (
                  <div className="space-y-3">
                    {stats.topHexagrams.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <span className="text-gray-500 w-6">{i + 1}</span>
                        <span className="text-2xl w-12">{HEXAGRAM_NAMES[item.id] || '?'}</span>
                        <span className="text-gray-400">#{item.id}</span>
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

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-amber-400">問題類別</h2>
                {Object.keys(stats.questionTypeCounts).length === 0 ? (
                  <div className="text-gray-500">No data</div>
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

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-amber-400">64卦熱力圖</h2>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 64 }, (_, i) => {
                  const id = i + 1;
                  const count = stats.hexagramCounts[id] || 0;
                  const maxCount = Math.max(...Object.values(stats.hexagramCounts), 1);
                  const intensity = count / maxCount;
                  return (
                    <div 
                      key={id}
                      className="aspect-square rounded flex items-center justify-center text-xs"
                      style={{ 
                        backgroundColor: count > 0 
                          ? `rgba(201, 162, 39, ${0.15 + intensity * 0.6})` 
                          : 'rgba(75, 85, 99, 0.3)',
                      }}
                      title={`${HEXAGRAM_NAMES[id]} (${id}): ${count}次`}
                    >
                      {count > 0 && <span className="opacity-80">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/admin/snapshots" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors">
            📋 查看所有卜卦記錄
          </Link>
          <Link href="/" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            ← 返回占卜
          </Link>
        </div>
      </div>
    </div>
  );
}
