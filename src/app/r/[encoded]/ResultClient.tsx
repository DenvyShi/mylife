'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { assessFortune, interpretJudgment, computeWuxing, generateHighlightConclusions, generatePlainInterpretation } from '@/lib/interpretation';

interface Props {
  decoded: {
    hexagramId: number;
    changedId?: number;
    changingLines: number[];
    lineSymbols: string[];
    hexSymbols: string;
    questionType?: string;
  };
  hexagramName: string;
  changedHexagramName?: string;
}

export default function ResultClient({ decoded, hexagramName, changedHexagramName }: Props) {
  const hexagram = hexagrams.find(x => x.id === decoded.hexagramId) || null;
  const changedHexagram = decoded.changedId
    ? hexagrams.find(x => x.id === decoded.changedId) || null
    : null;

  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  if (!hexagram) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6 animate-pulse">☰☷</div>
        <p className="text-lg">載入中...</p>
      </div>
    );
  }

  const handleSavePng = async () => {
    if (!resultCardRef.current) return;
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: '#0D0D0D',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://mylife.first.pet';
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = qrUrl;
        await new Promise(resolve => { qrImg.onload = resolve; qrImg.onerror = resolve; });
        const qrSize = 80;
        const topSpace = qrSize + 30;
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height + topSpace;
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) return;
        newCtx.fillStyle = '#0D0D0D';
        newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        newCtx.drawImage(canvas, 0, topSpace);
        const qrX = (newCanvas.width - qrSize) / 2;
        const qrY = 14;
        newCtx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        newCtx.font = 'bold 13px "Noto Serif TC", serif';
        newCtx.fillStyle = 'rgba(201,162,39,0.8)';
        newCtx.textAlign = 'center';
        newCtx.fillText('mylife.first.pet', newCanvas.width / 2, qrY + qrSize + 18);
        const url = newCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `易經占卜_${hexagram.name}卦_${Date.now()}.png`;
        a.click();
      }
    } catch (e) {
      console.error('PNG capture failed', e);
    }
  };


  const fortune = assessFortune(decoded.hexagramId, decoded.changingLines.length);
  const highlights = generateHighlightConclusions(decoded.hexagramId, hexagram.name, fortune.rating, fortune.summary, fortune.advice, decoded.changingLines.length);
  const plain = generatePlainInterpretation(decoded.hexagramId, hexagram.name, fortune.rating, hexagram.fortune, decoded.changingLines.length);

  const getLineLabel = (pos: number) => {
    if (pos === 1) return '初爻';
    if (pos === 6) return '上爻';
    return `六${['', '二', '三', '四', '五'][pos - 1]}爻`;
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
            <div className="flex justify-between col-span-2"><span className="opacity-60">問題主題</span><span style={{ color: '#C9A227' }}>{decoded.questionType || '未指定'}</span></div>
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
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => setAccordionOpen(prev => prev === 'judgment' ? null : 'judgment')} className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-gold/5">
                <span className="text-base font-medium">查看卦辭原文</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'judgment' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'judgment' && (
                <div className="px-6 pb-6 space-y-4">
                  <div><div className="text-sm opacity-70 mb-2">卦辭</div><p className="text-lg" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.judgment}</p></div>
                  <div><div className="text-sm opacity-70 mb-2">白話解說</div><p className="text-base opacity-90" style={{ lineHeight: 1.8 }}>{interpretJudgment(hexagram.judgment)}</p></div>
                  <div><div className="text-sm opacity-70 mb-2">彖曰</div><p className="text-base opacity-90" style={{ lineHeight: 1.8 }}>{hexagram.judgmentTitle}</p></div>
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => setAccordionOpen(prev => prev === 'image' ? null : 'image')} className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5">
                <span className="text-base font-medium">查看象義說明</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'image' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'image' && (
                <div className="px-6 pb-6 space-y-4">
                  <div><div className="text-sm opacity-70 mb-2">象曰</div><p className="text-lg" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.image}</p></div>
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <button onClick={() => setAccordionOpen(prev => prev === 'lines' ? null : 'lines')} className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5">
                <span className="text-base font-medium">查看逐爻解讀</span>
                <span className="text-lg" style={{ transform: accordionOpen === 'lines' ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {accordionOpen === 'lines' && (
                <div className="px-6 pb-6 space-y-4">
                  {[...decoded.lineSymbols].reverse().map((symbol, idx) => {
                    const position = 6 - idx;
                    const isChanging = decoded.changingLines.includes(position);
                    const lineIdx = position - 1;
                    return (
                      <div key={position} className="p-4 rounded-lg" style={isChanging ? { background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)' } : { background: 'rgba(30,30,30,0.5)' }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-base opacity-70">{getLineLabel(position)}</span>
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
            <button onClick={handleSavePng} className="inline-block px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #8B6914 0%, #D4AF37 100%)', color: '#0a0806' }}>保存卦象</button>
            <Link href="/" className="inline-block px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7C1D1D 0%, #5C1515 100%)', border: '1px solid #C9A227', color: '#F5E6D3' }}>再問一題</Link>
          </div>
        </div>

        <div className="text-center text-sm opacity-30 pb-4">占卜結果僅供思考參考，不宜代替醫療、法律或財務專業判斷。</div>
      </div>
    </div>
  );
}
