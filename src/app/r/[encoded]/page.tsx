'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

function decodeResult(encoded: string) {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const data = JSON.parse(atob(base64 + '=='.slice(0, padding)));
    const changingLines = data.l.split('').map((c: string, i: number) => c === '1' ? i + 1 : 0).filter((x: number) => x !== 0);
    return {
      hexagramId: data.h,
      changedId: data.c || undefined,
      changingLines,
      token: data.t,
    };
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const params = useParams();
  const [data, setData] = useState<{ hexagramId: number; changedId?: number; changingLines: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = params.encoded as string;
    if (!encoded) {
      setError('無效的連結');
      return;
    }
    
    const decoded = decodeResult(encoded);
    if (!decoded) {
      setError('無法解析占卜結果');
      return;
    }
    
    setData(decoded);
  }, [params.encoded]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6">☰☷</div>
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <Link href="/" className="text-amber-400 hover:underline">
          前往占卜 →
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6 animate-pulse">☰☷</div>
        <p className="text-lg">載入中...</p>
      </div>
    );
  }

  const hexagramName = HEXAGRAM_NAMES[data.hexagramId] || '?';
  const changedName = data.changedId ? HEXAGRAM_NAMES[data.changedId] : null;
  const changingCount = data.changingLines.length;

  // Fortune rating
  const isAuspicious = [1,3,5,8,14,15,16,18,24,26,27,29,30,33,35,37,38,41,42,44,45,46,47,48,49,51,52,53,54,55,56,57,58,59,60,61,62,63,64].includes(data.hexagramId);
  const isInauspicious = [2,4,7,20,21,22,23,25,28,31,32,34,36,39,40,43,50].includes(data.hexagramId);
  
  let rating: string, color: string;
  if (changingCount === 0) {
    rating = isAuspicious ? '吉' : isInauspicious ? '凶' : '平';
    color = isAuspicious ? '#22C55E' : isInauspicious ? '#EF4444' : '#C9A227';
  } else if (changingCount <= 2) {
    rating = isAuspicious ? '吉帶變' : isInauspicious ? '凶帶變' : '平帶變';
    color = '#F59E0B';
  } else {
    rating = '大變動';
    color = '#8B5CF6';
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
      <div className="max-w-xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="text-sm opacity-50 mb-2" style={{ color: '#C9A227' }}>朋友分享的占卜結果</div>
          <div className="text-8xl mb-4">☰☷</div>
          <h1 className="text-4xl font-bold mb-2">{hexagramName}卦</h1>
          <div className="text-sm opacity-60">第{data.hexagramId}卦</div>
        </div>

        {/* Fortune Rating */}
        <div 
          className="inline-block px-8 py-4 rounded-xl mb-8"
          style={{ background: 'rgba(30,20,20,0.95)', border: `2px solid ${color}40` }}
        >
          <div className="text-4xl font-bold mb-2" style={{ color }}>{rating}</div>
          <div className="text-sm opacity-70">
            {changingCount === 0 && '靜卦，無變爻'}
            {changingCount > 0 && `含 ${changingCount} 個動爻`}
          </div>
        </div>

        {/* Changed Hexagram */}
        {changedName && (
          <div className="mb-8 pt-6 border-t border-amber-900/30">
            <div className="text-sm opacity-50 mb-2" style={{ color: '#C9A227' }}>變卦</div>
            <div className="text-4xl font-bold">{changedName}卦</div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-xl" style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <p className="text-lg mb-4 opacity-80">你也想知道自己的命運嗎？</p>
          <Link 
            href="/"
            className="inline-block px-8 py-3 text-lg rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7C1D1D 0%, #5C1515 100%)', border: '1px solid #C9A227', color: '#F5E6D3' }}
          >
            開始占卜
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm opacity-40">
          易經占卜 · mylife.first.pet
        </div>
      </div>
    </div>
  );
}
