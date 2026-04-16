'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { hexagrams, Hexagram } from '@/data/hexagrams';

function decodeResult(encoded: string) {
  try {
    // URL-safe base64 to standard base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const pad = base64.length % 4;
    if (pad > 0) {
      base64 += '='.repeat(4 - pad);
    }
    
    const data = JSON.parse(atob(base64));
    
    if (!data.h || data.h < 1 || data.h > 64) {
      return null;
    }
    
    // Parse changing lines from binary string (positions 1-6)
    const changingLines: number[] = [];
    const lineStr = String(data.l || '000000');
    for (let i = 0; i < 6; i++) {
      if (lineStr[i] === '1') {
        changingLines.push(i + 1);
      }
    }
    
    // Parse line symbols (1=yang/☰, 0=yin/☷)
    const lineSymbols: string[] = [];
    const symbolStr = String(data.ls || '000000');
    for (let i = 0; i < 6; i++) {
      lineSymbols.push(symbolStr[i] === '1' ? '☰' : '☷');
    }
    
    return {
      hexagramId: data.h,
      changedId: data.c && data.c > 0 ? data.c : undefined,
      changingLines,
      lineSymbols,
      token: data.t || '',
    };
  } catch {
    return null;
  }
}

// Simple fortune assessment
function assessFortune(hexagramId: number, changingCount: number): { rating: string; color: string; summary: string } {
  const isAuspicious = [1,3,5,8,14,15,16,18,24,26,27,29,30,33,35,37,38,41,42,44,45,46,47,48,49,51,52,53,54,55,56,57,58,59,60,61,62,63,64].includes(hexagramId);
  const isInauspicious = [2,4,7,20,21,22,23,25,28,31,32,34,36,39,40,43,50].includes(hexagramId);
  
  let rating: string, color: string, summary: string;
  
  if (changingCount === 0) {
    if (isAuspicious) {
      rating = '吉'; color = '#22C55E';
      summary = '此卦靜止無變，局勢穩定。萬物皆有其時，宜守成待機，不可輕舉妄動。';
    } else if (isInauspicious) {
      rating = '凶'; color = '#EF4444';
      summary = '此卦靜止無變，但潛藏隱憂。宜謹慎行事，切勿冒進，當防患於未然。';
    } else {
      rating = '平'; color = '#C9A227';
      summary = '此卦靜止無變，運勢平平。宜順其自然，靜觀其變，不可過分強求。';
    }
  } else if (changingCount <= 2) {
    if (isAuspicious) {
      rating = '吉帶變'; color = '#22C55E';
      summary = '此卦有變，趨向吉祥。局勢將有轉機，宜把握時機，因勢利導。';
    } else if (isInauspicious) {
      rating = '凶帶變'; color = '#F97316';
      summary = '此卦有變，需謹慎處之。局勢多變，宜小心應對，不可大意。';
    } else {
      rating = '平帶變'; color = '#C9A227';
      summary = '此卦有變，運勢待發。局勢將有變化，宜靜待機遇，順時而動。';
    }
  } else {
    rating = '大變動'; color = '#8B5CF6';
    summary = '此卦大變，局勢將有重大轉折。內外形勢皆在變化之中，宜審時度勢，順應變化。';
  }
  
  return { rating, color, summary };
}

// Trigram to Five Elements mapping
const TRIGRAM_WUXING: Record<string, string> = {
  '乾': '金', '兌': '金',
  '坤': '土', '艮': '土',
  '震': '木', '巽': '木',
  '離': '火', '坎': '水',
};

// Compute Five Elements from trigrams
function computeWuxing(above: string, below: string): Record<string, number> {
  const aboveEl = TRIGRAM_WUXING[above] || '土';
  const belowEl = TRIGRAM_WUXING[below] || '土';
  const result: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  result[aboveEl] += 1;
  result[belowEl] += 1;
  // Adjust based on yin/yang
  const aboveYin = ['坤', '坎', '艮', '巽', '離'].includes(above);
  const belowYin = ['坤', '坎', '艮', '巽', '離'].includes(below);
  if (aboveYin) result[aboveEl] -= 0.5;
  else result[aboveEl] += 0.5;
  if (belowYin) result[belowEl] -= 0.5;
  else result[belowEl] += 0.5;
  return result;
}

// Interpret judgment text
function interpretJudgment(judgment: string): string {
  const interpretations: Record<string, string> = {
    '元亨利貞': '「元亨利貞」為《易經》最吉祥的斷語。元者始也，亨者通也，利者適宜也，貞者正而固也。表示此卦諸事順遂，初始即佳，通達無礙，所求有利，且能堅守正道，大吉大利之兆。',
    '大亨': '表示諸事通暢，障礙消除，進展順利。',
    '小亨': '表示有小阻礙，但最終可通達。',
    '不利': '表示此時行事不利，應避免主動出擊。',
    '悔亡': '表示過去的憂悔將消除，局勢好轉。',
    '无咎': '表示沒有大的過失，即使有小問題也能平安度過。',
    '吝': '表示有羞辱、悔恨之事發生，需要謹慎。',
    '厉': '表示有危險，需要小心行事。',
  };
  
  for (const [key, value] of Object.entries(interpretations)) {
    if (judgment.includes(key)) return value;
  }
  
  return `此卦顯示萬物變化之理，「${judgment}」暗示當前局勢的特質。宜順應變化，不可強求。`;
}

export default function ResultPage() {
  const params = useParams();
  const [data, setData] = useState<{ hexagramId: number; changedId?: number; changingLines: number[]; lineSymbols: string[] } | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [changedHexagram, setChangedHexagram] = useState<Hexagram | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = typeof params.encoded === 'string' ? params.encoded : Array.isArray(params.encoded) ? params.encoded[0] : undefined;
    
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

  // Line labels
  const getLineLabel = (pos: number) => {
    if (pos === 1) return '初爻';
    if (pos === 6) return '上爻';
    return `六${['', '二', '三', '四', '五'][pos - 1]}爻`;
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
      <div className="max-w-lg mx-auto">
        
        {/* Overall Fortune Assessment - TOP */}
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
          <div 
            className="text-4xl font-bold mb-3"
            style={{ color: fortune.color }}
          >
            {fortune.rating}
          </div>
          <p className="text-base leading-relaxed opacity-90">
            {fortune.summary}
          </p>
          <div className="mt-4 text-sm opacity-60">
            {data.changingLines.length === 0 && '靜卦，無變爻'}
            {data.changingLines.length > 0 && `含 ${data.changingLines.length} 個動爻`}
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
          
          {/* Changed hexagram */}
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
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isChanging 
                      ? 'border' 
                      : ''
                  }`}
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
