import { describe, it, expect } from 'vitest';
import { decodeResult, buildResultData, buildOgTitle } from './shared';

describe('shared decode', () => {
  describe('decodeResult', () => {
    it('should return null for invalid base64', () => {
      expect(decodeResult('not-valid-base64!!!')).toBeNull();
    });

    it('should return null for invalid hexagram id', () => {
      // Valid base64, invalid hexagram id
      const bad = Buffer.from(JSON.stringify({ h: 0, l: '000000', ls: '000000' })).toString('base64');
      expect(decodeResult(bad)).toBeNull();

      const bad2 = Buffer.from(JSON.stringify({ h: 65, l: '000000', ls: '000000' })).toString('base64');
      expect(decodeResult(bad2)).toBeNull();
    });

    it('should decode valid result', () => {
      const data = { h: 1, c: 2, l: '001000', ls: '111111', q: '事業' };
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const result = decodeResult(encoded);
      expect(result).not.toBeNull();
      expect(result!.hexagramId).toBe(1);
      expect(result!.changedId).toBe(2);
      expect(result!.changingLines).toContain(3); // position 3 is '1' in '001000'
      expect(result!.lineSymbols).toEqual(['☰', '☰', '☰', '☰', '☰', '☰']);
      expect(result!.questionType).toBe('事業');
    });

    it('should handle no changed hexagram', () => {
      const data = { h: 1, c: 0, l: '000000', ls: '101010' };
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
      const result = decodeResult(encoded);
      expect(result).not.toBeNull();
      expect(result!.changedId).toBeUndefined();
      expect(result!.changingLines).toHaveLength(0);
    });

    it('should handle URL-safe base64 padding', () => {
      // Test with various padding scenarios
      const data = { h: 10, l: '111111', ls: '111111' };
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
      const result = decodeResult(encoded);
      expect(result).not.toBeNull();
      expect(result!.hexagramId).toBe(10);
    });

    it('should parse all 6 line positions', () => {
      const data = { h: 1, l: '101010', ls: '101010' };
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
      const result = decodeResult(encoded);
      expect(result!.changingLines).toEqual([1, 3, 5]);
    });
  });

  describe('buildOgTitle', () => {
    it('should include hexagram name', () => {
      expect(buildOgTitle('乾')).toBe('易經占卜：乾卦');
    });

    it('should include changed hexagram when present', () => {
      expect(buildOgTitle('乾', '坤')).toBe('易經占卜：乾卦→坤卦');
    });
  });

  describe('buildResultData', () => {
    it('should return null for unknown hexagram', () => {
      // h:999 is out of range, decodeResult returns null
      const bad = Buffer.from(JSON.stringify({ h: 999, l: '000000', ls: '000000' })).toString('base64');
      expect(decodeResult(bad)).toBeNull();
    });

    it('should return full data for valid hexagram', () => {
      const data = { h: 1, c: 0, l: '001000', ls: '111111' };
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
      const decoded = decodeResult(encoded);
      const result = buildResultData(decoded!);
      expect(result).not.toBeNull();
      expect(result!.hexagramName).toBe('乾');
      expect(result!.changingLinesCount).toBe(1);
      expect(result!.fortuneRating).toBeTruthy();
      expect(result!.judgment).toBeTruthy();
    });
  });
});
