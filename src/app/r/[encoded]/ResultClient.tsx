'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { assessFortune, interpretJudgment, computeWuxing, generateHighlightConclusions, generatePlainInterpretation } from '@/lib/interpretation';
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

  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleSavePng = async () => {
    if (!resultCardRef.current) return;
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: '#0D0D0D',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      // 加入網站QR Code
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://mylife.first.pet';
          const qrImg = new Image();
          qrImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
            qrImg.src = qrUrl;
          });
          const qrSize = 80;
          const qrX = (canvas.width - qrSize) / 2;
          ctx.drawImage(qrImg, qrX, 8, qrSize, qrSize);
          ctx.font = '12px "Noto Serif TC", serif';
          ctx.fillStyle = 'rgba(201,162,39,0.7)';
          ctx.textAlign = 'center';
          ctx.fillText('mylife.first.pet', canvas.width / 2, 8 + qrSize + 16);
        } catch(e) {
          console.error('QR Code載入失敗', e);
        }
      }
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `易經占卜_${hexagram?.name}卦_${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error('PNG capture failed', e);
    }
  };

  const fortune = assessFortune(data.hexagramId, data.changingLines.length);
  const highlights = generateHighlightConclusions(data.hexagramId, hexagram.name, fortune.rating, fortune.summary, fortune.advice, data.changingLines.length);
  const plain = generatePlainInterpretation(data.hexagramId, hexagram.name, fortune.rating, hexagram.fortune, data.changingLines.length);

  const getLineLabel = (pos: number) => {
    if (pos === 1) return '初爻';
    if (pos === 6) return '上爻';
    return `六${['', '二', '三', '四', '五'][pos - 1]}爻`;
  };

  const toggleAccordion = (key: string) => {
    setAccordionOpen(prev => prev === key ? null : key);
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
      <div ref={resultCardRef} className="max-w-lg mx-auto space-y-6">

        {/* ── 頁面標題 ── */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ fontSize: '1.5rem' }}>你的占卜結果</h1>
          <div className="text-sm opacity-60" style={{ color: '#C9A227' }}>本卦 / 變卦 / 解讀參考</div>
        </div>

        {/* ── 高亮結論卡片 ── */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(30,20,20,0.98)',
            border: `2px solid ${fortune.color}60`
          }}
        >
          <div className="text-center mb-5">
            <div className="text-xs tracking-widest mb-3" style={{ color: '#C9A227' }}>── 先看重點 ──</div>
            <div className="text-4xl mb-2">{fortune.emoji}</div>
            <div className="text-xl font-bold" style={{ color: fortune.color }}>{fortune.rating} · {fortune.scoreLabel}</div>
          </div>
          <div className="space-y-5">
            <div className="p-5 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: `3px solid ${fortune.color}` }}>
              <div className="text-xs tracking-widest mb-2" style={{ color: '#C9A227' }}>這一卦代表</div>
              <p className="text-lg leading-relaxed" style={{ color: '#F5E6D3', lineHeight: 1.8 }}>{highlights.represents}</p>
            </div>
            <div className="p-5 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: '3px solid #7C1D1D' }}>
              <div className="text-xs tracking-widest mb-2" style={{ color: '#C9A227' }}>你現在較應注意</div>
              <p className="text-lg leading-relaxed" style={{ color: '#F5E6D3', lineHeight: 1.8 }}>{highlights.attention}</p>
            </div>
            <div className="p-5 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: '3px solid #2D5A27' }}>
              <div className="text-xs tracking-widest mb-2" style={{ color: '#C9A227' }}>建議方向</div>
              <p className="text-lg leading-relaxed" style={{ color: '#F5E6D3', lineHeight: 1.8 }}>{highlights.suggestion}</p>
            </div>
          </div>
        </div>

        {/* ── 卦象資料 ── */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <div className="text-xs tracking-widest text-center mb-5" style={{ color: '#C9A227' }}>── 卦象資料 ──</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between"><span className="opacity-60">本卦</span><span>{hexagram.name}卦</span></div>
            <div className="flex justify-between"><span className="opacity-60">變卦</span><span style={{ color: changedHexagram ? '#8B5CF6' : '#F5E6D3' }}>{changedHexagram ? changedHexagram.name + '卦' : '—'}</span></div>
            <div className="flex justify-between col-span-2"><span className="opacity-60">問題主題</span><span style={{ color: '#C9A227' }}>{data.questionType || '未指定'}</span></div>
          </div>
          <div className="mt-4 text-xs text-center opacity-40" style={{ color: '#C9A227' }}>本卦＝目前狀態 · 變卦＝變化方向</div>
        </div>

        {/* ── 白話解讀 ── */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <div className="text-xs tracking-widest text-center mb-5" style={{ color: '#C9A227' }}>── 白話解讀 ──</div>
          <div className="space-y-5 text-sm">
            <div>
              <div className="font-medium mb-2" style={{ color: '#C9A227', fontSize: '1rem' }}>整體來看</div>
              <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.overall}</p>
            </div>
            <div>
              <div className="font-medium mb-2" style={{ color: '#C9A227', fontSize: '1rem' }}>對這件事的提醒</div>
              <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.reminder}</p>
            </div>
            <div>
              <div className="font-medium mb-2" style={{ color: '#C9A227', fontSize: '1rem' }}>如果你正準備行動</div>
              <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.actionAdvice}</p>
            </div>
            <div>
              <div className="font-medium mb-2" style={{ color: '#C9A227', fontSize: '1rem' }}>如果你仍在觀望</div>
              <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.watchAdvice}</p>
            </div>
          </div>
        </div>

        {/* ── 深入閱讀 Accordion ── */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <div className="text-xs tracking-widest text-center mb-5" style={{ color: '#C9A227' }}>── 深入閱讀 ──</div>
          <div className="space-y-3">
            {/* 卦辭 */}
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => toggleAccordion('judgment')} className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5">
                <span className="text-sm font-medium">查看卦辭原文</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'judgment' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'judgment' && (
                <div className="px-5 pb-5 space-y-4">
                  <div><div className="text-xs opacity-60 mb-2">卦辭</div><p className="text-base" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.judgment}</p></div>
                  <div><div className="text-xs opacity-60 mb-2">白話解說</div><p className="text-sm opacity-80" style={{ lineHeight: 1.8 }}>{interpretJudgment(hexagram.judgment)}</p></div>
                  <div><div className="text-xs opacity-60 mb-2">彖曰</div><p className="text-sm opacity-80" style={{ lineHeight: 1.8 }}>{hexagram.judgmentTitle}</p></div>
                </div>
              )}
            </div>
            {/* 象義 */}
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => toggleAccordion('image')} className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5">
                <span className="text-sm font-medium">查看象義說明</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'image' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'image' && (
                <div className="px-5 pb-5 space-y-4">
                  <div><div className="text-xs opacity-60 mb-2">象曰</div><p className="text-base" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.image}</p></div>
                </div>
              )}
            </div>
            {/* 逐爻 */}
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => toggleAccordion('lines')} className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5">
                <span className="text-sm font-medium">查看逐爻解讀</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'lines' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'lines' && (
                <div className="px-5 pb-5 space-y-3">
                  {[...data.lineSymbols].reverse().map((symbol, idx) => {
                    const position = 6 - idx;
                    const isChanging = data.changingLines.includes(position);
                    const lineIdx = position - 1;
                    return (
                      <div key={position} className="p-4 rounded-lg" style={isChanging ? { background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)' } : { background: 'rgba(30,30,30,0.5)' }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm opacity-60">{getLineLabel(position)}</span>
                          <span style={{ color: symbol === '☰' ? '#C9A227' : '#F5E6D3', fontSize: '1.5rem' }}>{symbol}</span>
                          {isChanging && <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>動</span>}
                        </div>
                        <p className="text-sm" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.lines[lineIdx]?.judgment}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 五行分析 ── */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(30,20,20,0.95)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <div className="text-xs tracking-widest text-center mb-5" style={{ color: '#C9A227' }}>── 五行分析 ──</div>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: '金', value: computeWuxing(hexagram.above, hexagram.below)['金'], desc: '性情剛毅' },
              { label: '木', value: computeWuxing(hexagram.above, hexagram.below)['木'], desc: '仁慈惻隱' },
              { label: '水', value: computeWuxing(hexagram.above, hexagram.below)['水'], desc: '聰明智慧' },
              { label: '火', value: computeWuxing(hexagram.above, hexagram.below)['火'], desc: '禮貌熱情' },
              { label: '土', value: computeWuxing(hexagram.above, hexagram.below)['土'], desc: '忠信誠實' },
            ].map((w, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(30,30,30,0.6)' }}>
                <div className="text-lg font-bold mb-1" style={{ color: w.value > 0 ? '#C9A227' : '#F5E6D3', fontSize: '1rem' }}>{w.label}</div>
                <div className={`text-sm font-bold ${w.value > 0 ? 'text-green-400' : w.value < 0 ? 'text-red-400' : 'text-gray-400'}`}>{w.value > 0 ? '+' : ''}{w.value}</div>
                <div className="text-xs opacity-60">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 操作區 ── */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={handleSavePng} className="inline-block px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #8B6914 0%, #D4AF37 100%)', color: '#0a0806' }}>💾 保存卦象</button>
            <Link href="/" className="inline-block px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7C1D1D 0%, #5C1515 100%)', border: '1px solid #C9A227', color: '#F5E6D3' }}>再問一題</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm opacity-30 pb-4">占卜結果僅供思考參考，不宜代替醫療、法律或財務專業判斷。</div>
      </div>
    </div>
  );
}
