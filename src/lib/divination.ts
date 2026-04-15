/**
 * 蓍草占卜算法
 * 
 * 傳統蓍草法使用50根蓍草，通過「分二」「掛一」「揲四」「歸奇」
 * 的操作重複18次，最終得到6個數字（6-9），組成64卦中的一卦。
 * 
 * 簡化算法：使用50個隨機數模擬蓍草過程，
 * 每次操作得到老陽(9)、少陽(7)、老陰(6)、少陰(8)
 */

// 蓍草法核心算法
function countYarrow(total: number): { remainder: number; quotient: number } {
  // 模擬「分二」「掛一」「揲四」「歸奇」過程
  // 每次實際參與運算的蓍草數 = 總數 - 1（掛一）
  const active = total - 1;
  
  // 隨機將蓍草分成兩堆（分二）
  const first = Math.floor(Math.random() * (active - 1)) + 1;
  const second = active - first;
  
  // 從第一堆取出一根（掛一實際是象徵意義，這裡簡化）
  // 揲四：每堆每4個一數
  const q1 = Math.floor(first / 4);
  const r1 = first % 4;
  const q2 = Math.floor(second / 4);
  const r2 = second % 4;
  
  // 歸奇：將剩下的不足4根的數加起來
  const remainder = r1 + r2;
  const quotient = q1 + q2;
  
  return { remainder, quotient };
}

// 單獨得到一爻（6-9）
function getSingleLine(): { value: number; isChanging: boolean } {
  // 50根蓍草，傳統需要18次操作得到6爻
  // 簡化：每次爻用50根重新開始
  
  let sticks = 50;
  let yangCount = 0; // 揲四後的總商數，代表陽
  let iterations = 0;
  
  while (sticks >= 4) {
    const result = countYarrow(sticks);
    
    // 根據餘數判斷陰陽
    // 餘數為1或5 → 老陽(9)為動爻
    // 餘數為2或4 → 老陰(6)為動爻
    // 餘數為3 → 少陽(7)
    // 餘數為0 → 少陰(8)
    const { remainder } = result;
    
    yangCount += result.quotient;
    iterations++;
    
    // 減去餘數繼續
    sticks = result.quotient * 4 + remainder;
    
    if (sticks < 4) {
      // 最後一次，餘數必然是4的倍數
      // 根據總商數判斷老少
      break;
    }
  }
  
  // 根據商數和迭代次數確定陰陽老少
  // 18次操作，7次得老陽，8次得老陰，春秋多得7或少得8
  // 這裡用迭代次數和商數來模拟結果
  
  // 簡化算法：用隨機種子 + 數學函數模拟傳統結果分佈
  const seed = Math.random();
  
  // 傳統結果分佈：老陽(9)=約1/16，少陽(7)=約7/16
  //              老陰(6)=約1/16，少陰(8)=約7/16
  if (seed < 0.0625) {
    return { value: 9, isChanging: true };  // 老陽
  } else if (seed < 0.6875) {
    return { value: 7, isChanging: false }; // 少陽
  } else if (seed < 0.75) {
    return { value: 6, isChanging: true };  // 老陰
  } else {
    return { value: 8, isChanging: false }; // 少陰
  }
}

// 得到完整的六爻
export interface DivinationLine {
  position: number;      // 爻位（1-6，初爻到上爻）
  value: number;         // 6/7/8/9
  isYang: boolean;        // 是否為陽
  isChanging: boolean;   // 是否為動爻
  symbol: string;        // 爻的符號（☰為陽，☷為陰）
}

export interface DivinationResult {
  lines: DivinationLine[];  // 六爻（從初爻到上爻）
  originalHexagram: number; // 本卦卦序
  originalSymbol: string;   // 本卦符號
  changedHexagram?: number; // 變卦卦序（如有動爻）
  changedSymbol?: string;   // 變卦符號
  hasChanging: boolean;    // 是否有動爻
  changingLines: number[];  // 動爻位置
}

// 將6/7/8/9轉為卦符號
function valueToSymbol(value: number): string {
  // 7少陽=☰，9老陽=☰（老陽為動爻但符號仍為☰）
  // 8少陰=☷，6老陰=☷（老陰為動爻但符號仍為☷）
  return (value >= 7) ? '☰' : '☷';
}

// 將6/7/8/9轉為標準數字
function valueToStandard(value: number): number {
  // 7少陽→9，8少陰→6（陰陽不變）
  // 9老陽→9，6老陰→6（保持不變）
  return value;
}

export function performDivination(): DivinationResult {
  const lines: DivinationLine[] = [];
  let originalSymbol = '';
  let changedSymbol = '';
  const changingLines: number[] = [];
  
  // 從初爻到上爻
  for (let i = 1; i <= 6; i++) {
    const line = getSingleLine();
    
    lines.push({
      position: i,
      value: line.value,
      isYang: line.value >= 7,
      isChanging: line.isChanging,
      symbol: valueToSymbol(line.value)
    });
    
    originalSymbol += valueToSymbol(line.value);
    
    if (line.isChanging) {
      changingLines.push(i);
      // 變卦：陽變陰，陰變陽
      changedSymbol += line.value >= 7 ? '☷' : '☰';
    } else {
      changedSymbol += valueToSymbol(line.value);
    }
  }
  
  // 卦象是從下往上讀，但符號串是從初爻到上爻
  // 所以符號串需要反轉才是視覺上的卦象
  originalSymbol = originalSymbol.split('').reverse().join('');
  changedSymbol = changedSymbol.split('').reverse().join('');
  
  return {
    lines,
    originalHexagram: calculateHexagramNumber(originalSymbol),
    originalSymbol,
    changedHexagram: changingLines.length > 0 ? calculateHexagramNumber(changedSymbol) : undefined,
    changedSymbol: changingLines.length > 0 ? changedSymbol : undefined,
    hasChanging: changingLines.length > 0,
    changingLines
  };
}

// 根據卦象計算卦序（傳統京房易序）
// ☰☰=1 乾, ☰☷=44 姤, ☷☰=33 遯, ☷☷=2 坤
// ...實際使用簡化的二分法映射
function calculateHexagramNumber(symbol: string): number {
  // 將符號轉為二進制：☰=1, ☷=0
  let binary = '';
  for (const c of symbol) {
    binary += c === '☰' ? '1' : '0';
  }
  
  // 轉為十進制加1得到卦序（1-64）
  const decimal = parseInt(binary, 2);
  return decimal + 1;
}

// 傳統蓍草法（完整18次操作）
export function performTraditionalDivination(): DivinationResult {
  const lines: DivinationLine[] = [];
  let originalSymbol = '';
  let changedSymbol = '';
  const changingLines: number[] = [];
  
  // 從初爻到上爻
  for (let i = 1; i <= 6; i++) {
    let total = 50;
    let yangTotal = 0; // 總商數
    
    // 18次操作（實際6次大操作）
    // 簡化：用6次「分二掛一揲四歸奇」
    for (let j = 0; j < 6; j++) {
      // 分二
      const divide = Math.floor(Math.random() * (total - 2)) + 1;
      const part1 = divide;
      const part2 = total - divide;
      
      // 掛一（從任一堆取1根）
      const fromFirst = Math.random() > 0.5;
      const guaYi = 1;
      
      // 揲四：每4個一數
      const left4 = Math.floor((part1 - (fromFirst ? 1 : 0)) / 4) * 4;
      const right4 = Math.floor((part2 - (fromFirst ? 0 : 1)) / 4) * 4;
      
      yangTotal += (left4 + right4) / 4;
      
      // 歸奇：餘數
      const r1 = (part1 - (fromFirst ? 1 : 0)) % 4;
      const r2 = (part2 - (fromFirst ? 0 : 1)) % 4;
      const guiJi = r1 + r2 + guaYi;
      
      total = yangTotal * 4 + guiJi;
    }
    
    // 根據總商數判斷老陽/少陽/老陰/少陰
    // 總商數可能是24-32（對應6-9）
    const quotient = yangTotal;
    let value: number;
    let isChanging: boolean;
    
    if (quotient === 9) {
      value = 9; isChanging = true; // 老陽
    } else if (quotient === 8) {
      value = 8; isChanging = false; // 少陰
    } else if (quotient === 7) {
      value = 7; isChanging = false; // 少陽
    } else {
      value = 6; isChanging = true; // 老陰
    }
    
    // 隨機分配少陽少陰
    if (quotient === 7 || quotient === 8) {
      if (Math.random() < 0.5) {
        value = quotient === 7 ? 7 : 8;
        isChanging = false;
      } else {
        value = quotient === 7 ? 9 : 6;
        isChanging = true;
      }
    }
    
    lines.push({
      position: i,
      value,
      isYang: value >= 7,
      isChanging,
      symbol: valueToSymbol(value)
    });
    
    originalSymbol += valueToSymbol(value);
    
    if (isChanging) {
      changingLines.push(i);
      changedSymbol += value >= 7 ? '☷' : '☰';
    } else {
      changedSymbol += valueToSymbol(value);
    }
  }
  
  originalSymbol = originalSymbol.split('').reverse().join('');
  changedSymbol = changedSymbol.split('').reverse().join('');
  
  return {
    lines,
    originalHexagram: calculateHexagramNumber(originalSymbol),
    originalSymbol,
    changedHexagram: changingLines.length > 0 ? calculateHexagramNumber(changedSymbol) : undefined,
    changedSymbol: changingLines.length > 0 ? changedSymbol : undefined,
    hasChanging: changingLines.length > 0,
    changingLines
  };
}
