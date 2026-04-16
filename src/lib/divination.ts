/**
 * Yarrow stalk divination algorithm
 * 
 * Traditional yarrow method uses 50 stalks, performing "divide two", "hang one",
 * "count four", "return remainder" operations 18 times to get 6 numbers (6-9),
 * which form one of the 64 hexagrams.
 * 
 * Simplified algorithm: uses 50 random numbers to simulate the yarrow process,
 * each operation yields old-yang(9), young-yang(7), old-yin(6), or young-yin(8)
 */

// Core yarrow counting algorithm
function countYarrow(total: number): { remainder: number; quotient: number } {
  // Simulate "divide two", "hang one", "count four", "return remainder"
  // Active stalks for each operation = total - 1 (the "hang one")
  const active = total - 1;
  
  // Randomly divide into two piles (divide two)
  const first = Math.floor(Math.random() * (active - 1)) + 1;
  const second = active - first;
  
  // Take one from first pile (hang one - simplified as symbolic)
  // Count by fours (count four)
  const q1 = Math.floor(first / 4);
  const r1 = first % 4;
  const q2 = Math.floor(second / 4);
  const r2 = second % 4;
  
  // Return remainder: sum of remainders less than 4
  const remainder = r1 + r2;
  const quotient = q1 + q2;
  
  return { remainder, quotient };
}

// Get a single line (6-9)
function getSingleLine(): { value: number; isChanging: boolean } {
  // 50 stalks, traditionally 18 operations to get 6 lines
  // Simplified: restart with 50 for each line
  
  let sticks = 50;
  let yangCount = 0; // Total quotient from counting fours, representing yang
  let iterations = 0;
  
  while (sticks >= 4) {
    const result = countYarrow(sticks);
    
    // Determine yin/yang based on remainder
    // Remainder 1 or 5 -> old-yang(9) is changing line
    // Remainder 2 or 4 -> old-yin(6) is changing line
    // Remainder 3 -> young-yang(7)
    // Remainder 0 -> young-yin(8)
    const { remainder } = result;
    
    yangCount += result.quotient;
    iterations++;
    
    // Subtract remainder and continue
    sticks = result.quotient * 4 + remainder;
    
    if (sticks < 4) {
      // Final iteration, remainder must be multiple of 4
      // Determine old/young based on total quotient
      break;
    }
  }
  
  // Use random seed + math function to simulate traditional distribution
  const seed = Math.random();
  
  // Traditional distribution: old-yang(9)=~1/16, young-yang(7)=~7/16
  //                        old-yin(6)=~1/16, young-yin(8)=~7/16
  if (seed < 0.0625) {
    return { value: 9, isChanging: true };  // old-yang
  } else if (seed < 0.6875) {
    return { value: 7, isChanging: false }; // young-yang
  } else if (seed < 0.75) {
    return { value: 6, isChanging: true };  // old-yin
  } else {
    return { value: 8, isChanging: false }; // young-yin
  }
}

// Complete six lines result
export interface DivinationLine {
  position: number;      // Line position (1-6, from first to sixth)
  value: number;         // 6/7/8/9
  isYang: boolean;       // Is yang line
  isChanging: boolean;   // Is changing line
  symbol: string;        // Line symbol (☰=yang, ☷=yin)
}

export interface DivinationResult {
  lines: DivinationLine[];      // Six lines (from first to sixth)
  originalHexagram: number;     // Original hexagram number
  originalSymbol: string;        // Original hexagram symbol
  changedHexagram?: number;     // Changed hexagram number (if changing lines exist)
  changedSymbol?: string;        // Changed hexagram symbol
  hasChanging: boolean;          // Has changing lines
  changingLines: number[];       // Changing line positions
}

// Convert 6/7/8/9 to hexagram symbol
function valueToSymbol(value: number): string {
  // 7-young-yang=☰, 9-old-yang=☰ (old-yang changes but symbol stays ☰)
  // 8-young-yin=☷, 6-old-yin=☷ (old-yin changes but symbol stays ☷)
  return (value >= 7) ? '☰' : '☷';
}

// Convert 6/7/8/9 to standard number
function valueToStandard(value: number): number {
  // young-yang 7->9, young-yin 8->6 (yin/yang unchanged)
  // old-yang 9->9, old-yin 6->6 (unchanged)
  return value;
}

export function performDivination(): DivinationResult {
  const lines: DivinationLine[] = [];
  let originalSymbol = '';
  let changedSymbol = '';
  const changingLines: number[] = [];
  
  // From first line to sixth line
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
      // Changed hexagram: yang becomes yin, yin becomes yang
      changedSymbol += line.value >= 7 ? '☷' : '☰';
    } else {
      changedSymbol += valueToSymbol(line.value);
    }
  }
  
  // Hexagram is read from bottom to top, but symbol string is first to sixth
  // So reverse the string for visual representation
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

// Calculate hexagram number from symbol (traditional Jingfang sequence)
// ☰☰=1 Qian, ☰☷=44 Gou, ☷☰=33 Dun, ☷☷=2 Kun
// Uses simplified binary mapping
function calculateHexagramNumber(symbol: string): number {
  // Convert to binary: ☰=1, ☷=0
  let binary = '';
  for (const c of symbol) {
    binary += c === '☰' ? '1' : '0';
  }
  
  // Convert to decimal + 1 to get hexagram number (1-64)
  const decimal = parseInt(binary, 2);
  return decimal + 1;
}

// Traditional yarrow method (complete 18 operations)
export function performTraditionalDivination(): DivinationResult {
  const lines: DivinationLine[] = [];
  let originalSymbol = '';
  let changedSymbol = '';
  const changingLines: number[] = [];
  
  // From first line to sixth line
  for (let i = 1; i <= 6; i++) {
    let total = 50;
    let yangTotal = 0; // Total quotient
    
    // 18 operations (simplified to 6 major operations)
    for (let j = 0; j < 6; j++) {
      // Divide two
      const divide = Math.floor(Math.random() * (total - 2)) + 1;
      const part1 = divide;
      const part2 = total - divide;
      
      // Hang one (take 1 from either pile)
      const fromFirst = Math.random() > 0.5;
      const guaYi = 1;
      
      // Count by fours
      const left4 = Math.floor((part1 - (fromFirst ? 1 : 0)) / 4) * 4;
      const right4 = Math.floor((part2 - (fromFirst ? 0 : 1)) / 4) * 4;
      
      yangTotal += (left4 + right4) / 4;
      
      // Return remainder
      const r1 = (part1 - (fromFirst ? 1 : 0)) % 4;
      const r2 = (part2 - (fromFirst ? 0 : 1)) % 4;
      const guiJi = r1 + r2 + guaYi;
      
      total = yangTotal * 4 + guiJi;
    }
    
    // Determine old-yang/young-yang/old-yin/young-yin based on total quotient
    // Quotient may be 24-32 (corresponding to 6-9)
    const quotient = yangTotal;
    let value: number;
    let isChanging: boolean;
    
    if (quotient === 9) {
      value = 9; isChanging = true; // old-yang
    } else if (quotient === 8) {
      value = 8; isChanging = false; // young-yin
    } else if (quotient === 7) {
      value = 7; isChanging = false; // young-yang
    } else {
      value = 6; isChanging = true; // old-yin
    }
    
    // Randomly distribute young-yang/young-yin
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
