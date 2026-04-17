/**
 * 易經解讀共享函數
 * 
 * 被 page.tsx 和 r/[encoded]/page.tsx 共用
 */

// ============================================================
// 基礎常數
// ============================================================

export const TRIGRAM_WUXING: Record<string, string> = {
  '乾': '金', '兌': '金',
  '坤': '土', '艮': '土',
  '震': '木', '巽': '木',
  '離': '火', '坎': '水',
};

// 傳統吉凶卦象分類（民間常用分類，非學術定論）
const AUSPICIOUS_IDS = new Set([
  1, 3, 5, 8, 14, 15, 16, 18, 24, 26, 27, 29, 30, 33, 35, 37, 38,
  41, 42, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58,
  59, 60, 61, 62, 63, 64
]);

const INAUSPICIOUS_IDS = new Set([
  2, 4, 7, 20, 21, 22, 23, 25, 28, 31, 32, 34, 36, 39, 40, 43, 50
]);

// ============================================================
// 五行計算
// ============================================================

export function computeWuxing(above: string, below: string): Record<string, number> {
  const aboveEl = TRIGRAM_WUXING[above] || '土';
  const belowEl = TRIGRAM_WUXING[below] || '土';
  const result: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  result[aboveEl] += 1;
  result[belowEl] += 1;
  // 陰陽調整
  const yinTrigrams = ['坤', '坎', '艮', '巽', '離'];
  const aboveYin = yinTrigrams.includes(above);
  const belowYin = yinTrigrams.includes(below);
  if (aboveYin) result[aboveEl] -= 0.5;
  else result[aboveEl] += 0.5;
  if (belowYin) result[belowEl] -= 0.5;
  else result[belowEl] += 0.5;
  return result;
}

// ============================================================
// 整體吉凶判斷
// ============================================================

export interface FortuneResult {
  rating: string;    // 吉 / 凶 / 平 / 吉帶變 / 凶帶變 / 平帶變 / 大變動
  emoji: string;      // 視覺符號
  color: string;      // CSS color
  summary: string;    // 簡述
  advice: string;     // 建議
}

export function assessFortune(hexagramId: number, changingCount: number): FortuneResult {
  const isAuspicious = AUSPICIOUS_IDS.has(hexagramId);
  const isInauspicious = INAUSPICIOUS_IDS.has(hexagramId);

  if (changingCount === 0) {
    if (isAuspicious) {
      return {
        rating: '吉', emoji: '✔', color: '#22C55E',
        summary: '此卦顯示事情發展順遂，無需過多變數，保持現狀即可達成目標。',
        advice: '穩定行事，因勢利導，吉無不利。'
      };
    }
    if (isInauspicious) {
      return {
        rating: '凶', emoji: '✘', color: '#EF4444',
        summary: '此卦顯示阻力較大，若強行推進恐有不利之事發生。',
        advice: '審時度勢，不宜妄動，宜守不宜攻。'
      };
    }
    return {
      rating: '平', emoji: '○', color: '#C9A227',
      summary: '此卦顯示事情處於中性狀態，結果好壞取決於人的作為。',
      advice: '謹慎行事，順其自然，結果未定。'
    };
  }

  if (changingCount <= 2) {
    if (isAuspicious) {
      return {
        rating: '吉帶變', emoji: '◑', color: '#F59E0B',
        summary: '此卦本吉，但有變數在其中。變化之中需謹慎把握，方能趨吉避凶。',
        advice: '把握時機，順勢而為，雖有波折但終歸吉利。'
      };
    }
    if (isInauspicious) {
      return {
        rating: '凶帶變', emoji: '◐', color: '#F97316',
        summary: '此卦本有隱患，但變化之中孕育轉機。若能及時調整，或可轉凶為吉。',
        advice: '防微杜漸，積極轉變，或可逢凶化吉。'
      };
    }
    return {
      rating: '平帶變', emoji: '◔', color: '#C9A227',
      summary: '此卦顯示局勢將有所變化，結果取決於如何應對此變化。',
      advice: '審時度勢，靈活應對，積極求變。'
    };
  }

  // 3+ 動爻
  return {
    rating: '大變動', emoji: '⚡', color: '#8B5CF6',
    summary: '此卦顯示將有重大變化，人生或事物將迎來轉折點。變化劇烈，結果未定。',
    advice: '謹言慎行，切忌衝動，把握轉機可致吉利。'
  };
}

// ============================================================
// 卦辭解讀
// ============================================================

export function interpretJudgment(judgment: string): string {
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

// ============================================================
// 象辭解讀
// ============================================================

export function interpretImage(image: string): string {
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

// ============================================================
// 爻位名稱
// ============================================================

export function getLineLabel(position: number): string {
  if (position === 1) return '初爻';
  if (position === 6) return '上爻';
  return `六${['', '二', '三', '四', '五'][position - 1]}爻`;
}
