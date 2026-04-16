'use client';

import { useState, useEffect } from 'react';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { performDivination, DivinationResult } from '@/lib/divination';

// Question type options
const QUESTION_TYPES = [
  { value: '事業', label: '📊 事業前途' },
  { value: '財運', label: '💰 財運投資' },
  { value: '感情', label: '💕 感情婚姻' },
  { value: '學業', label: '📚 學業考試' },
  { value: '健康', label: '🏥 健康疾病' },
  { value: '人際', label: '👥 人際關係' },
  { value: '出行', label: '✈️ 出行旅遊' },
  { value: '決策', label: '⚖️ 疑難決策' },
  { value: '其他', label: '🔮 其他問題' },
];

const TIME_PERIODS = [
  { value: '子', label: '子時 (23:00-01:00)' },
  { value: '丑', label: '丑時 (01:00-03:00)' },
  { value: '寅', label: '寅時 (03:00-05:00)' },
  { value: '卯', label: '卯時 (05:00-07:00)' },
  { value: '辰', label: '辰時 (07:00-09:00)' },
  { value: '巳', label: '巳時 (09:00-11:00)' },
  { value: '午', label: '午時 (11:00-13:00)' },
  { value: '未', label: '未時 (13:00-15:00)' },
  { value: '申', label: '申時 (15:00-17:00)' },
  { value: '酉', label: '酉時 (17:00-19:00)' },
  { value: '戌', label: '戌時 (19:00-21:00)' },
  { value: '亥', label: '亥時 (21:00-23:00)' },
];

const CASTING_STEPS = [
  { label: '雙手捧五十蓍草', sub: '心存敬意' },
  { label: '象天法地，雙手下落', sub: '天圓地方' },
  { label: '分而為二', sub: '陰陽分判' },
  { label: '掛一以象三', sub: '三才定位' },
  { label: '揲四以象四時', sub: '四時流轉' },
  { label: '歸奇於扐', sub: '五行歸位' },
  { label: '九遍成爻', sub: '陽爻初現' },
  { label: '十八次成卦', sub: '六爻齊備' },
  { label: '陰陽定矣', sub: '卦象已成' },
];

type Step = 'home' | 'info' | 'settle' | 'casting' | 'result';

interface UserInfo {
  name: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  questionType: string;
  question: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>('home');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    questionType: '',
    question: '',
  });
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [changedHexagram, setChangedHexagram] = useState<Hexagram | null>(null);
  const [castingStep, setCastingStep] = useState(0);
  const [settleProgress, setSettleProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Settle mind breathing animation
  useEffect(() => {
    if (step === 'settle') {
      setSettleProgress(0);
      const interval = setInterval(() => {
        setSettleProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep('casting');
            startCasting();
            return 100;
          }
          return prev + 2;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  const startCasting = () => {
    setCastingStep(0);
    
    CASTING_STEPS.forEach((s, i) => {
      setTimeout(() => setCastingStep(i + 1), (i + 1) * 900);
    });

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
      
      setTimeout(() => setShowResult(true), 300);
    }, (CASTING_STEPS.length + 1) * 900);
  };

  const handleStart = () => {
    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.question.trim()) {
      alert('請輸入您想問的事情');
      return;
    }
    setStep('settle');
  };

  const handleReset = () => {
    setStep('home');
    setUserInfo({
      name: '',
      gender: '',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      birthHour: '',
      questionType: '',
      question: '',
    });
    setResult(null);
    setHexagram(null);
    setChangedHexagram(null);
    setCastingStep(0);
    setSettleProgress(0);
    setShowResult(false);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Decorative Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="text-gold opacity-40 text-sm tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
          ── 上古之術 ──
        </div>
        <div className="text-8xl mb-6 animate-float">☰</div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4" style={{ 
          fontFamily: "'Noto Serif TC', serif",
          color: 'var(--cream)',
          textShadow: '0 0 40px rgba(201, 162, 39, 0.3)'
        }}>
          易經占卜
        </h1>
        <div className="text-lg tracking-widest mb-6 opacity-60" style={{ color: 'var(--gold)' }}>
          蓍草法 · 文王遺風
        </div>
        <div className="ornament-divider max-w-xs mx-auto mb-8">
          ◆
        </div>
        <p className="text-lg max-w-lg mx-auto leading-relaxed opacity-80 mb-12" style={{ color: 'var(--cream-dark)' }}>
          誠心凝神，默念所問之事。<br/>
          蓍草之數，陰陽之變，盡顯天機。
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mb-12">
        {[
          { icon: '🌿', title: '五十蓍草', desc: '傳統蓍草占法' },
          { icon: '🔮', title: '六爻成卦', desc: '陰陽動靜變化' },
          { icon: '📿', title: '象辭解讀', desc: '天機智慧指引' },
        ].map((item, i) => (
          <div key={i} className={`text-center p-6 opacity-0 animate-slide-up stagger-${i + 1}`}
               style={{ 
                 animationFillMode: 'forwards',
                 animationDelay: `${0.3 + i * 0.15}s`
               }}>
            <div className="text-4xl mb-3">{item.icon}</div>
            <div className="font-medium mb-1" style={{ color: 'var(--gold)' }}>{item.title}</div>
            <div className="text-sm opacity-60">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="trad-btn animate-pulse-glow"
        style={{ animationDelay: '0.8s' }}
      >
        開始占卜
      </button>

      {/* Footer */}
      <div className="mt-12 text-center opacity-40 text-xs">
        <p>匿名使用 · 客戶端計算 · 數據不回傳</p>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-8 w-full max-w-lg">
        <div className="text-sm opacity-50 tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
          第二步 · 稟告天地
        </div>
        <h2 className="text-3xl font-bold mb-2">輸入占卜資訊</h2>
        <div className="ornament-divider max-w-xs mx-auto">◆</div>
      </div>

      <form onSubmit={handleInfoSubmit} className="w-full max-w-lg space-y-6">
        {/* Basic Info */}
        <div className="trad-card p-6 space-y-4">
          <h3 className="text-lg font-medium" style={{ color: 'var(--gold)' }}>基本資料</h3>
          
          <div>
            <label className="block text-sm opacity-70 mb-2">姓名（可选）</label>
            <input
              type="text"
              value={userInfo.name}
              onChange={e => setUserInfo({...userInfo, name: e.target.value})}
              placeholder="輸入姓名"
              className="trad-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-2">性別</label>
            <div className="grid grid-cols-2 gap-3">
              {['男', '女'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setUserInfo({...userInfo, gender: g})}
                  className={`p-3 rounded-lg border transition-all ${
                    userInfo.gender === g 
                      ? 'border-gold bg-gold/10' 
                      : 'border-gold/30 hover:border-gold/50'
                  }`}
                  style={{ 
                    borderColor: userInfo.gender === g ? 'var(--gold)' : undefined,
                    background: userInfo.gender === g ? 'rgba(201,162,39,0.1)' : undefined,
                    color: userInfo.gender === g ? 'var(--gold)' : undefined
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-2">出生時間</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={userInfo.birthYear}
                onChange={e => setUserInfo({...userInfo, birthYear: e.target.value})}
                placeholder="年"
                min="1900"
                max="2025"
                className="trad-input rounded-lg text-center"
              />
              <input
                type="number"
                value={userInfo.birthMonth}
                onChange={e => setUserInfo({...userInfo, birthMonth: e.target.value})}
                placeholder="月"
                min="1"
                max="12"
                className="trad-input rounded-lg text-center"
              />
              <input
                type="number"
                value={userInfo.birthDay}
                onChange={e => setUserInfo({...userInfo, birthDay: e.target.value})}
                placeholder="日"
                min="1"
                max="31"
                className="trad-input rounded-lg text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-2">出生時辰</label>
            <select
              value={userInfo.birthHour}
              onChange={e => setUserInfo({...userInfo, birthHour: e.target.value})}
              className="trad-input rounded-lg"
            >
              <option value="">選擇時辰</option>
              {TIME_PERIODS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question */}
        <div className="trad-card p-6 space-y-4">
          <h3 className="text-lg font-medium" style={{ color: 'var(--gold)' }}>占問事項</h3>
          
          <div>
            <label className="block text-sm opacity-70 mb-2">問題類別</label>
            <select
              value={userInfo.questionType}
              onChange={e => setUserInfo({...userInfo, questionType: e.target.value})}
              className="trad-input rounded-lg"
              required
            >
              <option value="">選擇類別</option>
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-2">
              心中所問之事 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={userInfo.question}
              onChange={e => setUserInfo({...userInfo, question: e.target.value})}
              placeholder="誠心默念所問之事，心中切勿疑惑..."
              className="trad-input rounded-lg h-32 resize-none"
              required
            />
          </div>
        </div>

        {/* Info notice */}
        <div className="text-center text-sm opacity-50">
          <p>以上資料僅用於本次占卜，不會上傳或儲存</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-8 py-3 border border-gold/50 rounded-lg hover:bg-gold/5 transition-all"
            style={{ borderColor: 'rgba(201,162,39,0.3)' }}
          >
            返回首頁
          </button>
          <button
            type="submit"
            className="trad-btn trad-btn-gold"
          >
            稟告天地
          </button>
        </div>
      </form>
    </div>
  );

  const renderSettle = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* Decorative incense */}
        <div className="text-6xl mb-8 animate-float" style={{ animationDuration: '6s' }}>
          🕯️
        </div>
        
        <h2 className="text-3xl font-bold mb-4">靜心誠念</h2>
        <p className="text-lg opacity-70 mb-8 max-w-md">
          請放下心中雜念<br/>
          專注於所問之事
        </p>

        {/* Breathing circle */}
        <div className="relative mb-12">
          <div 
            className="breathe-circle mx-auto"
            style={{ 
              transform: `scale(${1 + (settleProgress / 100) * 0.3})`,
              transition: 'transform 0.15s ease-out'
            }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                {settleProgress}%
              </div>
              <div className="text-xs opacity-60">誠心</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="h-1 bg-gold/20 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-150 rounded-full"
              style={{ 
                width: `${settleProgress}%`,
                background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))'
              }}
            />
          </div>
        </div>

        <p className="text-sm opacity-50 mt-6">
          {settleProgress < 30 && '心如止水...'}
          {settleProgress >= 30 && settleProgress < 60 && '意念漸純...'}
          {settleProgress >= 60 && settleProgress < 90 && '神定氣閒...'}
          {settleProgress >= 90 && '天、地、人皆備，卦象將成...'}
        </p>
      </div>
    </div>
  );

  const renderCasting = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="text-sm opacity-50 tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
          蓍草之數 · 陰陽之變
        </div>
        
        {/* Yarrow stalks display */}
        <div className="flex justify-center gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="yarrow-stalk animate-float"
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: '3s' }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-4 max-w-md mx-auto">
          {CASTING_STEPS.map((s, i) => (
            <div 
              key={i}
              className={`transition-all duration-500 ${
                castingStep > i 
                  ? 'opacity-100 translate-x-0' 
                  : castingStep === i 
                    ? 'opacity-80' 
                    : 'opacity-30'
              }`}
              style={{
                transform: castingStep > i ? 'translateX(10px)' : 'translateX(0)',
                color: castingStep > i ? 'var(--gold)' : undefined
              }}
            >
              <div className="text-lg font-medium">{s.label}</div>
              <div className="text-xs opacity-60">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Current step indicator */}
        {castingStep > 0 && castingStep <= CASTING_STEPS.length && (
          <div className="mt-8">
            <div className="text-4xl animate-pulse">⚡</div>
            <div className="text-sm opacity-60 mt-2">
              第 {castingStep} / {CASTING_STEPS.length} 步
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Calculate wuxing (five elements) based on upper and lower trigrams
const TRIGRAM_WUXING: Record<string, string> = {
  '乾': '金', '兌': '金',
  '坤': '土', '艮': '土',
  '震': '木', '巽': '木',
  '離': '火', '坎': '水',
};

function computeWuxing(above: string, below: string) {
  const aboveEl = TRIGRAM_WUXING[above] || '土';
  const belowEl = TRIGRAM_WUXING[below] || '土';
  const elements = ['金', '木', '水', '火', '土'];
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

  const renderResult = () => {
    if (!result || !hexagram) return null;
    const wuxing = computeWuxing(hexagram.above, hexagram.below);

    return (
      <div className={`min-h-screen px-4 py-8 transition-all duration-700 ${showResult ? 'opacity-100' : 'opacity-0'}`}>
        {/* User info reminder */}
        {(userInfo.name || userInfo.questionType) && (
          <div className="text-center mb-6">
            <div className="text-sm opacity-50">
              {userInfo.name && <span>{userInfo.name} · </span>}
              {userInfo.birthYear && <span>{userInfo.birthYear}年</span>}
              {userInfo.birthMonth && <span>{userInfo.birthMonth}月</span>}
              {userInfo.birthDay && <span>{userInfo.birthDay}日 · </span>}
              {userInfo.birthHour && <span>{userInfo.birthHour}時</span>}
              {userInfo.questionType && <span> · 問{userInfo.questionType}</span>}
            </div>
            {userInfo.question && (
              <div className="text-lg italic mt-2 opacity-80" style={{ color: 'var(--gold)' }}>
                「{userInfo.question}」
              </div>
            )}
          </div>
        )}

        {/* Main Hexagram */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest opacity-50 mb-4" style={{ color: 'var(--gold)' }}>
            本卦
          </div>
          <div 
            className="hexagram-display mb-4"
            style={{ 
              background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {hexagram.symbol}
          </div>
          <h2 className="text-4xl font-bold mb-2">{hexagram.name}卦</h2>
          <div className="text-sm opacity-60 mb-1">第{hexagram.id}卦 · {hexagram.guaMeaning}</div>
          
          {/* Changed hexagram */}
          {changedHexagram && (
            <div className="mt-4 pt-4 border-t border-gold/20">
              <div className="text-xs tracking-widest opacity-50 mb-2" style={{ color: 'var(--gold)' }}>
                變卦
              </div>
              <div className="text-4xl mb-2">{changedHexagram.symbol}</div>
              <div className="text-lg">{changedHexagram.name}卦</div>
            </div>
          )}
        </div>

        {/* Judgment */}
        <div className="max-w-xl mx-auto space-y-6">
          <div className="trad-card p-6">
            <div className="text-center">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 卦辭 ──
              </span>
              <p className="text-2xl font-medium mt-4 leading-relaxed">
                {hexagram.judgment}
              </p>
            </div>
          </div>

          <div className="trad-card p-6">
            <div className="text-center mb-4">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 彖曰 ──
              </span>
              <p className="text-lg mt-3 leading-relaxed opacity-90">
                {hexagram.judgmentTitle}
              </p>
            </div>

            <div className="ornament-divider my-6">◆</div>

            <div className="text-center">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 象曰 ──
              </span>
              <p className="text-xl mt-3" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {hexagram.image}
              </p>
            </div>
          </div>

          {/* Six Lines */}
          <div className="trad-card p-6">
            <div className="text-center mb-6">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 六爻 ──
              </span>
            </div>
            <div className="space-y-3">
              {[...result.lines].reverse().map((line, idx) => {
                const realIdx = 5 - idx;
                return (
                  <div 
                    key={line.position}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      line.isChanging 
                        ? 'bg-red-900/20 border border-red-700/40' 
                        : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs opacity-50 w-12">
                        {line.position === 1 ? '初爻' : line.position === 6 ? '上爻' : `六${['','二','三','四','五'][line.position - 1]}爻`}
                      </span>
                      <span 
                        className={`text-3xl ${line.isChanging ? 'line-changing' : line.symbol === '—' ? 'line-yang' : 'line-yin'}`}
                      >
                        {line.symbol}
                      </span>
                      {line.isChanging && (
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}
                        >
                          動
                        </span>
                      )}
                    </div>
                    <span className="text-right text-sm opacity-90 flex-1 ml-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                      {hexagram.lines[realIdx].judgment}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Five dimensions */}
          <div className="trad-card p-6">
            <div className="text-center mb-4">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 五行分析 ──
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {[
                { label: '金', value: wuxing['金'], desc: '性情剛毅' },
                { label: '木', value: wuxing['木'], desc: '仁慈惻隱' },
                { label: '水', value: wuxing['水'], desc: '聰明智慧' },
                { label: '火', value: wuxing['火'], desc: '禮貌熱情' },
                { label: '土', value: wuxing['土'], desc: '忠信誠實' },
              ].map((w, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold mb-1" style={{ color: w.value > 0 ? 'var(--gold)' : 'var(--cream)' }}>
                    {w.label}
                  </div>
                  <div className={`text-lg font-bold ${w.value > 0 ? 'text-green-400' : w.value < 0 ? 'text-red-400' : ''}`}>
                    {w.value > 0 ? '+' : ''}{w.value}
                  </div>
                  <div className="text-xs opacity-60">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center pt-4 pb-8">
            <button
              onClick={handleReset}
              className="trad-btn"
            >
              重新占卜
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trad-bg min-h-screen">
      {/* Step indicator */}
      {step !== 'home' && step !== 'result' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
          {['home', 'info', 'settle', 'casting'].map((s, i) => (
            <div 
              key={s}
              className={`step-dot ${
                step === s ? 'active' : 
                ['home', 'info', 'settle', 'casting'].indexOf(step) > i ? 'completed' : ''
              }`}
            />
          ))}
        </div>
      )}

      {/* Back button */}
      {step !== 'home' && (
        <button
          onClick={step === 'result' ? handleReset : handleReset}
          className="fixed top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}

      {step === 'home' && renderHome()}
      {step === 'info' && renderInfo()}
      {step === 'settle' && renderSettle()}
      {step === 'casting' && renderCasting()}
      {step === 'result' && renderResult()}
    </div>
  );
}
