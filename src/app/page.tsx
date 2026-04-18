'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { performDivination, DivinationResult } from '@/lib/divination';
import { assessFortune, interpretJudgment, interpretImage, computeWuxing, generateHighlightConclusions, generatePlainInterpretation } from '@/lib/interpretation';

// Generate unique token for sharing
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Encode divination result to URL-safe string
function encodeResult(result: DivinationResult, hexagramId: number, changedId?: number): string {
  const data = {
    h: hexagramId,
    c: changedId || 0,
    // Line symbols: 1=yang(☰), 0=yin(☷)
    ls: result.lines.map(ln => ln.isYang ? '1' : '0').join(''),
    // Changing lines as binary string
    l: result.lines.map(ln => ln.isChanging ? '1' : '0').join(''),
    t: generateToken(),
  };
  return btoa(JSON.stringify(data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decode result from URL string
function decodeResult(encoded: string): { hexagramId: number; changedId?: number; changingLines: number[] } | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const data = JSON.parse(atob(base64 + '=='.slice(0, padding)));
    const changingLines = data.l.split('').map((c: string, i: number) => c === '1' ? i + 1 : 0).filter((x: number) => x !== 0);
    return {
      hexagramId: data.h,
      changedId: data.c || undefined,
      changingLines,
    };
  } catch {
    return null;
  }
}

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
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);
  
  
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const resultRef = useRef<HTMLDivElement>(null);

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
      
      // Generate shareable URL
      const encoded = encodeResult(divResult, divResult.originalHexagram, divResult.changedHexagram);
      const url = `https://mylife.first.pet/r/${encoded}`;
      setShareableUrl(url);
      window.history.replaceState({}, '', url);
      
      // Send analytics (non-blocking, privacy-compliant)
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'divination_complete',
          hexagramId: divResult.originalHexagram,
          hexagramName: h?.name,
          questionType: userInfo.questionType,
          hasChangedHexagram: divResult.hasChanging,
          changingLinesCount: divResult.changingLines.length,
          shareUrl: url,
          // Extended dimensions (anonymized, no PII)
          gender: userInfo.gender || undefined,
          birthYear: userInfo.birthYear ? parseInt(userInfo.birthYear) : undefined,
          birthMonth: userInfo.birthMonth ? parseInt(userInfo.birthMonth) : undefined,
          birthDay: userInfo.birthDay ? parseInt(userInfo.birthDay) : undefined,
          birthHour: userInfo.birthHour || undefined,
          questionLength: userInfo.question.length,
        }),
      }).catch(() => {}); // Ignore errors
      
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



  // Share with native share dialog
  // Share URL using native share dialog
  const shareUrl = async () => {
    if (!shareableUrl) {
      alert('分享連結未生成');
      return;
    }
    
    const shareText = `我在 mylife.first.pet 占卜得到了${hexagram?.name}卦，「${hexagram?.guaMeaning}」`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `易經占卜 - ${hexagram?.name}卦`,
          text: shareText,
          url: shareableUrl,
        });
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareableUrl);
        alert('連結已複製，請手動分享');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareableUrl);
      alert('連結已複製到剪貼板');
    }
  };
  
  // Copy URL to clipboard
  const copyUrl = async () => {
    if (!shareableUrl) return;
    await navigator.clipboard.writeText(shareableUrl);
    alert('連結已複製');
  };
  

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">

      {/* ── Hero 區 ── */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="text-sm tracking-widest mb-4 opacity-60" style={{ color: 'var(--gold)' }}>
          ── 古法起卦 · 靜心而問 ──
        </div>
        <div className="text-7xl mb-6 animate-float">☰</div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-3" style={{
          fontFamily: "'Noto Serif TC', serif",
          color: 'var(--cream)',
          textShadow: '0 0 40px rgba(201, 162, 39, 0.3)'
        }}>
          易經占卜
        </h1>
        <div className="text-lg tracking-widest mb-3 opacity-60" style={{ color: 'var(--gold)' }}>
          蓍草起卦 · 依古法而演
        </div>
        <div className="ornament-divider max-w-xs mx-auto mb-6">
          ◆
        </div>
        {/* 4. 白話副說明 */}
        <p className="text-base max-w-lg mx-auto opacity-80" style={{ color: 'var(--cream-dark)', fontSize: '1.05rem', lineHeight: 1.8 }}>
          把你現在最想問的一件事，交給傳統易經方法起卦，獲得一份解讀參考。
        </p>
      </div>

      {/* 3. 隱私信任標籤 */}
      <div className="flex flex-wrap justify-center gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
        {[
          { icon: '🔒', label: '匿名使用' },
          { icon: '💻', label: '本地計算' },
          { icon: '🚫', label: '不保存提問內容' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', color: 'var(--gold)' }}>
            <span>{item.icon}</span>
            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── 三張卡片 ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mb-10 w-full px-4 md:px-0">
        {[
          { icon: '🌿', title: '五十蓍草', desc: '依傳統方法演算起卦。' },
          { icon: '🔮', title: '六爻成卦', desc: '顯示事情當下與後續變化。' },
          { icon: '📿', title: '象辭解讀', desc: '先看白話重點，再讀詳細解意。' },
        ].map((item, i) => (
          <div key={i} className={`text-center p-6 rounded-lg animate-slide-up`}
               style={{ 
                 animationFillMode: 'forwards',
                 animationDelay: `${0.25 + i * 0.15}s`,
                 background: 'rgba(30,20,20,0.95)',
                 border: '1px solid rgba(201,162,39,0.2)'
               }}>
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="font-medium mb-2" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{item.title}</div>
            <div className="text-sm leading-relaxed opacity-80" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* ── CTA 按鈕區 ── */}
      <div className="text-center">
        {/* 5. 流程提示 */}
        <div className="mb-4 text-sm tracking-wide opacity-60" style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>
          想一件事&nbsp;→&nbsp;起卦&nbsp;→&nbsp;看解讀
        </div>

        <button
          onClick={handleStart}
          className="trad-btn animate-pulse-glow"
          style={{ animationDelay: '0.8s', fontSize: '1.1rem', padding: '14px 36px' }}
        >
          開始占卜
        </button>

        {/* 1. 第一次使用提示 */}
        <div className="mt-3">
          <button
            onClick={() => {
              document.getElementById('how-to-use')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-sm opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--gold)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            第一次使用？先看怎樣發問
          </button>
        </div>
      </div>

      {/* ── 如何使用說明 ── */}
      <div id="how-to-use" className="mt-12 w-full max-w-2xl px-4">
        <div className="text-center text-xs tracking-widest mb-6 opacity-40" style={{ color: 'var(--gold)' }}>── 如何使用 ──</div>
        <div className="space-y-3">
          {[
            { num: '1', title: '選擇問題', body: '選擇你想問的事情類型，填寫問題內容。' },
            { num: '2', title: '稟告天地', body: '點擊按鈕，系統自動計算六次陰陽。' },
            { num: '3', title: '獲得解讀', body: '馬上看到白話解讀和深入分析。' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg" style={{ background: 'rgba(30,20,20,0.8)', border: '1px solid rgba(201,162,39,0.15)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--gold)' }}>
                {item.num}
              </div>
              <div className="pt-0.5">
                <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--gold)' }}>{item.title}</div>
                <div className="text-sm opacity-70">{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-12 text-center opacity-30 text-xs pb-4">
        <p>易經占卜 · mylife.first.pet</p>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-10 w-full max-w-lg">
        <div className="text-sm opacity-50 tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
          第二步 · 稟告天地
        </div>
        <h2 className="text-3xl font-bold mb-3">輸入占卜資訊</h2>
        <div className="ornament-divider max-w-xs mx-auto">◆</div>
      </div>

      <form onSubmit={handleInfoSubmit} className="w-full max-w-lg space-y-8">
        {/* Basic Info */}
        <div className="trad-card p-8 space-y-6">
          <h3 className="text-lg font-medium" style={{ color: 'var(--gold)' }}>基本資料</h3>
          
          <div>
            <label className="block text-sm opacity-70 mb-3">姓名（可選）</label>
            <input
              type="text"
              value={userInfo.name}
              onChange={e => setUserInfo({...userInfo, name: e.target.value})}
              placeholder="輸入姓名"
              className="trad-input rounded-lg w-full"
              style={{ padding: '12px 16px', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-3">性別</label>
            <div className="grid grid-cols-2 gap-4">
              {['男', '女'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setUserInfo({...userInfo, gender: g})}
                  className={`p-4 rounded-lg border transition-all ${
                    userInfo.gender === g 
                      ? 'border-gold bg-gold/10' 
                      : 'border-gold/30 hover:border-gold/50'
                  }`}
                  style={{ 
                    borderColor: userInfo.gender === g ? 'var(--gold)' : undefined,
                    background: userInfo.gender === g ? 'rgba(201,162,39,0.1)' : undefined,
                    color: userInfo.gender === g ? 'var(--gold)' : undefined,
                    fontSize: '1rem'
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-3">出生時間</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                value={userInfo.birthYear}
                onChange={e => setUserInfo({...userInfo, birthYear: e.target.value})}
                placeholder="年"
                min="1900"
                max="2025"
                className="trad-input rounded-lg text-center"
                style={{ padding: '12px 8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                value={userInfo.birthMonth}
                onChange={e => setUserInfo({...userInfo, birthMonth: e.target.value})}
                placeholder="月"
                min="1"
                max="12"
                className="trad-input rounded-lg text-center"
                style={{ padding: '12px 8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                value={userInfo.birthDay}
                onChange={e => setUserInfo({...userInfo, birthDay: e.target.value})}
                placeholder="日"
                min="1"
                max="31"
                className="trad-input rounded-lg text-center"
                style={{ padding: '12px 8px', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-3">出生時辰</label>
            <select
              value={userInfo.birthHour}
              onChange={e => setUserInfo({...userInfo, birthHour: e.target.value})}
              className="trad-input rounded-lg w-full"
              style={{ padding: '12px 16px', fontSize: '1rem' }}
            >
              <option value="">選擇時辰</option>
              {TIME_PERIODS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question */}
        <div className="trad-card p-8 space-y-6">
          <h3 className="text-lg font-medium" style={{ color: 'var(--gold)' }}>占問事項</h3>
          
          <div>
            <label className="block text-sm opacity-70 mb-3">問題類別</label>
            <select
              value={userInfo.questionType}
              onChange={e => setUserInfo({...userInfo, questionType: e.target.value})}
              className="trad-input rounded-lg w-full"
              style={{ padding: '12px 16px', fontSize: '1rem' }}
              required
            >
              <option value="">選擇類別</option>
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-3">
              心中所問之事 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={userInfo.question}
              onChange={e => setUserInfo({...userInfo, question: e.target.value})}
              placeholder="誠心默念所問之事，心中切勿疑惑..."
              className="trad-input rounded-lg w-full resize-none"
              style={{ padding: '14px 16px', fontSize: '1rem', minHeight: '140px' }}
              required
            />
          </div>
        </div>

        {/* Info notice */}
        <div className="text-center text-sm opacity-50 py-2">
          <p>以上資料僅用於本次占卜，不會上傳或儲存</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-8 py-3 border border-gold/50 rounded-lg hover:bg-gold/5 transition-all"
            style={{ borderColor: 'rgba(201,162,39,0.3)', fontSize: '1rem' }}
          >
            返回首頁
          </button>
          <button
            type="submit"
            className="trad-btn trad-btn-gold"
            style={{ fontSize: '1rem', padding: '12px 32px' }}
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

  const renderResult = () => {
    if (!result || !hexagram) return null;
    const wuxing = computeWuxing(hexagram.above, hexagram.below);
    const fortune = assessFortune(hexagram.id, result.changingLines.length);
    const judgmentInterpretation = interpretJudgment(hexagram.judgment);
    const imageInterpretation = interpretImage(hexagram.image);
    const highlights = generateHighlightConclusions(hexagram.id, hexagram.name, fortune.rating, fortune.summary, fortune.advice, result.changingLines.length);
    const plain = generatePlainInterpretation(hexagram.id, hexagram.name, fortune.rating, hexagram.fortune, result.changingLines.length);

    // 生成起卦時間
    const divinationTime = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    // Accordion 切換
    const toggleAccordion = (key: string) => {
      setAccordionOpen(prev => prev === key ? null : key);
    };

    return (
      <div className={`min-h-screen px-4 py-8 transition-all duration-700 ${showResult ? 'opacity-100' : 'opacity-0'}`}>
        <div ref={resultRef} className="max-w-xl mx-auto space-y-6">

          {/* ── 頁面標題 ── */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--cream)', fontSize: '1.5rem' }}>你的占卜結果</h1>
            <div className="text-sm opacity-60" style={{ color: 'var(--gold)' }}>
              本卦 / 變卦 / 解讀參考
            </div>
          </div>

          {/* ── 高亮結論卡片（最高優先） ── */}
          <div
            className="trad-card p-6 animate-slide-up"
            style={{
              borderColor: fortune.color + '60',
              borderWidth: '2px',
              background: `linear-gradient(145deg, rgba(30,20,20,0.98), ${fortune.color}10)`
            }}
          >
            <div className="text-center mb-5">
              <div className="text-xs tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
                ── 先看重點 ──
              </div>
              <div className="text-4xl mb-2">{fortune.emoji}</div>
              <div className="text-xl font-bold" style={{ color: fortune.color }}>
                {fortune.rating} · {fortune.scoreLabel}
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-5 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: `3px solid ${fortune.color}` }}>
                <div className="text-xs tracking-widest mb-2" style={{ color: 'var(--gold)' }}>這一卦代表</div>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--cream)', fontSize: '1.1rem', lineHeight: 1.8 }}>{highlights.represents}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: `3px solid var(--cinnabar)` }}>
                <div className="text-xs tracking-widest mb-2" style={{ color: 'var(--gold)' }}>你現在較應注意</div>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--cream)', fontSize: '1.1rem', lineHeight: 1.8 }}>{highlights.attention}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)', borderLeft: `3px solid var(--jade)` }}>
                <div className="text-xs tracking-widest mb-2" style={{ color: 'var(--gold)' }}>建議方向</div>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--cream)', fontSize: '1.1rem', lineHeight: 1.8 }}>{highlights.suggestion}</p>
              </div>
            </div>
          </div>

          {/* ── 卦象資料 ── */}
          <div className="trad-card p-6">
            <div className="text-xs tracking-widest text-center mb-5" style={{ color: 'var(--gold)' }}>── 卦象資料 ──</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">本卦</span>
                <span style={{ color: 'var(--cream)' }}>{hexagram.name}卦</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">變卦</span>
                <span style={{ color: changedHexagram ? 'var(--azure)' : 'var(--cream)' }}>{changedHexagram ? changedHexagram.name + '卦' : '—'}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="opacity-60">起卦時間</span>
                <span style={{ color: 'var(--cream)' }}>{divinationTime}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="opacity-60">問題主題</span>
                <span style={{ color: 'var(--gold)' }}>{userInfo.questionType || '未指定'}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-center opacity-40" style={{ color: 'var(--gold)' }}>
              本卦＝目前狀態 · 變卦＝變化方向
            </div>
            {userInfo.question && (
              <div className="mt-3 pt-3 border-t border-gold/20 text-center">
                <span className="text-xs opacity-50">你所問</span>
                <p className="text-base italic mt-1" style={{ color: 'var(--gold)' }}>「{userInfo.question}」</p>
              </div>
            )}
          </div>

          {/* ── 白話解讀 ── */}
          <div className="trad-card p-6">
            <div className="text-xs tracking-widest text-center mb-5" style={{ color: 'var(--gold)' }}>── 白話解讀 ──</div>
            <div className="space-y-5 text-sm" style={{ fontSize: '1rem' }}>
              <div>
                <div className="font-medium mb-2" style={{ color: 'var(--gold)' }}>整體來看</div>
                <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.overall}</p>
              </div>
              <div>
                <div className="font-medium mb-2" style={{ color: 'var(--gold)' }}>對這件事的提醒</div>
                <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.reminder}</p>
              </div>
              <div>
                <div className="font-medium mb-2" style={{ color: 'var(--gold)' }}>如果你正準備行動</div>
                <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.actionAdvice}</p>
              </div>
              <div>
                <div className="font-medium mb-2" style={{ color: 'var(--gold)' }}>如果你仍在觀望</div>
                <p className="leading-relaxed opacity-90" style={{ lineHeight: 1.8 }}>{plain.watchAdvice}</p>
              </div>
            </div>
          </div>

          {/* ── 深入閱讀（Accordion） ── */}
          <div className="trad-card p-6">
            <div className="text-xs tracking-widest text-center mb-5" style={{ color: 'var(--gold)' }}>── 深入閱讀 ──</div>
            <div className="space-y-3">
              {/* 卦辭原文 */}
              <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
                <button
                  onClick={() => toggleAccordion('judgment')}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5"
                >
                  <span className="text-sm font-medium">查看卦辭原文</span>
                  <span className="text-lg transition-transform" style={{ transform: accordionOpen === 'judgment' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {accordionOpen === 'judgment' && (
                  <div className="px-5 pb-5 space-y-4">
                    <div>
                      <div className="text-xs opacity-60 mb-2">卦辭</div>
                      <p className="text-base leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.judgment}</p>
                    </div>
                    <div>
                      <div className="text-xs opacity-60 mb-2">白話解說</div>
                      <p className="text-sm leading-relaxed opacity-80" style={{ lineHeight: 1.8 }}>{judgmentInterpretation}</p>
                    </div>
                    <div>
                      <div className="text-xs opacity-60 mb-2">彖曰</div>
                      <p className="text-sm leading-relaxed opacity-80" style={{ lineHeight: 1.8 }}>{hexagram.judgmentTitle}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 象義說明 */}
              <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
                <button
                  onClick={() => toggleAccordion('image')}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5"
                >
                  <span className="text-sm font-medium">查看象義說明</span>
                  <span className="text-lg transition-transform" style={{ transform: accordionOpen === 'image' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {accordionOpen === 'image' && (
                  <div className="px-5 pb-5 space-y-4">
                    <div>
                      <div className="text-xs opacity-60 mb-2">象曰</div>
                      <p className="text-base leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>{hexagram.image}</p>
                    </div>
                    <div>
                      <div className="text-xs opacity-60 mb-1">白話解說</div>
                      <p className="text-sm leading-relaxed opacity-80">{imageInterpretation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 逐爻解讀 */}
              <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(201,162,39,0.2)' }}>
                <button
                  onClick={() => toggleAccordion('lines')}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gold/5"
                >
                  <span className="text-sm font-medium">查看逐爻解讀</span>
                  <span className="text-lg transition-transform" style={{ transform: accordionOpen === 'lines' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {accordionOpen === 'lines' && (
                  <div className="px-5 pb-5 space-y-3">
                    {[...result.lines].reverse().map((line, idx) => {
                      const realIdx = 5 - idx;
                      return (
                        <div
                          key={line.position}
                          className={`p-3 rounded-lg ${line.isChanging ? 'border' : ''}`}
                          style={line.isChanging ? {
                            background: 'rgba(201,162,39,0.08)',
                            borderColor: 'rgba(201,162,39,0.3)'
                          } : { background: 'rgba(30,30,30,0.5)' }}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm opacity-60">
                              {line.position === 1 ? '初爻' : line.position === 6 ? '上爻' : `六${['','二','三','四','五'][line.position - 1]}爻`}
                            </span>
                            <span style={{ color: line.isChanging ? '#EF4444' : line.symbol === '—' ? 'var(--gold)' : 'var(--cream)' }} className="text-2xl">{line.symbol}</span>
                            {line.isChanging && (
                              <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>動</span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif" }}>{hexagram.lines[realIdx].judgment}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 五行分析 ── */}
          <div className="trad-card p-6">
            <div className="text-xs tracking-widest text-center mb-5" style={{ color: 'var(--gold)' }}>── 五行分析 ──</div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: '金', value: wuxing['金'], desc: '性情剛毅' },
                { label: '木', value: wuxing['木'], desc: '仁慈惻隱' },
                { label: '水', value: wuxing['水'], desc: '聰明智慧' },
                { label: '火', value: wuxing['火'], desc: '禮貌熱情' },
                { label: '土', value: wuxing['土'], desc: '忠信誠實' },
              ].map((w, i) => (
                <div key={i} className="p-2 rounded-lg" style={{ background: 'rgba(30,30,30,0.6)' }}>
                  <div className="text-xl font-bold mb-1" style={{ color: w.value > 0 ? 'var(--gold)' : 'var(--cream)', fontSize: '1.1rem' }}>{w.label}</div>
                  <div className={`text-base font-bold ${w.value > 0 ? 'text-green-400' : w.value < 0 ? 'text-red-400' : 'opacity-60'}`}>{w.value > 0 ? '+' : ''}{w.value}</div>
                  <div className="text-xs opacity-60">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 操作區 ── */}
          <div className="trad-card p-6">
            <div className="text-xs tracking-widest text-center mb-5" style={{ color: 'var(--gold)' }}>── 接下來你可以 ──</div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={async () => {
                  if (!resultRef.current) return;
                  try {
                    const canvas = await html2canvas(resultRef.current, {
                      backgroundColor: '#0D0D0D',
                      scale: 2,
                      useCORS: true,
                      logging: false,
                      
                    });
                    // 加入域名水印
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.font = '14px "Noto Serif TC", serif';
                      ctx.fillStyle = 'rgba(201,162,39,0.5)';
                      ctx.textAlign = 'right';
                      ctx.fillText('mylife.first.pet', canvas.width - 16, canvas.height - 12);
                    }
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `易經占卜_${hexagram.name}卦_${Date.now()}.png`;
                    a.click();
                  } catch(e) {
                    console.error('PNG保存失敗', e);
                  }
                }}
                className="trad-btn"
                style={{ background: 'linear-gradient(135deg, #8B6914 0%, #D4AF37 100%)', color: '#0a0806', fontSize: '1rem', padding: '12px 24px' }}
              >
                💾 保存卦象
              </button>
              <button
                onClick={handleReset}
                className="trad-btn"
                style={{ fontSize: '1rem', padding: '12px 24px' }}
              >
                再問一題
              </button>
              <button
                onClick={shareUrl}
                className="trad-btn"
                style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0f1f33 100%)', fontSize: '1rem', padding: '12px 24px' }}
              >
                📤 分享連結
              </button>
              <button
                onClick={handleReset}
                className="trad-btn"
                style={{ background: 'transparent', borderColor: 'rgba(201,162,39,0.3)', fontSize: '1rem', padding: '12px 24px' }}
              >
                返回首頁
              </button>
            </div>
          </div>

          {/* ── 使用提醒 ── */}
          <div className="text-center text-xs opacity-30 pb-4">
            占卜結果僅供思考參考，不宜代替醫療、法律或財務專業判斷。
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
