import { describe, it, expect } from 'vitest';
import { assessFortune, interpretJudgment, interpretImage, computeWuxing, getLineLabel, TRIGRAM_WUXING } from './interpretation';
import { hexagrams } from '../data/hexagrams';

describe('interpretation', () => {
  describe('assessFortune', () => {
    it('should return a fortune object with required fields', () => {
      const fortune = assessFortune(1, 0);
      expect(fortune).toHaveProperty('rating');
      expect(fortune).toHaveProperty('summary');
      expect(fortune).toHaveProperty('advice');
      expect(fortune).toHaveProperty('color');
      expect(fortune).toHaveProperty('emoji');
    });

    it('should return different fortunes for different hexagram ids', () => {
      const f1 = assessFortune(1, 0);
      const f2 = assessFortune(2, 0);
      expect(f1.rating).not.toBe(f2.rating);
    });

    it('should handle 0 changing lines', () => {
      const fortune = assessFortune(1, 0);
      expect(fortune.rating).toBeTruthy();
    });

    it('should handle 6 changing lines', () => {
      const fortune = assessFortune(1, 6);
      expect(fortune.rating).toBeTruthy();
    });

    it('should handle various hexagram ids', () => {
      for (let id = 1; id <= 64; id++) {
        const fortune = assessFortune(id, 0);
        expect(fortune.rating).toBeTruthy();
      }
    });
  });

  describe('interpretJudgment', () => {
    it('should return a string', () => {
      const result = interpretJudgment('元亨利貞');
      expect(typeof result).toBe('string');
    });

    it('should return non-empty string for common judgments', () => {
      const judgments = ['元亨利貞', '坤，元亨利牝馬之貞', '屯，經歷艱險而後通', '蒙，亨'];
      judgments.forEach(j => {
        const result = interpretJudgment(j);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty string', () => {
      const result = interpretJudgment('');
      expect(typeof result).toBe('string');
    });

    it('should return string for all 64 hexagrams', () => {
      hexagrams.forEach(h => {
        const result = interpretJudgment(h.judgment);
        expect(typeof result).toBe('string');
      });
    });

    it('should handle short judgments', () => {
      // Edge case: very short strings
      expect(interpretJudgment('亨')).toBeTruthy();
    });
  });

  describe('interpretImage', () => {
    it('should return a string', () => {
      const result = interpretImage('天行健，君子以自強不息');
      expect(typeof result).toBe('string');
    });

    it('should return non-empty string for common images', () => {
      const images = ['天行健，君子以自強不息', '地勢坤，君子以厚德載物'];
      images.forEach(img => {
        const result = interpretImage(img);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty string', () => {
      const result = interpretImage('');
      expect(typeof result).toBe('string');
    });

    it('should handle short image strings', () => {
      expect(interpretImage('天')).toBeTruthy();
    });
  });

  describe('computeWuxing', () => {
    it('should return an object with all five elements', () => {
      const result = computeWuxing('乾', '坤');
      ['金', '木', '水', '火', '土'].forEach(el => {
        expect(result).toHaveProperty(el);
        expect(typeof result[el]).toBe('number');
      });
    });

    it('should return 0 for undefined trigrams', () => {
      const result = computeWuxing('未知', '未知');
      expect(result['金']).toBe(0);
      expect(result['木']).toBe(0);
    });

    it('should be balanced around zero', () => {
      const result = computeWuxing('乾', '坤'); // 金 + 土
      const sum = Object.values(result).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(-2);
      expect(sum).toBeLessThanOrEqual(2);
    });

    it('should handle all 8 trigrams', () => {
      const trigrams = ['乾', '坤', '震', '巽', '坎', '離', '艮', '兌'];
      trigrams.forEach(t => {
        const result = computeWuxing(t, t);
        expect(result[TRIGRAM_WUXING[t] || '土']).toBeGreaterThan(0);
      });
    });

    it('should give correct values for known trigrams', () => {
      const result = computeWuxing('乾', '兌'); // 乾金 + 兌金
      expect(result['金']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getLineLabel', () => {
    it('should return 初爻 for position 1', () => {
      expect(getLineLabel(1)).toBe('初爻');
    });

    it('should return 上爻 for position 6', () => {
      expect(getLineLabel(6)).toBe('上爻');
    });

    it('should return correct labels for positions 2-5', () => {
      expect(getLineLabel(2)).toBe('六二爻');
      expect(getLineLabel(3)).toBe('六三爻');
      expect(getLineLabel(4)).toBe('六四爻');
      expect(getLineLabel(5)).toBe('六五爻');
    });
  });

  describe('TRIGRAM_WUXING', () => {
    it('should have all 8 trigrams', () => {
      const trigrams = ['乾', '兌', '離', '震', '巽', '坎', '艮', '坤'];
      trigrams.forEach(t => {
        expect(TRIGRAM_WUXING).toHaveProperty(t);
      });
    });

    it('should have correct element mappings', () => {
      expect(TRIGRAM_WUXING['乾']).toBe('金');
      expect(TRIGRAM_WUXING['兌']).toBe('金');
      expect(TRIGRAM_WUXING['坤']).toBe('土');
      expect(TRIGRAM_WUXING['艮']).toBe('土');
      expect(TRIGRAM_WUXING['震']).toBe('木');
      expect(TRIGRAM_WUXING['巽']).toBe('木');
      expect(TRIGRAM_WUXING['離']).toBe('火');
      expect(TRIGRAM_WUXING['坎']).toBe('水');
    });
  });
});
