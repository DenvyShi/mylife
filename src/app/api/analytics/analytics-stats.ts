// Shared stats generation logic — used by the API route and can be unit tested

export interface AnalyticsEvent {
  timestamp: string;
  event: string;
  hexagramId?: number;
  hexagramName?: string;
  questionType?: string;
  hasChangedHexagram?: boolean;
  changingLinesCount?: number;
  shareUrl?: string;
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: string;
  questionLength?: number;
  timeBucket?: string;
  dayOfWeek?: string;
  deviceType?: string;
  path?: string;
  referrer?: string;
}

export interface Stats {
  totalDivinations: number;
  hexagramCounts: Record<number, number>;
  questionTypeCounts: Record<string, number>;
  changedHexagramRatio: number;
  avgChangingLines: string;
  recentDivinations: Array<{
    timestamp: string;
    hexagramName?: string;
    questionType?: string;
    hexagramId?: number;
  }>;
  topHexagrams: Array<{ id: number; count: number }>;
  periodStart: string | null;
  periodEnd: string | null;
  genderCounts: Record<string, number>;
  timeBucketCounts: Record<string, number>;
  dayOfWeekCounts: Record<string, number>;
  deviceTypeCounts: Record<string, number>;
  avgQuestionLength: number;
  topBirthYears: Array<{ decade: string; count: number }>;
}

export function generateEmptyStats(): Stats {
  return {
    totalDivinations: 0,
    hexagramCounts: {},
    questionTypeCounts: {},
    changedHexagramRatio: 0,
    avgChangingLines: '0.00',
    recentDivinations: [],
    topHexagrams: [],
    periodStart: null,
    periodEnd: null,
    genderCounts: {},
    timeBucketCounts: {},
    dayOfWeekCounts: {},
    deviceTypeCounts: {},
    avgQuestionLength: 0,
    topBirthYears: [],
  };
}

export function generateStats(events: AnalyticsEvent[]): Stats {
  const divinationEvents = events.filter(e => e.event === 'divination_complete') as AnalyticsEvent[];

  const hexagramCounts: Record<number, number> = {};
  const questionTypeCounts: Record<string, number> = {};
  const genderCounts: Record<string, number> = {};
  const timeBucketCounts: Record<string, number> = {};
  const dayOfWeekCounts: Record<string, number> = {};
  const deviceTypeCounts: Record<string, number> = {};
  const birthYears: number[] = [];
  let totalChangingLines = 0;
  let changedCount = 0;
  let totalQuestionLength = 0;

  divinationEvents.forEach(e => {
    if (e.hexagramId) {
      hexagramCounts[e.hexagramId] = (hexagramCounts[e.hexagramId] || 0) + 1;
    }
    if (e.questionType) {
      questionTypeCounts[e.questionType] = (questionTypeCounts[e.questionType] || 0) + 1;
    }
    if (e.gender) {
      genderCounts[e.gender] = (genderCounts[e.gender] || 0) + 1;
    }
    if (e.timeBucket) {
      timeBucketCounts[e.timeBucket] = (timeBucketCounts[e.timeBucket] || 0) + 1;
    }
    if (e.dayOfWeek) {
      dayOfWeekCounts[e.dayOfWeek] = (dayOfWeekCounts[e.dayOfWeek] || 0) + 1;
    }
    if (e.deviceType) {
      deviceTypeCounts[e.deviceType] = (deviceTypeCounts[e.deviceType] || 0) + 1;
    }
    if (e.birthYear) {
      birthYears.push(e.birthYear);
    }
    if (e.changingLinesCount !== undefined) {
      totalChangingLines += e.changingLinesCount;
    }
    if (e.hasChangedHexagram) {
      changedCount++;
    }
    if (e.questionLength && e.questionLength > 0) {
      totalQuestionLength += e.questionLength;
    }
  });

  const total = divinationEvents.length;
  const topHexagrams = Object.entries(hexagramCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ id: Number(id), count }));

  const recentDivinations = divinationEvents
    .slice(-10)
    .reverse()
    .map(e => ({
      timestamp: e.timestamp,
      hexagramName: e.hexagramName,
      questionType: e.questionType,
      hexagramId: e.hexagramId,
    }));

  // Birth year distribution (decades)
  const birthYearCounts: Record<string, number> = {};
  birthYears.forEach(y => {
    const decade = `${Math.floor(y / 10) * 10}s`;
    birthYearCounts[decade] = (birthYearCounts[decade] || 0) + 1;
  });
  const topBirthYears = Object.entries(birthYearCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([decade, count]) => ({ decade, count }));

  const periodStart = events.length > 0 ? events[0].timestamp : null;
  const periodEnd = events.length > 0 ? events[events.length - 1].timestamp : null;

  return {
    totalDivinations: total,
    hexagramCounts,
    questionTypeCounts,
    changedHexagramRatio: total > 0 ? Math.round((changedCount / total) * 100) : 0,
    avgChangingLines: total > 0 ? (totalChangingLines / total).toFixed(2) : '0.00',
    recentDivinations,
    topHexagrams,
    periodStart,
    periodEnd,
    genderCounts,
    timeBucketCounts,
    dayOfWeekCounts,
    deviceTypeCounts,
    avgQuestionLength: total > 0 ? Math.round(totalQuestionLength / total * 10) / 10 : 0,
    topBirthYears,
  };
}
