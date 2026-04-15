'use client';

import { useState, useEffect } from 'react';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { performDivination, DivinationResult, DivinationLine } from '@/lib/divination';

export default function Home() {
  const [step, setStep] = useState<'home' | 'question' | 'casting' | 'result'>('home');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [changedHexagram, setChangedHexagram] = useState<Hexagram | null>(null);
  const [castingStep, setCastingStep] = useState(0);

  const startDivination = () => {
    setStep('question');
  };

  const beginCasting = () => {
    setStep('casting');
    setCastingStep(0);
    
    // 動畫效果：蓍草過程
    const steps = [
      { label: '雙手捧五十蓍草', delay: 0 },
      { label: '象天法地，雙手下落', delay: 800 },
      { label: '分二', delay: 1600 },
      { label: '掛一', delay: 2400 },
      { label: '揲四', delay: 3200 },
      { label: '歸奇', delay: 4000 },
      { label: '重複十八次', delay: 4800 },
      { label: '陰陽定爻', delay: 5600 },
      { label: '六爻成卦', delay: 6400 },
    ];

    steps.forEach((s, i) => {
      setTimeout(() => setCastingStep(i + 1), s.delay);
    });

    // 最終得到結果
    setTimeout(() => {
      const divResult = performDivination();
      const h = hexagrams.find(x => x.id === divResult.originalHexagram);
      const ch = divResult.changedHexagram 
        ? hexagrams.find(x => x.id === divResult.changedHexagram) 
        : null;
      
      setResult(divResult);
      setHexagram(h || null);
      setChangedHexagram(ch || null);
      setStep('result');
    }, 7200);
  };

  const reset = () => {
    setStep('home');
    setQuestion('');
    setResult(null);
    setHexagram(null);
    setChangedHexagram(null);
    setCastingStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-amber-50">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-bold tracking-wider mb-2" style={{ fontFamily: 'serif' }}>
          易經占卜
        </h1>
        <p className="text-amber-200/60 text-sm">陰陽變化 · 蓍草占卜 · 匿名使用</p>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* Home */}
        {step === 'home' && (
          <div className="text-center space-y-8 py-12">
            <div className="text-8xl mb-6">☰☷</div>
            <p className="text-lg text-amber-200/80 max-w-md mx-auto leading-relaxed">
              蓍草占卜，源自《周禮》，為文王、周公所傳。
              <br />誠心默念所問之事，即可得卦。
            </p>
            <button
              onClick={startDivination}
              className="px-8 py-4 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-lg font-medium transition-all hover:scale-105 shadow-lg shadow-amber-900/30"
            >
              開始占卜
            </button>
            <p className="text-amber-200/40 text-xs mt-4">
              匿名使用 · 客戶端計算 · 數據不回傳伺服器
            </p>
          </div>
        )}

        {/* Question */}
        {step === 'question' && (
          <div className="space-y-6 py-8">
            <h2 className="text-2xl text-center mb-8">請默念所問之事</h2>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="心中默念問題，不必輸入..."
              className="w-full h-32 p-4 bg-slate-800/50 border border-amber-700/30 rounded-lg text-amber-50 placeholder:text-amber-200/30 resize-none focus:outline-none focus:border-amber-600"
            />
            <div className="text-center space-x-4">
              <button
                onClick={reset}
                className="px-6 py-3 border border-amber-700/50 text-amber-200/70 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                返回
              </button>
              <button
                onClick={beginCasting}
                className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-all hover:scale-105"
              >
                誠心占卜
              </button>
            </div>
          </div>
        )}

        {/* Casting Animation */}
        {step === 'casting' && (
          <div className="py-16 text-center">
            <div className="text-6xl mb-8 animate-pulse">五十蓍草</div>
            <div className="space-y-4">
              {castingStep >= 1 && (
                <p className={`text-xl transition-all ${castingStep >= 1 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  雙手捧五十蓍草
                </p>
              )}
              {castingStep >= 2 && (
                <p className={`text-xl transition-all ${castingStep >= 2 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  象天法地，雙手下落
                </p>
              )}
              {castingStep >= 3 && (
                <p className={`text-xl transition-all ${castingStep >= 3 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  分二
                </p>
              )}
              {castingStep >= 4 && (
                <p className={`text-xl transition-all ${castingStep >= 4 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  掛一
                </p>
              )}
              {castingStep >= 5 && (
                <p className={`text-xl transition-all ${castingStep >= 5 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  揲四
                </p>
              )}
              {castingStep >= 6 && (
                <p className={`text-xl transition-all ${castingStep >= 6 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  歸奇
                </p>
              )}
              {castingStep >= 7 && (
                <p className={`text-xl transition-all ${castingStep >= 7 ? 'text-amber-200' : 'text-amber-200/30'}`}>
                  重複十八次，得六爻
                </p>
              )}
              {castingStep >= 8 && (
                <p className={`text-2xl font-bold text-amber-400 ${castingStep >= 8 ? 'opacity-100' : 'opacity-0'}`}>
                  陰陽定爻
                </p>
              )}
              {castingStep >= 9 && (
                <p className={`text-3xl font-bold text-amber-300 ${castingStep >= 9 ? 'opacity-100 animate-bounce' : 'opacity-0'}`}>
                  六爻成卦
                </p>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && result && hexagram && (
          <div className="space-y-8 py-8">
            {/* Question reminder */}
            {question && (
              <div className="text-center text-amber-200/60 text-sm italic">
                「{question}」
              </div>
            )}

            {/* Main Hexagram */}
            <div className="text-center">
              <div className="text-6xl mb-4">{hexagram.symbol}</div>
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'serif' }}>
                {hexagram.name}卦 · 第{hexagram.id}卦
              </h2>
              <p className="text-amber-200/70">{hexagram.guaMeaning}</p>
            </div>

            {/* Judgment */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-amber-700/20">
              <div className="text-center mb-4">
                <span className="text-amber-400 text-sm">卦辭</span>
                <p className="text-2xl font-medium mt-2" style={{ fontFamily: 'serif' }}>
                  {hexagram.judgment}
                </p>
              </div>
              <div className="text-center">
                <span className="text-amber-400 text-sm">彖曰</span>
                <p className="text-lg mt-2 text-amber-200/90" style={{ fontFamily: 'serif' }}>
                  {hexagram.judgmentTitle}
                </p>
              </div>
              <div className="text-center mt-4">
                <span className="text-amber-400 text-sm">象曰</span>
                <p className="text-xl mt-2" style={{ fontFamily: 'serif' }}>
                  {hexagram.image}
                </p>
              </div>
            </div>

            {/* Six Lines */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-amber-700/20">
              <h3 className="text-center text-amber-400 text-sm mb-4">六爻</h3>
              <div className="space-y-2">
                {[...result.lines].reverse().map((line, idx) => {
                  const realIdx = 5 - idx;
                  return (
                    <div 
                      key={line.position}
                      className={`flex items-center justify-between p-2 rounded ${
                        line.isChanging ? 'bg-amber-900/30 border border-amber-600/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-200/50 w-12">
                          {line.position === 1 ? '初爻' : line.position === 6 ? '上爻' : `六${['','二','三','四','五'][line.position - 1]}爻`}
                        </span>
                        <span className="text-2xl">{line.symbol}</span>
                        {line.isChanging && (
                          <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded">
                            動
                          </span>
                        )}
                      </div>
                      <span className="text-right text-amber-200/90" style={{ fontFamily: 'serif' }}>
                        {hexagram.lines[realIdx].judgment}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Changed Hexagram */}
            {result.hasChanging && changedHexagram && (
              <div className="text-center">
                <p className="text-amber-200/60 text-sm mb-2">之卦（變卦）</p>
                <div className="text-5xl mb-2">{changedHexagram.symbol}</div>
                <p className="text-xl" style={{ fontFamily: 'serif' }}>
                  {changedHexagram.name}卦 · 第{changedHexagram.id}卦
                </p>
              </div>
            )}

            {/* Fortune Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 rounded-xl p-5 border border-amber-700/20">
                <h4 className="text-amber-400 text-sm mb-2">📿 總論運勢</h4>
                <p className="text-amber-200/90">{hexagram.fortune}</p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-5 border border-amber-700/20">
                <h4 className="text-amber-400 text-sm mb-2">💰 財運</h4>
                <p className="text-amber-200/90">{hexagram.wealth}</p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-5 border border-amber-700/20">
                <h4 className="text-amber-400 text-sm mb-2">💼 事業</h4>
                <p className="text-amber-200/90">{hexagram.career}</p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-5 border border-amber-700/20">
                <h4 className="text-amber-400 text-sm mb-2">❤️ 感情</h4>
                <p className="text-amber-200/90">{hexagram.relationships}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-amber-200/30 text-xs py-4">
              本占卜僅供參考，人生大事仍需深思熟慮。
              <br />卦象為指引，非定數。
            </p>

            {/* Actions */}
            <div className="text-center space-x-4">
              <button
                onClick={reset}
                className="px-6 py-3 border border-amber-700/50 text-amber-200/70 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                重新占卜
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-amber-200/30 text-xs">
        易經占卜 · 匿名使用 · 客戶端計算
      </footer>
    </div>
  );
}
