import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { generateStats, generateEmptyStats, type AnalyticsEvent } from './analytics-stats';

const DATA_DIR = join(process.cwd(), '..', 'analytics-data');
const LOG_FILE = join(DATA_DIR, 'divination-log.jsonl');

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android(?!.*mobile)|windows phone/i.test(ua)) return 'mobile';
  if (ua.includes('Mozilla') || ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux')) return 'desktop';
  return 'unknown';
}

function getTimeBucket(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'afternoon';
  if (hour >= 14 && hour < 18) return 'evening';
  return 'night';
}

function getDayOfWeek(): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
}

function safeString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  return val.slice(0, maxLen);
}

function safeNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && isFinite(val)) return val;
  return undefined;
}

function safeBool(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') return val;
  return undefined;
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.event) {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    const allowedEvents = ['divination_complete', 'page_view', 'app_start'];
    if (!allowedEvents.includes(body.event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const ua = request.headers.get('user-agent') || '';
    const deviceType = detectDeviceType(ua);
    const now = new Date();
    const timeBucket = getTimeBucket(now.getHours());
    const dayOfWeek = getDayOfWeek();

    const base = {
      timestamp: now.toISOString(),
      event: body.event,
      deviceType,
      timeBucket,
      dayOfWeek,
    };

    if (body.event === 'divination_complete') {
      const hexagramId = safeNumber(body.hexagramId);
      if (!hexagramId || hexagramId < 1 || hexagramId > 64) {
        return NextResponse.json({ error: 'Invalid hexagramId' }, { status: 400 });
      }

      const event: AnalyticsEvent = {
        ...base,
        event: 'divination_complete',
        hexagramId,
        hexagramName: safeString(body.hexagramName, 10) || '',
        questionType: safeString(body.questionType, 20) || '',
        hasChangedHexagram: safeBool(body.hasChangedHexagram) ?? false,
        changingLinesCount: safeNumber(body.changingLinesCount) ?? 0,
        shareUrl: safeString(body.shareUrl, 200),
        gender: safeString(body.gender, 5),
        birthYear: safeNumber(body.birthYear),
        birthMonth: safeNumber(body.birthMonth),
        birthDay: safeNumber(body.birthDay),
        birthHour: safeString(body.birthHour, 5),
        questionLength: safeNumber(body.questionLength) ?? 0,
      };

      ensureDataDir();
      appendFileSync(LOG_FILE, JSON.stringify(event) + '\n');
      return NextResponse.json({ success: true });
    }

    if (body.event === 'page_view') {
      const event: AnalyticsEvent = {
        ...base,
        event: 'page_view',
        path: safeString(body.path, 100) || '/',
        referrer: safeString(body.referrer, 200),
      };
      ensureDataDir();
      appendFileSync(LOG_FILE, JSON.stringify(event) + '\n');
      return NextResponse.json({ success: true });
    }

    if (body.event === 'app_start') {
      const event: AnalyticsEvent = { ...base, event: 'app_start' };
      ensureDataDir();
      appendFileSync(LOG_FILE, JSON.stringify(event) + '\n');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unhandled event type' }, { status: 400 });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    ensureDataDir();

    const { searchParams } = new URL(request.url);
    const allRecords = searchParams.get('all') === 'true';

    if (!existsSync(LOG_FILE)) {
      return NextResponse.json({ stats: generateEmptyStats(), records: [] });
    }

    const content = readFileSync(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean) as AnalyticsEvent[];

    const stats = generateStats(events);

    if (allRecords) {
      const divinationEvents = events.filter(e => e.event === 'divination_complete');
      const records = divinationEvents
        .reverse()
        .map((e, idx) => ({
          id: idx + 1,
          timestamp: e.timestamp,
          hexagramId: e.hexagramId,
          hexagramName: e.hexagramName,
          questionType: e.questionType,
          hasChangedHexagram: e.hasChangedHexagram,
          changingLinesCount: e.changingLinesCount,
          shareUrl: e.shareUrl || null,
          gender: e.gender || null,
          birthYear: e.birthYear || null,
          timeBucket: e.timeBucket,
          dayOfWeek: e.dayOfWeek,
          deviceType: e.deviceType,
        }));
      return NextResponse.json({ stats, records });
    }

    return NextResponse.json({ stats, records: [] });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
