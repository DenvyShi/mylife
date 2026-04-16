'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DivinationRecord {
  id: number;
  timestamp: string;
  hexagramId: number;
  hexagramName?: string;
  questionType?: string;
  hasChangedHexagram?: boolean;
  changingLinesCount?: number;
}

interface Stats {
  totalDivinations: number;
  hexagramCounts: Record<number, number>;
  questionTypeCounts: Record<string, number>;
  changedHexagramRatio: number;
  avgChangingLines: string;
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
  '事業': '📊 事業', '財運': '💰 財運', '感情': '💕 感情',
  '學業': '📚 學業', '健康': '🏥 健康', '人際': '👥 人際',
  '出行': '✈️ 出行', '決策': '⚖️ 決策', '其他': '🔮 其他',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', { 
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function SnapshotsPage() {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics?all=true');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = filter === '' || 
      HEXAGRAM_NAMES[r.hexagramId]?.includes(filter) ||
      r.questionType?.includes(filter);
    const matchesType = typeFilter === 'all' || r.questionType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate stats for filtered records
  const filteredStats = {
    total: filteredRecords.length,
    withChange: filteredRecords.filter(r => r.hasChangedHexagram).length,
    avgLines: filteredRecords.length > 0 
      ? (filteredRecords.reduce((sum, r) => sum + (r.changingLinesCount || 0), 0) / filteredRecords.length).toFixed(2)
      : '0.00',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-400">📊 卜卦記錄</h1>
              <p className="text-gray-400 mt-1">所有占卜快照記錄</p>
            </div>
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              ← 返回統計
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-amber-400">{filteredStats.total}</div>
            <div className="text-gray-400 text-sm">總記錄數</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{filteredStats.withChange}</div>
            <div className="text-gray-400 text-sm">有變卦</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">{filteredStats.avgLines}</div>
            <div className="text-gray-400 text-sm">平均動爻數</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400">
              {filteredStats.total > 0 ? Math.round((filteredStats.withChange / filteredStats.total) * 100) : 0}%
            </div>
            <div className="text-gray-400 text-sm">變卦率</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="搜尋卦名..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 flex-1 min-w-48"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="all">全部類型</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
          >
            刷新
          </button>
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-xl mb-4">載入中...</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">錯誤: {error}</div>
            <button onClick={fetchData} className="px-6 py-3 bg-amber-600 rounded-lg hover:bg-amber-500">
              重試
            </button>
          </div>
        )}

        {/* Records Table */}
        {!loading && !error && (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">時間</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">卦象</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">問題類型</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">動爻數</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">變卦</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          暫無記錄
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{record.id}</td>
                          <td className="px-4 py-3 text-sm">{formatTimestamp(record.timestamp)}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-amber-400">
                              {HEXAGRAM_NAMES[record.hexagramId] || '?'}卦
                            </span>
                            <span className="text-gray-500 ml-2">#{record.hexagramId}</span>
                          </td>
                          <td className="px-4 py-3">
                            {record.questionType && (
                              <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                                {QUESTION_TYPE_LABELS[record.questionType] || record.questionType}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${
                              (record.changingLinesCount || 0) === 0 ? 'text-gray-400' :
                              (record.changingLinesCount || 0) <= 2 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {record.changingLinesCount || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {record.hasChangedHexagram ? (
                              <span className="text-purple-400">✓ 有</span>
                            ) : (
                              <span className="text-gray-500">無</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-gray-500 text-sm text-center">
              顯示 {filteredRecords.length} 條記錄（共 {records.length} 條）
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          易經占卜分析系統 · 匿名數據收集 · mylife.first.pet
        </div>
      </div>
    </div>
  );
}
