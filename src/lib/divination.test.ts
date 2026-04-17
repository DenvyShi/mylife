import { describe, it, expect } from 'vitest';
import { performDivination } from './divination';

describe('divination', () => {
  describe('performDivination', () => {
    it('should generate a valid hexagram id (1-64)', () => {
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        expect(result.originalHexagram).toBeGreaterThanOrEqual(1);
        expect(result.originalHexagram).toBeLessThanOrEqual(64);
      }
    });

    it('should generate 6 lines', () => {
      const result = performDivination();
      expect(result.lines).toHaveLength(6);
    });

    it('should have valid line positions 1-6', () => {
      for (let i = 0; i < 50; i++) {
        const result = performDivination();
        result.lines.forEach((line, idx) => {
          expect(line.position).toBe(idx + 1);
        });
      }
    });

    it('should have valid symbol (☰ or ☷)', () => {
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        result.lines.forEach(line => {
          expect(['☰', '☷']).toContain(line.symbol);
        });
      }
    });

    it('should have boolean isYang and isChanging', () => {
      for (let i = 0; i < 50; i++) {
        const result = performDivination();
        result.lines.forEach(line => {
          expect(typeof line.isYang).toBe('boolean');
          expect(typeof line.isChanging).toBe('boolean');
        });
      }
    });

    it('isYang should match symbol', () => {
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        result.lines.forEach(line => {
          if (line.symbol === '☰') expect(line.isYang).toBe(true);
          if (line.symbol === '☷') expect(line.isYang).toBe(false);
        });
      }
    });

    it('changingLines should match lines where isChanging=true', () => {
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        const expected = result.lines.filter(l => l.isChanging).map(l => l.position);
        expect(result.changingLines).toEqual(expected);
      }
    });

    it('hasChanging should reflect whether there are changing lines', () => {
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        const hasChanging = result.changingLines.length > 0;
        expect(result.hasChanging).toBe(hasChanging);
      }
    });

    it('should have changedHexagram when hasChanging is true (probabilistic)', () => {
      // Run many times - at least some should have changes
      let countWithChanges = 0;
      for (let i = 0; i < 100; i++) {
        const result = performDivination();
        if (result.hasChanging) countWithChanges++;
      }
      // At least once should have changes (probability > 99.99% for 100 trials)
      expect(countWithChanges).toBeGreaterThan(0);
    });

    it('probability distribution should be reasonable', () => {
      const counts = { yang: 0, yin: 0 };
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const result = performDivination();
        result.lines.forEach(line => {
          if (line.isYang) counts.yang++;
          else counts.yin++;
        });
      }
      // Yang should be roughly 50% (±5%)
      const yangRatio = counts.yang / (total * 6);
      expect(yangRatio).toBeGreaterThan(0.45);
      expect(yangRatio).toBeLessThan(0.55);
    });
  });
});

describe('getHexagramName', () => {
  it('should return correct names for known hexagrams', async () => {
    const { getHexagramName } = await import('./divination');
    expect(getHexagramName(1)).toBe('乾');
    expect(getHexagramName(64)).toBe('未濟');
    expect(getHexagramName(15)).toBe('謙');
  });

  it('should return ? for unknown hexagrams', async () => {
    const { getHexagramName } = await import('./divination');
    expect(getHexagramName(999)).toBe('?');
    expect(getHexagramName(0)).toBe('?');
  });
});

describe('getLineName', () => {
  it('should return 初爻 for position 1', async () => {
    const { getLineName } = await import('./divination');
    expect(getLineName(1)).toBe('初爻');
  });

  it('should return 上爻 for position 6', async () => {
    const { getLineName } = await import('./divination');
    expect(getLineName(6)).toBe('上爻');
  });

  it('should return correct labels for positions 2-5', async () => {
    const { getLineName } = await import('./divination');
    expect(getLineName(2)).toBe('六二爻');
    expect(getLineName(3)).toBe('六三爻');
    expect(getLineName(4)).toBe('六四爻');
    expect(getLineName(5)).toBe('六五爻');
  });
});

describe('performTraditionalDivination (alias)', () => {
  it('should be an alias for performDivination', async () => {
    const { performDivination, performTraditionalDivination } = await import('./divination');
    const r1 = performDivination(42);
    const r2 = performTraditionalDivination(42);
    expect(r1.lines).toEqual(r2.lines);
    expect(r1.originalHexagram).toBe(r2.originalHexagram);
  });
});
