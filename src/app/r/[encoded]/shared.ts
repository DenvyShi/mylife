import { hexagrams } from '@/data/hexagrams';
import { assessFortune } from '@/lib/interpretation';

export interface DecodedResult {
  hexagramId: number;
  changedId?: number;
  changingLines: number[];
  lineSymbols: string[]; // ☰ = yang, ☷ = yin
  questionType?: string;
}

export interface SharedResultData {
  hexagramId: number;
  hexagramName: string;
  changedHexagramName?: string;
  changingLinesCount: number;
  questionType?: string;
  fortuneRating: string;
  fortuneSummary: string;
  judgment: string;
  judgmentTitle: string;
  image: string;
  guaMeaning: string;
}

/**
 * Decode URL-safe base64 string to result data.
 * Used by both the page (client) and for metadata generation (server).
 */
export function decodeResult(encoded: string): DecodedResult | null {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad > 0) base64 += '='.repeat(4 - pad);

    const data = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    if (!data.h || data.h < 1 || data.h > 64) return null;

    // Parse changing lines binary string (positions 1-6)
    const changingLines: number[] = [];
    const lineStr = String(data.l || '000000');
    for (let i = 0; i < 6; i++) {
      if (lineStr[i] === '1') changingLines.push(i + 1);
    }

    // Parse line symbols: 1=yang(☰), 0=yin(☷)
    const lineSymbols: string[] = [];
    const symbolStr = String(data.ls || '000000');
    for (let i = 0; i < 6; i++) {
      lineSymbols.push(symbolStr[i] === '1' ? '☰' : '☷');
    }

    return {
      hexagramId: data.h,
      changedId: data.c && data.c > 0 ? data.c : undefined,
      changingLines,
      lineSymbols,
      questionType: data.q,
    };
  } catch {
    return null;
  }
}

export function buildResultData(decoded: DecodedResult): SharedResultData | null {
  const hexagram = hexagrams.find(x => x.id === decoded.hexagramId);
  if (!hexagram) return null;

  const changedHexagram = decoded.changedId
    ? hexagrams.find(x => x.id === decoded.changedId)
    : null;

  const fortune = assessFortune(decoded.hexagramId, decoded.changingLines.length);

  return {
    hexagramId: decoded.hexagramId,
    hexagramName: hexagram.name,
    changedHexagramName: changedHexagram?.name,
    changingLinesCount: decoded.changingLines.length,
    questionType: decoded.questionType,
    fortuneRating: fortune.rating,
    fortuneSummary: fortune.summary,
    judgment: hexagram.judgment,
    judgmentTitle: hexagram.judgmentTitle,
    image: hexagram.image,
    guaMeaning: hexagram.guaMeaning,
  };
}

export function buildOgTitle(hexagramName: string, changedName?: string): string {
  if (changedName) return `易經占卜：${hexagramName}卦→${changedName}卦`;
  return `易經占卜：${hexagramName}卦`;
}
