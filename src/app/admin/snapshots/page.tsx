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
  shareUrl?: string;
}

const HEXAGRAM_NAMES: Record<number, string> = {
  1: '乾', 2: '坤', 3: '屯', 4: '蒙', 5: '需', 6: '讼', 7: '师', 8: '比',
  9: '小畜', 10: '履', 11: '泰', 12: '否', 13: '同人', 14: '大有', 15: '谦', 16: '豫',
  17: '随', 18: '蛊', 19: '临', 20: '观', 21: '噬嗑', 22: '贲', 23: '剥', 24: '复',
  25: '無妄', 26: '大畜', 27: '颐', 28: '大過', 29: '坎', 30: '离', 31: '咸', 32: '恒',
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

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Hong_Kong',
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SnapshotsPage() {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics?all=true');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyShareUrl = async (record: DivinationRecord) => {
    if (!record.shareUrl) return;
    try {
      await navigator.clipboard.writeText(record.shareUrl);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('複製失敗，請手動複製');
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = filter === '' ||
      HEXAGRAM_NAMES[r.hexagramId]?.includes(filter) ||
      r.questionType?.includes(filter) ||
      r.hexagramName?.includes(filter);
    const matchesType = typeFilter === 'all' || r.questionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredStats = {
    total: filteredRecords.length,
    withChange: filteredRecords.filter(r => r.hasChangedHexagram).length,
    avgLines: filteredRecords.length > 0
      ? (filteredRecords.reduce((sum, r) => sum + (r.changingLinesCount || 0), 0) / filteredRecords.length).toFixed(2)
      : '0.00',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button onClick={() => history.back()} className="text-gray-400 hover:text-white text-base sm:text-lg shrink-0">←</button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-amber-400 leading-tight truncate">📋 卜卦記錄</h1>
                <p className="text-gray-500 text-[10px] sm:text-xs hidden sm:block">所有占卜歷史</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link href="/admin" className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs md:text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap">
                📊 統計
              </Link>
              <Link href="/" className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs md:text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap">
                占卜首頁
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-3 sm:space-y-4">

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: '總記錄', value: filteredStats.total, color: 'text-amber-400' },
            { label: '有變卦', value: filteredStats.withChange, color: 'text-green-400' },
            { label: '平均動爻', value: filteredStats.avgLines, color: 'text-blue-400' },
            { label: '變卦率', value: filteredStats.total > 0 ? `${Math.round((filteredStats.withChange / filteredStats.total) * 100)}%` : '0%', color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 sm:p-4 text-center min-w-0">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${color} truncate`}>{value}</div>
              <div className="text-gray-400 text-[10px] sm:text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="搜尋卦名..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 min-w-[120px] sm:min-w-40 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-amber-500 text-white text-xs sm:text-sm placeholder-gray-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-amber-500 text-white text-xs sm:text-sm"
          >
            <option value="all" className="bg-gray-900">全部</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-gray-900">{label}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="px-4 py-2 sm:py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors text-xs sm:text-sm font-medium"
          >
            刷新
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-400">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <div className="text-sm sm:text-base">載入中...</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-red-400 mb-4 text-sm sm:text-base">載入失敗：{error}</div>
            <button onClick={fetchData} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors">
              重試
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2 sm:space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-10 sm:py-12 text-gray-500 text-xs sm:text-sm">暫無記錄</div>
              ) : (
                filteredRecords.map((record) => (
                  <div key={record.id} className="bg-white/5 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xl sm:text-2xl font-bold text-amber-400">
                            {HEXAGRAM_NAMES[record.hexagramId] || '?'}卦
                          </span>
                          <span className="text-gray-500 text-xs sm:text-sm">#{record.hexagramId}</span>
                          {record.hasChangedHexagram && (
                            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-purple-900/40 text-purple-400 rounded">變</span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{formatTimestamp(record.timestamp)}</div>
                        {record.questionType && (
                          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                            {QUESTION_TYPE_LABELS[record.questionType] || record.questionType}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-base sm:text-lg font-bold ${
                          (record.changingLinesCount || 0) === 0 ? 'text-gray-500' :
                          (record.changingLinesCount || 0) <= 2 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {record.changingLinesCount || 0}爻
                        </div>
                      </div>
                    </div>
                    {record.shareUrl && (
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-800">
                        <input
                          type="text"
                          readOnly
                          value={record.shareUrl}
                          className="flex-1 min-w-0 text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 truncate"
                        />
                        <button
                          onClick={() => copyShareUrl(record)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-colors shrink-0 ${
                            copiedId === record.id
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {copiedId === record.id ? '已複製 ✓' : '複製'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white/5 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-gray-800/80">
                    <tr>
                      {['#', '時間', '卦象', '類型', '動爻', '變卦', '分享'].map((h, i) => (
                        <th key={h} className={`px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-400 ${i === 0 ? '' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 sm:py-12 text-center text-gray-500 text-sm">暫無記錄</td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 text-xs sm:text-sm">{record.id}</td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-400 whitespace-nowrap">{formatTimestamp(record.timestamp)}</td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <span className="font-bold text-amber-400 text-sm sm:text-base">
                              {HEXAGRAM_NAMES[record.hexagramId] || '?'}卦
                            </span>
                            <span className="text-gray-500 ml-1 sm:ml-2 text-xs sm:text-sm">#{record.hexagramId}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            {record.questionType ? (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-800 rounded text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                                {QUESTION_TYPE_LABELS[record.questionType] || record.questionType}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs sm:text-sm">—</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <span className={`font-bold text-xs sm:text-sm ${
                              (record.changingLinesCount || 0) === 0 ? 'text-gray-500' :
                              (record.changingLinesCount || 0) <= 2 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {record.changingLinesCount || 0}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            {record.hasChangedHexagram
                              ? <span className="text-purple-400 text-sm">✓</span>
                              : <span className="text-gray-600 text-sm">—</span>
                            }
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            {record.shareUrl ? (
                              <button
                                onClick={() => copyShareUrl(record)}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                                  copiedId === record.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                              >
                                {copiedId === record.id ? '已複製 ✓' : '複製'}
                              </button>
                            ) : (
                              <span className="text-gray-600 text-xs sm:text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center text-gray-500 text-[10px] sm:text-sm py-2">
              顯示 {filteredRecords.length} 條（共 {records.length} 條）
            </div>
          </>
        )}
      </main>
    </div>
  );
}
