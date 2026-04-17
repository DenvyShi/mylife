import { NextRequest, NextResponse } from 'next/server';

/**
 * Share Image Generator — returns a downloadable SVG image.
 * GET /api/share-image?hex=乾&hexId=1&changed=坤&changedId=2&lines=001000&symbols=111000&rating=吉&score=85&judgment=元亨利貞
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hexName = searchParams.get('hex') || '?';
  const hexId = searchParams.get('hexId') || '';
  const changedName = searchParams.get('changed') || '';
  const changedId = searchParams.get('changedId') || '';
  const rating = searchParams.get('rating') || '─';
  const score = parseInt(searchParams.get('score') || '50', 10);
  const judgment = searchParams.get('judgment') || '';
  const image = searchParams.get('image') || '';
  const advice = searchParams.get('advice') || '';
  const symbols = searchParams.get('symbols') || '------';
  const changingLines = searchParams.get('lines') || '000000';
  const questionType = searchParams.get('questionType') || '';
  const question = searchParams.get('question') || '';
  const scoreLabel = searchParams.get('scoreLabel') || '';

  const scoreColor = score >= 75 ? '#22C55E' : score >= 55 ? '#F59E0B' : score >= 35 ? '#F97316' : '#EF4444';

  // Build hexagram lines SVG
  const lineHeight = 24;
  const lineGap = 8;
  const lines: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const isYin = symbols[i] === '0';
    const isChanging = changingLines[i] === '1';
    const y = 200 + (5 - i) * (lineHeight + lineGap);
    const lineWidth = 300;

    if (isChanging) {
      // Draw yin (broken) with changing indicator
      const color = '#A78BFA';
      lines.push(`<line x1="${600 - lineWidth/2}" y1="${y + lineHeight/2}" x2="${600 - lineWidth*0.35}" y2="${y + lineHeight/2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`);
      lines.push(`<line x1="${600 + lineWidth*0.35}" y1="${y + lineHeight/2}" x2="${600 + lineWidth/2}" y2="${y + lineHeight/2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`);
      lines.push(`<circle cx="${600}" cy="${y + lineHeight/2}" r="5" fill="${color}"/>`);
    } else if (isYin) {
      // Yin — broken line
      const color = '#F5E6D3';
      lines.push(`<line x1="${600 - lineWidth/2}" y1="${y + lineHeight/2}" x2="${600 - lineWidth*0.35}" y2="${y + lineHeight/2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`);
      lines.push(`<line x1="${600 + lineWidth*0.35}" y1="${y + lineHeight/2}" x2="${600 + lineWidth/2}" y2="${y + lineHeight/2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`);
    } else {
      // Yang — solid line
      const color = '#D4AF37';
      lines.push(`<line x1="${600 - lineWidth/2}" y1="${y + lineHeight/2}" x2="${600 + lineWidth/2}" y2="${y + lineHeight/2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`);
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0806"/>
      <stop offset="100%" stop-color="#1a0a0a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#8B6914"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="900" fill="url(#bg)"/>

  <!-- Stone frame border -->
  <rect x="16" y="16" width="1168" height="868" fill="none" stroke="#5c4a2a" stroke-width="2" rx="12"/>
  <rect x="20" y="20" width="1160" height="860" fill="none" stroke="#3d2e1a" stroke-width="1" rx="10"/>

  <!-- Corner ornaments -->
  ${[
    [40, 40], [1160, 40], [40, 860], [1160, 860]
  ].map(([x, y]) => `<rect x="${x-16}" y="${y-16}" width="8" height="8" fill="#8B6914" transform="rotate(45,${x},${y})"/>`).join('')}

  <!-- Header ornament line -->
  <line x1="200" y1="60" x2="1000" y2="60" stroke="#5c4a2a" stroke-width="1"/>
  <text x="600" y="58" text-anchor="middle" font-size="14" fill="#8B6914" letter-spacing="6">易經占卜 · mylife.first.pet</text>
  <line x1="200" y1="68" x2="1000" y2="68" stroke="#5c4a2a" stroke-width="1"/>

  <!-- Score circle -->
  <circle cx="900" cy="220" r="72" fill="rgba(0,0,0,0.4)" stroke="${scoreColor}" stroke-width="3" opacity="0.9"/>
  <text x="900" y="208" text-anchor="middle" font-size="13" fill="${scoreColor}" font-weight="bold" filter="url(#glow)">${scoreLabel || '評分'}</text>
  <text x="900" y="248" text-anchor="middle" font-size="40" font-weight="bold" fill="${scoreColor}" filter="url(#glow)">${score}</text>
  <text x="900" y="268" text-anchor="middle" font-size="12" fill="${scoreColor}" opacity="0.7">/ 100</text>

  <!-- Hexagram name & symbol -->
  <text x="600" y="180" text-anchor="middle" font-size="72" font-weight="bold" fill="#F0D060" filter="url(#glow)" font-family="serif">${hexName}卦</text>
  <text x="600" y="210" text-anchor="middle" font-size="14" fill="#8B6914" letter-spacing="2">第 ${hexId} 卦</text>

  ${questionType ? `<text x="600" y="240" text-anchor="middle" font-size="13" fill="#5c4a2a">問：${questionType}</text>` : ''}
  ${question ? `<text x="600" y="262" text-anchor="middle" font-size="12" fill="#5c4a2a" font-style="italic">「${question.slice(0, 40)}${question.length > 40 ? '…' : ''}」</text>` : ''}

  <!-- Hexagram lines -->
  ${lines.join('\n  ')}

  <!-- Changed hexagram -->
  ${changedName ? `
  <line x1="400" y1="490" x2="800" y2="490" stroke="#3d2e1a" stroke-width="1" stroke-dasharray="4,4"/>
  <text x="600" y="515" text-anchor="middle" font-size="12" fill="#A335EE" letter-spacing="2">↓ 變卦 ↓</text>
  <text x="600" y="545" text-anchor="middle" font-size="36" font-weight="bold" fill="#A78BFA" font-family="serif">${changedName}卦</text>
  <text x="600" y="568" text-anchor="middle" font-size="12" fill="#5c4a2a">第 ${changedId} 卦</text>
  ` : ''}

  <!-- Rating badge -->
  <rect x="450" y="590" width="300" height="50" rx="6" fill="${scoreColor}" opacity="0.12" stroke="${scoreColor}" stroke-width="1.5"/>
  <text x="600" y="620" text-anchor="middle" font-size="22" font-weight="bold" fill="${scoreColor}">${rating}</text>

  <!-- Judgment -->
  ${judgment ? `
  <text x="600" y="675" text-anchor="middle" font-size="22" fill="#F0D060" font-family="serif" filter="url(#glow)">「${judgment}」</text>
  ` : ''}

  <!-- Image -->
  ${image ? `
  <text x="600" y="720" text-anchor="middle" font-size="15" fill="#C9A227" font-family="serif">象曰：${image}</text>
  ` : ''}

  <!-- Advice -->
  ${advice ? `
  <rect x="80" y="745" width="1040" height="70" rx="6" fill="rgba(0,0,0,0.3)" stroke="#3d2e1a" stroke-width="1"/>
  <text x="600" y="775" text-anchor="middle" font-size="13" fill="#8B6914" letter-spacing="1">趨 吉 避 凶</text>
  <text x="600" y="800" text-anchor="middle" font-size="14" fill="#D4AF37">${advice}</text>
  ` : ''}

  <!-- Footer -->
  <line x1="200" y1="855" x2="1000" y2="855" stroke="#3d2e1a" stroke-width="1"/>
  <text x="600" y="875" text-anchor="middle" font-size="11" fill="#3d2e1a">易經占卜 · mylife.first.pet</text>
</svg>`;

  const filename = `易經占卜_${hexName}卦_${score}分.svg`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
