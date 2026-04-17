import { describe, it, expect } from 'vitest';
import { generateStats, generateEmptyStats } from './analytics-stats';

describe('analytics stats', () => {
  describe('generateEmptyStats', () => {
    it('should return all zero counts', () => {
      const stats = generateEmptyStats();
      expect(stats.totalDivinations).toBe(0);
      expect(stats.changedHexagramRatio).toBe(0);
      expect(stats.avgChangingLines).toBe('0.00');
      expect(Object.keys(stats.hexagramCounts)).toHaveLength(0);
    });
  });

  describe('generateStats', () => {
    it('should count hexagrams correctly', () => {
      const events = [
        { event: 'divination_complete', hexagramId: 1, hasChangedHexagram: false, changingLinesCount: 0 },
        { event: 'divination_complete', hexagramId: 1, hasChangedHexagram: true, changingLinesCount: 2 },
        { event: 'divination_complete', hexagramId: 2, hasChangedHexagram: false, changingLinesCount: 0 },
      ];
      const stats = generateStats(events as any);
      expect(stats.totalDivinations).toBe(3);
      expect(stats.hexagramCounts[1]).toBe(2);
      expect(stats.hexagramCounts[2]).toBe(1);
    });

    it('should calculate changedHexagramRatio', () => {
      const events = [
        { event: 'divination_complete', hexagramId: 1, hasChangedHexagram: true, changingLinesCount: 1 },
        { event: 'divination_complete', hexagramId: 2, hasChangedHexagram: false, changingLinesCount: 0 },
        { event: 'divination_complete', hexagramId: 3, hasChangedHexagram: true, changingLinesCount: 2 },
        { event: 'divination_complete', hexagramId: 4, hasChangedHexagram: false, changingLinesCount: 0 },
      ];
      const stats = generateStats(events as any);
      expect(stats.changedHexagramRatio).toBe(50);
    });

    it('should calculate avgChangingLines', () => {
      const events = [
        { event: 'divination_complete', hexagramId: 1, hasChangedHexagram: true, changingLinesCount: 2 },
        { event: 'divination_complete', hexagramId: 2, hasChangedHexagram: true, changingLinesCount: 4 },
        { event: 'divination_complete', hexagramId: 3, hasChangedHexagram: false, changingLinesCount: 0 },
      ];
      const stats = generateStats(events as any);
      expect(stats.avgChangingLines).toBe('2.00');
    });

    it('should count question types', () => {
      const events = [
        { event: 'divination_complete', hexagramId: 1, questionType: '事業', hasChangedHexagram: false, changingLinesCount: 0 },
        { event: 'divination_complete', hexagramId: 2, questionType: '事業', hasChangedHexagram: false, changingLinesCount: 0 },
        { event: 'divination_complete', hexagramId: 3, questionType: '感情', hasChangedHexagram: false, changingLinesCount: 0 },
      ];
      const stats = generateStats(events as any);
      expect(stats.questionTypeCounts['事業']).toBe(2);
      expect(stats.questionTypeCounts['感情']).toBe(1);
    });

    it('should get top hexagrams', () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        event: 'divination_complete',
        hexagramId: (i % 3) + 1,
        hasChangedHexagram: false,
        changingLinesCount: 0,
      }));
      const stats = generateStats(events as any);
      expect(stats.topHexagrams).toHaveLength(3);
      expect(stats.topHexagrams[0].count).toBeGreaterThanOrEqual(stats.topHexagrams[1].count);
    });

    it('should count extended dimensions', () => {
      const events = [
        { event: 'divination_complete', hexagramId: 1, questionType: '事業', hasChangedHexagram: true, changingLinesCount: 2, gender: '男', timeBucket: 'morning', dayOfWeek: 'Mon', deviceType: 'mobile', birthYear: 1990, questionLength: 20 },
        { event: 'divination_complete', hexagramId: 2, questionType: '感情', hasChangedHexagram: false, changingLinesCount: 0, gender: '女', timeBucket: 'night', dayOfWeek: 'Fri', deviceType: 'desktop', birthYear: 1985, questionLength: 15 },
      ];
      const stats = generateStats(events as any);
      expect(stats.genderCounts['男']).toBe(1);
      expect(stats.genderCounts['女']).toBe(1);
      expect(stats.timeBucketCounts['morning']).toBe(1);
      expect(stats.timeBucketCounts['night']).toBe(1);
      expect(stats.dayOfWeekCounts['Mon']).toBe(1);
      expect(stats.dayOfWeekCounts['Fri']).toBe(1);
      expect(stats.deviceTypeCounts['mobile']).toBe(1);
      expect(stats.deviceTypeCounts['desktop']).toBe(1);
      expect(stats.avgQuestionLength).toBe(17.5);
    });

    it('should return empty stats for no divination events', () => {
      const events = [{ event: 'page_view', path: '/' }];
      const stats = generateStats(events as any);
      expect(stats.totalDivinations).toBe(0);
      expect(Object.keys(stats.hexagramCounts)).toHaveLength(0);
    });
  });
});
