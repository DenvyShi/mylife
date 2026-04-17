'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { assessFortune, interpretJudgment, computeWuxing } from '@/lib/interpretation';
import { decodeResult } from './shared';

interface DecodedData {
  hexagramId: number;
  changedId?: number;
  changingLines: number[];
  lineSymbols: string[];
  hexSymbols: string;
  questionType?: string;
}

export default function ResultClient() {
  const params = useParams();
  const [data, setData] = useState<DecodedData | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [changedHexagram, setChangedHexagram] = useState<Hexagram | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = typeof params.encoded === 'string'
      ? params.encoded
      : Array.isArray(params.encoded) ? params.encoded[0] : undefined;

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

    const h = hexagrams.find(x => x.id === decoded.hexagramId);
    const ch = decoded.changedId ? hexagrams.find(x => x.id === decoded.changedId) : null;

    setHexagram(h || null);
    setChangedHexagram(ch || null);
  }, [params]);

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6">☰☷</div>
        <h1 className="text-2xl font-bold mb-4">{error || '載入中...'}</h1>
        <Link href="/" className="text-amber-400 hover:underline">
          前往占卜 →
        </Link>
      </div>
    );
  }

  if (!hexagram) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6 animate-pulse">☰☷</div>
        <p className="text-lg">載入中...</p>
      </div>
    );
  }

  const fortune = assessFortune(data.hexagramId, data.changingLines.length);

  const getLineLabel = (pos: number) => {
    if (pos === 1) return '初爻';
    if (pos === 6) return '上爻';
    return `六${['', '二', '三', '四', '五'][pos - 1]}爻`;
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
      <div className="max-w-lg mx-auto">

        {/* Overall Fortune Assessment */}
        <div
          className="rounded-xl p-6 text-center mb-8"
          style={{
            background: 'rgba(30,20,20,0.95)',
            border: `2px solid ${fortune.color}40`
          }}
        >
          <div className="text-xs tracking-widest mb-3" style={{ color: '#C9A227' }}>
            ── 整體點評 ──
          </div>
          <div className="text-4xl font-bold mb-2" style={{ color: fortune.color }}>
            {fortune.emoji} {fortune.rating}
          </div>
          <p className="text-base leading-relaxed opacity-90 mb-2">
            {fortune.summary}
          </p>
          <div className="mt-3 text-sm opacity-60">
            {data.changingLines.length === 0 && '靜卦，無變爻'}
            {data.changingLines.length > 0 && `含 ${data.changingLines.length} 個動爻`}
          </div>

          {/* Score + Save image */}
          <div className="mt-5 pt-5 border-t flex items-center justify-center gap-6 flex-wrap" style={{ borderColor: 'rgba(201,162,39,0.15)' }}>
            {/* Score circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(201,162,39,0.15)" strokeWidth="8"/>
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={fortune.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(fortune.score || 50) * 2.513} 251.3`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs font-bold" style={{ color: fortune.color }}>{fortune.scoreLabel}</div>
                  <div className="text-xl font-bold" style={{ color: fortune.color, lineHeight: 1 }}>{fortune.score}</div>
                </div>
              </div>
              <div className="text-[10px] mt-1 text-amber-600/60">綜合評分</div>
            </div>

            {/* Save image button */}
            <div className="flex flex-col items-center gap-1">
              <a
                href={`/api/share-image?hex=${encodeURIComponent(hexagram.name)}&hexId=${hexagram.id}&changed=${encodeURIComponent(changedHexagram?.name || '')}&changedId=${changedHexagram?.id || ''}&rating=${encodeURIComponent(fortune.rating)}&score=${fortune.score}&scoreLabel=${encodeURIComponent(fortune.scoreLabel)}&judgment=${encodeURIComponent(hexagram.judgment)}&image=${encodeURIComponent(hexagram.image)}&advice=${encodeURIComponent(fortune.advice)}&symbols=${data.hexSymbols || '000000'}&lines=${Array.from({length:6},(_,i)=>data.changingLines.includes(i+1)?'1':'0').join('')}&questionType=${encodeURIComponent(data.questionType || '')}`}
                download
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: '#0a0806',
                  boxShadow: '0 2px 12px rgba(201,162,39,0.3)',
                }}
              >
                <span>💾</span>
                <span>保存卦象圖</span>
              </a>
              <div className="text-[10px] text-amber-600/60">點擊下載 SVG 圖片</div>
            </div>
          </div>
        </div>

        {/* Main Hexagram */}
        <div className="text-center mb-6">
          <div className="text-xs tracking-widest opacity-50 mb-3" style={{ color: '#C9A227' }}>
            本卦
          </div>
          <div className="text-5xl mb-3">{hexagram.symbol}</div>
          <h1 className="text-3xl font-bold mb-1">{hexagram.name}卦</h1>
          <div className="text-sm opacity-60">第{hexagram.id}卦 · {hexagram.guaMeaning}</div>

          {changedHexagram && (
            <div className="mt-4 pt-4 border-t border-amber-900/30">
              <div className="text-xs tracking-widest opacity-50 mb-2" style={{ color: '#8B5CF6' }}>
                變卦
              </div>
              <div className="text-4xl mb-1">{changedHexagram.symbol}</div>
              <div className="text-xl">{changedHexagram.name}卦 · {changedHexagram.guaMeaning}</div>
            </div>
          )}
        </div>

        {/* Judgment */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-xs tracking-widest mb-3" style={{ color: '#C9A227' }}>
            ── 卦辭 ──
          </div>
          <p className="text-xl text-center leading-relaxed mb-4">
            {hexagram.judgment}
          </p>
          <div className="p-4 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)' }}>
            <p className="text-sm leading-relaxed opacity-90">
              {interpretJudgment(hexagram.judgment)}
            </p>
          </div>
        </div>

        {/* 彖曰 */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-xs tracking-widest mb-3" style={{ color: '#C9A227' }}>
            ── 彖曰 ──
          </div>
          <p className="text-lg text-center leading-relaxed opacity-90">
            {hexagram.judgmentTitle}
          </p>
        </div>

        {/* 象曰 */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-xs tracking-widest mb-3" style={{ color: '#C9A227' }}>
            ── 象曰 ──
          </div>
          <p className="text-xl text-center" style={{ fontFamily: "'Noto Serif TC', serif" }}>
            {hexagram.image}
          </p>
        </div>

        {/* Six Lines */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-xs tracking-widest mb-4" style={{ color: '#C9A227' }}>
            ── 六爻 ──
          </div>
          <div className="space-y-3">
            {[...data.lineSymbols].reverse().map((symbol, idx) => {
              const position = 6 - idx;
              const isChanging = data.changingLines.includes(position);
              const lineIdx = position - 1;
              return (
                <div
                  key={position}
                  className={`flex items-center justify-between p-3 rounded-lg ${isChanging ? 'border' : ''}`}
                  style={isChanging ? {
                    background: 'rgba(201,162,39,0.1)',
                    borderColor: 'rgba(201,162,39,0.3)'
                  } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-50 w-12">
                      {getLineLabel(position)}
                    </span>
                    <span
                      className="text-2xl"
                      style={{ color: symbol === '☰' ? '#C9A227' : '#F5E6D3' }}
                    >
                      {symbol}
                    </span>
                    {isChanging && (
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(201,162,39,0.3)', color: '#C9A227' }}
                      >
                        動
                      </span>
                    )}
                  </div>
                  <span className="text-right text-sm flex-1 ml-3 opacity-90">
                    {hexagram.lines[lineIdx]?.judgment}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Five Elements */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-xs tracking-widest mb-4" style={{ color: '#C9A227' }}>
            ── 五行分析 ──
          </div>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: '金', value: computeWuxing(hexagram.above, hexagram.below)['金'], desc: '性情剛毅' },
              { label: '木', value: computeWuxing(hexagram.above, hexagram.below)['木'], desc: '仁慈惻隱' },
              { label: '水', value: computeWuxing(hexagram.above, hexagram.below)['水'], desc: '聰明智慧' },
              { label: '火', value: computeWuxing(hexagram.above, hexagram.below)['火'], desc: '禮貌熱情' },
              { label: '土', value: computeWuxing(hexagram.above, hexagram.below)['土'], desc: '忠信誠實' },
            ].map((w, i) => (
              <div key={i} className="p-2 rounded-lg" style={{ background: 'rgba(30,30,30,0.8)' }}>
                <div className="text-xl font-bold mb-1" style={{ color: w.value > 0 ? '#C9A227' : '#F5E6D3' }}>
                  {w.label}
                </div>
                <div className={`text-lg font-bold ${w.value > 0 ? 'text-green-400' : w.value < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {w.value > 0 ? '+' : ''}{w.value}
                </div>
                <div className="text-xs opacity-60">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block px-8 py-3 text-lg rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7C1D1D 0%, #5C1515 100%)', border: '1px solid #C9A227', color: '#F5E6D3' }}
          >
            自己也來占卜一卦 →
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm opacity-30">
          易經占卜 · mylife.first.pet
        </div>
      </div>
    </div>
  );
}
