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
    
    return {
      hexagramId: data.h,
      changedId: data.c && data.c > 0 ? data.c : undefined,
      changingLines,
      token: data.t || '',
    };
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const params = useParams();
  const [data, setData] = useState<{ hexagramId: number; changedId?: number; changingLines: number[] } | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [changedHexagram, setChangedHexagram] = useState<Hexagram | null>(null);
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
    
    // Load hexagram data
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

  // Calculate fortune rating
  const isAuspicious = [1,3,5,8,14,15,16,18,24,26,27,29,30,33,35,37,38,41,42,44,45,46,47,48,49,51,52,53,54,55,56,57,58,59,60,61,62,63,64].includes(data.hexagramId);
  const isInauspicious = [2,4,7,20,21,22,23,25,28,31,32,34,36,39,40,43,50].includes(data.hexagramId);
  
  let rating: string, ratingColor: string;
  if (data.changingLines.length === 0) {
    rating = isAuspicious ? '吉' : isInauspicious ? '凶' : '平';
    ratingColor = isAuspicious ? '#22C55E' : isInauspicious ? '#EF4444' : '#C9A227';
  } else if (data.changingLines.length <= 2) {
    rating = isAuspicious ? '吉帶變' : isInauspicious ? '凶帶變' : '平帶變';
    ratingColor = '#F59E0B';
  } else {
    rating = '大變動';
    ratingColor = '#8B5CF6';
  }

  // Render hexagram lines (from bottom to top, index 5 to 0)
  const renderLines = () => {
    const lines = [];
    for (let i = 5; i >= 0; i--) {
      const line = hexagram.lines[i];
      const isChanging = data.changingLines.includes(i + 1);
      lines.push(
        <div 
          key={i}
          className="flex items-center gap-3 py-2 px-4 rounded transition-all"
          style={{ 
            background: isChanging ? 'rgba(201, 162, 39, 0.15)' : 'transparent',
            borderLeft: isChanging ? '3px solid #C9A227' : '3px solid transparent'
          }}
        >
          <span className="text-sm opacity-50 w-6">{'六五四三二一'[5-i]}</span>
          <span className="text-2xl font-bold" style={{ color: line.luck === 'yang' ? '#C9A227' : '#F5E6D3' }}>
            {line.luck === 'yang' ? '▓' : '░'}
          </span>
          <span className="flex-1 text-left" style={{ color: '#F5E6D3' }}>{line.judgment}</span>
          {isChanging && <span className="text-xs px-2 py-1 rounded" style={{ background: '#C9A227', color: '#0D0D0D' }}>動</span>}
        </div>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-sm opacity-50 mb-2" style={{ color: '#C9A227' }}>朋友分享的占卜結果</div>
          <div className="text-6xl mb-4">{hexagram.symbol}</div>
          <h1 className="text-4xl font-bold mb-1">{hexagram.name}卦</h1>
          <div className="text-sm opacity-60">第{hexagram.id}卦 · {hexagram.above}上{hexagram.below}下</div>
        </div>

        {/* Fortune Rating */}
        <div 
          className="text-center p-6 rounded-xl mb-6"
          style={{ background: 'rgba(30,20,20,0.95)', border: `2px solid ${ratingColor}40` }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: ratingColor }}>{rating}</div>
          <div className="text-sm opacity-70">
            {data.changingLines.length === 0 && '靜卦，無變爻'}
            {data.changingLines.length > 0 && `含 ${data.changingLines.length} 個動爻`}
          </div>
        </div>

        {/* Hexagram Meaning */}
        <div className="text-center mb-6">
          <p className="text-lg opacity-90">{hexagram.guaMeaning}</p>
        </div>

        {/* Six Lines */}
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-sm opacity-50 mb-4" style={{ color: '#C9A227' }}>六爻</div>
          {renderLines()}
        </div>

        {/* Judgment */}
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-sm opacity-50 mb-2" style={{ color: '#C9A227' }}>卦辭</div>
          <div className="text-xl text-center mb-2">{hexagram.judgment}</div>
          <div className="text-sm text-center opacity-70">{hexagram.judgmentTitle}</div>
        </div>

        {/* Image */}
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-sm opacity-50 mb-2" style={{ color: '#C9A227' }}>象曰</div>
          <div className="text-lg text-center">{hexagram.image}</div>
        </div>

        {/* Changed Hexagram */}
        {changedHexagram && (
          <div 
            className="rounded-xl p-4 mb-6"
            style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(139,92,246,0.4)' }}
          >
            <div className="text-center text-sm opacity-50 mb-2" style={{ color: '#8B5CF6' }}>變卦</div>
            <div className="text-center mb-2">
              <span className="text-4xl">{changedHexagram.symbol}</span>
              <span className="text-2xl font-bold ml-3">{changedHexagram.name}卦</span>
            </div>
            <div className="text-center text-sm opacity-70">{changedHexagram.guaMeaning}</div>
          </div>
        )}

        {/* Fortune Details */}
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}
        >
          <div className="text-center text-sm opacity-50 mb-4" style={{ color: '#C9A227' }}>綜合運勢</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm opacity-50 w-12">整體</span>
              <span className="flex-1">{hexagram.fortune}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm opacity-50 w-12">財運</span>
              <span className="flex-1">{hexagram.wealth}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm opacity-50 w-12">事業</span>
              <span className="flex-1">{hexagram.career}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm opacity-50 w-12">感情</span>
              <span className="flex-1">{hexagram.relationships}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm opacity-50 w-12">健康</span>
              <span className="flex-1">{hexagram.health}</span>
            </div>
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
