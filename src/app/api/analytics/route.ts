import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '..', 'analytics-data');
const LOG_FILE = join(DATA_DIR, 'divination-log.jsonl');

interface AnalyticsEvent {
  timestamp: string;
  event: string;
  hexagramId?: number;
  hexagramName?: string;
  questionType?: string;
  hasChangedHexagram?: boolean;
  changingLinesCount?: number;
  userBirthYear?: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.event) {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    // Only allow specific event types
    const allowedEvents = ['divination_complete', 'page_view', 'app_start'];
    if (!allowedEvents.includes(body.event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Sanitize and structure the data
    const event: AnalyticsEvent = {
      timestamp: new Date().toISOString(),
      event: body.event,
    };

    // Only record hexagram-related data, no personal info
    if (body.event === 'divination_complete') {
      event.hexagramId = typeof body.hexagramId === 'number' ? body.hexagramId : undefined;
      event.hexagramName = typeof body.hexagramName === 'string' ? body.hexagramName.slice(0, 10) : undefined;
      event.questionType = typeof body.questionType === 'string' ? body.questionType.slice(0, 20) : undefined;
      event.hasChangedHexagram = typeof body.hasChangedHexagram === 'boolean' ? body.hasChangedHexagram : undefined;
      event.changingLinesCount = typeof body.changingLinesCount === 'number' ? body.changingLinesCount : undefined;
    }

    ensureDataDir();

    // Append to JSONL file (one JSON object per line)
    appendFileSync(LOG_FILE, JSON.stringify(event) + '\n');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureDataDir();

    // Read and parse log file
    if (!existsSync(LOG_FILE)) {
      return NextResponse.json({ stats: generateEmptyStats() });
    }

    const content = readFileSync(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map(line => JSON.parse(line)).filter(Boolean);

    const stats = generateStats(events);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics read error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function generateEmptyStats() {
  return {
    totalDivinations: 0,
    hexagramCounts: {},
    questionTypeCounts: {},
    changedHexagramRatio: 0,
    avgChangingLines: 0,
    recentDivinations: [],
    topHexagrams: [],
    periodStart: null,
    periodEnd: null,
  };
}

function generateStats(events: AnalyticsEvent[]) {
  const divinationEvents = events.filter(e => e.event === 'divination_complete');
  
  // Count hexagrams
  const hexagramCounts: Record<number, number> = {};
  const questionTypeCounts: Record<string, number> = {};
  let totalChangingLines = 0;
  let changedCount = 0;

  divinationEvents.forEach(e => {
    if (e.hexagramId) {
      hexagramCounts[e.hexagramId] = (hexagramCounts[e.hexagramId] || 0) + 1;
    }
    if (e.questionType) {
      questionTypeCounts[e.questionType] = (questionTypeCounts[e.questionType] || 0) + 1;
    }
    if (e.changingLinesCount !== undefined) {
      totalChangingLines += e.changingLinesCount;
    }
    if (e.hasChangedHexagram) {
      changedCount++;
    }
  });

  // Top hexagrams
  const topHexagrams = Object.entries(hexagramCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ id: Number(id), count }));

  // Recent divinations (last 10)
  const recentDivinations = divinationEvents
    .slice(-10)
    .reverse()
    .map(e => ({
      timestamp: e.timestamp,
      hexagramName: e.hexagramName,
      questionType: e.questionType,
    }));

  const periodStart = events.length > 0 ? events[0].timestamp : null;
  const periodEnd = events.length > 0 ? events[events.length - 1].timestamp : null;

  return {
    totalDivinations: divinationEvents.length,
    hexagramCounts,
    questionTypeCounts,
    changedHexagramRatio: divinationEvents.length > 0 
      ? Math.round((changedCount / divinationEvents.length) * 100) 
      : 0,
    avgChangingLines: divinationEvents.length > 0 
      ? (totalChangingLines / divinationEvents.length).toFixed(2) 
      : 0,
    recentDivinations,
    topHexagrams,
    periodStart,
    periodEnd,
  };
}
