'use client';

import { useState, useEffect, useRef } from 'react';
import { hexagrams, Hexagram } from '@/data/hexagrams';
import { performDivination, DivinationResult } from '@/lib/divination';
import html2canvas from 'html2canvas';

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
      
      // Send analytics (non-blocking)
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
    setCapturedImage(null);
  };

  // Capture result as image with watermark
  const captureResultImage = async () => {
    if (!resultRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#0D0D0D',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });
      
      // Add watermark with website URL
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const footerHeight = 50;
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = canvas.width;
        resizedCanvas.height = canvas.height + footerHeight;
        const rctx = resizedCanvas.getContext('2d');
        if (rctx) {
          // Fill background
          rctx.fillStyle = '#0D0D0D';
          rctx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
          // Draw original image
          rctx.drawImage(canvas, 0, 0);
          // Add footer with URL
          rctx.fillStyle = 'rgba(201, 162, 39, 0.7)';
          rctx.font = '24px "Noto Serif TC", serif';
          rctx.textAlign = 'center';
          rctx.fillText('易經占卜 · mylife.first.pet', resizedCanvas.width / 2, canvas.height + 35);
        }
        const dataUrl = resizedCanvas.toDataURL('image/png', 1.0);
        setCapturedImage(dataUrl);
      } else {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setCapturedImage(dataUrl);
      }
    } catch (err) {
      console.error('Failed to capture:', err);
      alert('截圖失敗，請重試');
    } finally {
      setIsCapturing(false);
    }
  };

  // Download captured image
  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `易經占卜_${hexagram?.name}卦_${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  // Capture with watermark then share directly
  const captureAndShare = async () => {
    if (!resultRef.current) {
      alert('截圖失敗：找不到結果元素');
      return;
    }
    setIsCapturing(true);
    try {
      // First ensure result is visible for capture
      const resultEl = resultRef.current;
      const originalOpacity = resultEl.style.opacity;
      resultEl.style.opacity = '1';
      
      // Capture with watermark
      const canvas = await html2canvas(resultEl, {
        backgroundColor: '#0D0D0D',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      
      resultEl.style.opacity = originalOpacity;
      
      // Add footer with URL
      const footerHeight = 70;
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = canvas.width;
      resizedCanvas.height = canvas.height + footerHeight;
      const rctx = resizedCanvas.getContext('2d');
      
      if (!rctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Fill background
      rctx.fillStyle = '#0D0D0D';
      rctx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
      
      // Draw original image
      rctx.drawImage(canvas, 0, 0);
      
      // Add watermark text
      rctx.fillStyle = '#C9A227';
      rctx.font = 'bold 32px sans-serif';
      rctx.textAlign = 'center';
      rctx.fillText('易經占卜 · mylife.first.pet', resizedCanvas.width / 2, canvas.height + 45);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        resizedCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });
      
      const file = new File([blob], `易經占卜_${hexagram?.name}卦.png`, { type: 'image/png' });
      
      // Try Web Share API
      if (navigator.share) {
        try {
          // iOS Safari and some browsers require user gesture and specific format
          await navigator.share({
            title: `易經占卜 - ${hexagram?.name}卦`,
            text: `我在 mylife.first.pet 占卜得到了${hexagram?.name}卦，「${hexagram?.guaMeaning}」`,
          });
          // If share succeeds without files, still try to share with file
          setCapturedImage(resizedCanvas.toDataURL('image/png', 1.0));
        } catch (shareErr) {
          // If share was aborted or failed, offer download
          if ((shareErr as Error).name !== 'AbortError') {
            console.log('Share API failed, offering download:', shareErr);
          }
          downloadImageWithCanvas(resizedCanvas);
        }
      } else {
        // No share API - download directly
        downloadImageWithCanvas(resizedCanvas);
      }
    } catch (err) {
      console.error('Capture/share error:', err);
      alert('分享失敗，請稍後重試');
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Download image from canvas
  const downloadImageWithCanvas = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(dataUrl);
    const link = document.createElement('a');
    link.download = `易經占卜_${hexagram?.name}卦_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
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

// Overall fortune assessment
function assessFortune(hexagramId: number, changingCount: number, questionType: string): { rating: string; emoji: string; color: string; summary: string; advice: string } {
  // Traditional auspicious hexagrams: 1,3,5,8,14,15,16,18,24,26,27,29,30,33,35,37,38,41,42,44,45,46,47,48,49,51,52,53,54,55,56,57,58,59,60,61,62,63,64
  // Inauspicious hexagrams: 2,4,7,20,21,22,23,25,28,31,32,34,36,39,40,43,50,65,66
  const auspiciousIds = [1,3,5,8,14,15,16,18,24,26,27,29,30,33,35,37,38,41,42,44,45,46,47,48,49,51,52,53,54,55,56,57,58,59,60,61,62,63,64];
  const inauspiciousIds = [2,4,7,20,21,22,23,25,28,31,32,34,36,39,40,43,50];
  
  const isAuspicious = auspiciousIds.includes(hexagramId);
  const isInauspicious = inauspiciousIds.includes(hexagramId);
  
  let rating: string;
  let emoji: string;
  let color: string;
  let summary: string;
  let advice: string;
  
  if (changingCount === 0) {
    // No changing lines - the hexagram stands as-is
    if (isAuspicious) {
      rating = '吉'; emoji = '✔'; color = '#22C55E';
      summary = '此卦顯示事情發展順遂，無需過多變數，保持現狀即可達成目標。';
      advice = '穩定行事，因勢利導，吉無不利。';
    } else if (isInauspicious) {
      rating = '凶'; emoji = '✘'; color = '#EF4444';
      summary = '此卦顯示阻力較大，若強行推進恐有不利之事發生。';
      advice = '審時度勢，不宜妄動，宜守不宜攻。';
    } else {
      rating = '平'; emoji = '○'; color = '#C9A227';
      summary = '此卦顯示事情處於中性狀態，結果好壞取決於人的作為。';
      advice = '謹慎行事，顺其自然，結果未定。';
    }
  } else if (changingCount <= 2) {
    // 1-2 changing lines - moderate transformation
    if (isAuspicious) {
      rating = '吉帶變'; emoji = '◑'; color = '#F59E0B';
      summary = '此卦本吉，但有變數在其中。變化之中需謹慎把握，方能趨吉避凶。';
      advice = '把握時機，順勢而為，雖有波折但終歸吉利。';
    } else if (isInauspicious) {
      rating = '凶帶變'; emoji = '◐'; color = '#F97316';
      summary = '此卦本有隱患，但變化之中孕育轉機。若能及時調整，或可轉凶為吉。';
      advice = '防微杜漸，積极轉變，或可逢凶化吉。';
    } else {
      rating = '平帶變'; emoji = '◔'; color = '#C9A227';
      summary = '此卦顯示局勢將有所變化，結果取決於如何應對此變化。';
      advice = '審時度勢，靈活應對，積极求變。';
    }
  } else {
    // 3+ changing lines - major transformation
    rating = '大變動'; emoji = '⚡'; color = '#8B5CF6';
    summary = '此卦顯示將有重大變化，人生或事物將迎來轉折點。變化劇烈，結果未定。';
    advice = '謹言慎行，切忌衝動，把握轉機可致吉利。';
  }
  
  return { rating, emoji, color, summary, advice };
}

// Interpret judgment text
function interpretJudgment(judgment: string, hexagramName: string): string {
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
  
  // Find matching interpretation
  for (const [key, value] of Object.entries(interpretations)) {
    if (judgment.includes(key)) return value;
  }
  
  return `此卦顯示萬物變化之理，「${judgment}」暗示當前局勢的特質。宜順應變化，不可強求。`;
}

// Interpret image text
function interpretImage(image: string): string {
  // Extract key themes from image text
  if (image.includes('自強不息')) {
    return '天道運行，永不停息。此卦象徵積極進取、自強不息之精神。占得此卦者，當效法天道，努力上進，不可懈怠。';
  }
  if (image.includes('厚德載物')) {
    return '大地容納萬物，厚重不偏。此卦象徵寬容忍耐、德性深厚之精神。占得此卦者，當效法大地，包容萬物，修養品德。';
  }
  if (image.includes('獨立')) {
    return '象徵堅強獨立，不依賴他人。占得此卦者，當自強自立，不可依賴僥倖。';
  }
  if (image.includes('順')) {
    return '象徵柔順和諧，隨遇而安。占得此卦者，當順勢而為，不可過於強硬。';
  }
  if (image.includes('動')) {
    return '象徵行動、變化。占得此卦者，萬物萌動之象，有事將起，宜積極行動。';
  }
  if (image.includes('止')) {
    return '象徵停止、靜止。占得此卦者，知止而止之象，局勢到此當止，不宜再進。';
  }
  return '此象顯示天地萬物之理，占得此卦者當順應時勢，效法自然之理。';
}

  const renderResult = () => {
    if (!result || !hexagram) return null;
    const wuxing = computeWuxing(hexagram.above, hexagram.below);
    const fortune = assessFortune(hexagram.id, result.changingLines.length, userInfo.questionType);
    const judgmentInterpretation = interpretJudgment(hexagram.judgment, hexagram.name);
    const imageInterpretation = interpretImage(hexagram.image);

    return (
      <div ref={resultRef} className={`min-h-screen px-4 py-8 transition-all duration-700 ${showResult ? 'opacity-100' : 'opacity-0'}`}>
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
          {/* Fortune Assessment */}
          <div 
            className="trad-card p-6 text-center animate-slide-up"
            style={{ 
              borderColor: fortune.color + '40',
              background: `linear-gradient(145deg, rgba(30,20,20,0.95), ${fortune.color}08)`
            }}
          >
            <div className="text-xs tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
              ── 整體點評 ──
            </div>
            <div 
              className="text-5xl font-bold mb-3"
              style={{ color: fortune.color }}
            >
              {fortune.emoji} {fortune.rating}
            </div>
            <p className="text-base leading-relaxed opacity-90 mb-4">
              {fortune.summary}
            </p>
            <div 
              className="text-sm p-3 rounded-lg inline-block"
              style={{ background: 'rgba(201,162,39,0.1)', color: 'var(--gold-light)' }}
            >
              💡 {fortune.advice}
            </div>
          </div>

          {/* Judgment */}
          <div className="trad-card p-6">
            <div className="text-center">
              <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
                ── 卦辭 ──
              </span>
              <p className="text-2xl font-medium mt-4 leading-relaxed">
                {hexagram.judgment}
              </p>
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)' }}>
                <p className="text-sm leading-relaxed opacity-80">
                  {judgmentInterpretation}
                </p>
              </div>
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
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(201,162,39,0.08)' }}>
                <p className="text-sm leading-relaxed opacity-80">
                  {imageInterpretation}
                </p>
              </div>
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
          <div className="flex flex-wrap gap-4 justify-center pt-4 pb-8">
            <button
              onClick={handleReset}
              className="trad-btn"
            >
              重新占卜
            </button>
            <button
              onClick={captureAndShare}
              disabled={isCapturing}
              className="trad-btn"
              style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0f1f33 100%)' }}
            >
              {isCapturing ? '處理中...' : '📤 直接分享'}
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
