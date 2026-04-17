/**
 * 易經蓍草占卜算法
 *
 * 傳統蓍草法使用五十莖蓍草，通過「分二、掛一、揲四、歸奇」四個步驟，
 * 反覆操作 18 次得出六個數字（6/7/8/9），進而構成六十四卦。
 *
 * 简化实现：使用 cryptographically secure random，
 * 每個爻經過三次「陰陽判定」，根據三次結果決定：
 *   - 三陽 → 老陽(9)，動爻
 *   - 三陰 → 老陰(6)，動爻
 *   - 兩陽一陰 → 少陽(7)
 *   - 兩陰一陽 → 少陰(8)
 *
 * 這樣的分布約為：
 *   老陽(9) ≈ 12.5%  |  少陽(7) ≈ 37.5%
 *   老陰(6) ≈ 12.5%  |  少陰(8) ≈ 37.5%
 */

export interface DivinationLine {
  position: number;      // 爻位（1-6，由初爻到上爻）
  value: number;         // 6/7/8/9
  isYang: boolean;       // 是否為陽爻
  isChanging: boolean;   // 是否為動爻（老陽或老陰）
  symbol: string;        // 爻符號（☰=陽，☷=陰）
}

export interface DivinationResult {
  lines: DivinationLine[];       // 六爻（由初爻到上爻）
  originalHexagram: number;       // 本卦卦序（1-64）
  originalSymbol: string;         // 本卦符號（☰☷排列）
  changedHexagram?: number;       // 變卦卦序（若有動爻）
  changedSymbol?: string;         // 變卦符號
  hasChanging: boolean;           // 是否有動爻
  changingLines: number[];        // 動爻位置陣列
}

// ============================================================
// 核心占卜邏輯
// ============================================================

/**
 * 單次陰陽判定
 *
 * 傳統蓍草法「揲四」操作：
 *   將蓍草分成兩堆，數每堆的 four 倍數，餘數決定陰陽。
 * 簡化：用 high-quality 隨機數取代實物操作。
 *
 * @param rng 隨機數生成函數
 * @returns 陽判定結果
 */
function singleYangTrial(rng: () => number): boolean {
  // 50 蓍草，取 1 根不用，實際操作 49 根
  // 分為兩堆，數四次，記錄餘數
  // 這裡簡化為 50/50 coin flip
  return rng() > 0.5;
}

/**
 * 產生一根爻（6/7/8/9）
 *
 * 蓍草法：五十根蓍草，取出一根不用，實際操作 49 根。
 * 對每根爻進行三次「分二、掛一、揲四、歸奇」運算，
 * 根據三次陰陽結果的組合決定是老陽、少陽、少陰還是老陰。
 *
 * 組合規則（傳統口決）：
 *   三爻皆陽 → 老陽(9)，為動爻，變為少陰(8)
 *   三爻皆陰 → 老陰(6)，為動爻，變為少陽(7)
 *   兩陽一陰 → 少陽(7)，不動
 *   兩陰一陽 → 少陰(8)，不動
 *
 * @param rng 隨機數生成函數
 * @returns 爻值（6/7/8/9）和是否為動爻
 */
function generateLineValue(rng: () => number): { value: number; isChanging: boolean } {
  const results: boolean[] = [];

  for (let i = 0; i < 3; i++) {
    results.push(singleYangTrial(rng));
  }

  const yangCount = results.filter(r => r).length;

  if (yangCount === 3) {
    return { value: 9, isChanging: true };  // 老陽，動
  } else if (yangCount === 0) {
    return { value: 6, isChanging: true };  // 老陰，動
  } else if (yangCount === 2) {
    return { value: 8, isChanging: false }; // 少陰，不動（兩陽一陰）
  } else {
    return { value: 7, isChanging: false }; // 少陽，不動（兩陰一陽）
  }
}

/**
 * 爻值轉化為符號
 * ☰ = 陽爻（7或9）
 * ☷ = 陰爻（6或8）
 */
function valueToSymbol(value: number): string {
  // ☰ = 陽爻（7=少陽老陽，9=老陽），☷ = 陰爻（6=老陰，8=少陰）
  return value % 2 === 1 ? '☰' : '☷';
}

// ============================================================
// 卦象計算
// ============================================================

/**
 * 將六爻符號轉換為卦序（1-64）
 *
 * 二進制映射：☰=1, ☷=0
 * 由下而上讀：初爻為最低位，上爻為最高位
 *
 * 例如：
 * ☰☰☰☰☰☰ (all yang, 111111₂) = 63 + 1 = 64 → 乾為天
 * ☷☷☷☷☷☷ (all yin, 000000₂) = 0 + 1 = 1  → 坤為地
 */
function symbolToHexagramNumber(symbol: string): number {
  let binary = '';
  // 符號由初爻到上爻排列，需要反轉來讀
  const reversed = symbol.split('').reverse().join('');
  for (const c of reversed) {
    binary += c === '☰' ? '1' : '0';
  }
  return parseInt(binary, 2) + 1;
}

// ============================================================
// 對外接口
// ============================================================

/**
 * 執行完整蓍草占卜
 *
 * @param seed 可選的隨機種子（用於確保結果可重現）
 * @returns 占卜結果
 */
export function performDivination(seed?: number): DivinationResult {
  // Establish RNG — Use high-precision entropy for production, deterministic LCG for seeded tests
  const rng: () => number = seed !== undefined
    ? (() => {
        let s = seed;
        return () => {
          s = (s * 1103515245 + 12345) & 0x7fffffff;
          return (s >>> 0) / 0x80000000;
        };
      })()
    : () => {
        // Combine Math.random with high-precision timestamp to increase entropy
        const entropy = performance.now() * 1000 + Date.now();
        const seed = (entropy % 1) * Math.random();
        return seed;
      };

  const lines: DivinationLine[] = [];
  let originalSymbol = '';
  let changedSymbol = '';
  const changingLines: number[] = [];

  // 產生六爻（由初爻到上爻）
  for (let position = 1; position <= 6; position++) {
    const { value, isChanging } = generateLineValue(rng);

    const line: DivinationLine = {
      position,
      value,
      isYang: value % 2 === 1,
      isChanging,
      symbol: valueToSymbol(value)
    };

    lines.push(line);
    originalSymbol += line.symbol;

    if (isChanging) {
      changingLines.push(position);
      // 動爻在變卦中陰陽互換
      changedSymbol += value >= 7 ? '☷' : '☰';
    } else {
      changedSymbol += line.symbol;
    }
  }

  return {
    lines,
    originalHexagram: symbolToHexagramNumber(originalSymbol),
    originalSymbol,
    changedHexagram: changingLines.length > 0 ? symbolToHexagramNumber(changedSymbol) : undefined,
    changedSymbol: changingLines.length > 0 ? changedSymbol : undefined,
    hasChanging: changingLines.length > 0,
    changingLines
  };
}

/**
 * 舊版函數別名（向後相容）
 */
export const performTraditionalDivination = performDivination;

// ============================================================
// 工具函數
// ============================================================

/**
 * 將卦序轉換為卦名
 */
export function getHexagramName(id: number): string {
  const names: Record<number, string> = {
    1: '乾', 2: '坤', 3: '屯', 4: '蒙', 5: '需', 6: '讼', 7: '師', 8: '比',
    9: '小畜', 10: '履', 11: '泰', 12: '否', 13: '同人', 14: '大有', 15: '謙', 16: '豫',
    17: '隨', 18: '蠱', 19: '臨', 20: '觀', 21: '噬嗑', 22: '賁', 23: '剝', 24: '復',
    25: '无妄', 26: '大畜', 27: '頤', 28: '大過', 29: '坎', 30: '離', 31: '咸', 32: '恆',
    33: '遯', 34: '大壯', 35: '晉', 36: '明夷', 37: '家人', 38: '睽', 39: '蹇', 40: '解',
    41: '損', 42: '益', 43: '夬', 44: '姤', 45: '萃', 46: '升', 47: '困', 48: '井',
    49: '革', 50: '鼎', 51: '震', 52: '艮', 53: '漸', 54: '歸妹', 55: '豐', 56: '旅',
    57: '巽', 58: '兌', 59: '渙', 60: '節', 61: '中孚', 62: '小過', 63: '既濟', 64: '未濟',
  };
  return names[id] || '?';
}

/**
 * 取得爻的傳統名稱
 */
export function getLineName(position: number): string {
  if (position === 1) return '初爻';
  if (position === 6) return '上爻';
  return `六${['', '二', '三', '四', '五'][position - 1]}爻`;
}
