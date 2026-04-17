import { NextRequest, NextResponse } from 'next/server';

/**
 * OG Image Generator - returns an SVG image for social sharing.
 * Usage: /api/og?hex=乾&changed=坤&rating=大吉
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hex = searchParams.get('hex') || '?';
  const changed = searchParams.get('changed') || '';
  const rating = searchParams.get('rating') || '─';

  const ratingColor = rating.includes('大吉') || rating.includes('吉') ? '#22C55E'
    : rating.includes('凶') || rating.includes('咎') ? '#EF4444'
    : '#F59E0B';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0D0D"/>
      <stop offset="100%" stop-color="#1a0a0a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8C547"/>
      <stop offset="100%" stop-color="#C9A227"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" rx="24"/>

  <!-- Border -->
  <rect x="16" y="16" width="1168" height="598" fill="none" stroke="#C9A227" stroke-width="2" rx="16" opacity="0.4"/>

  <!-- Decorative top ornament -->
  <text x="600" y="80" text-anchor="middle" font-size="36" fill="#C9A227" opacity="0.6">☰☷</text>

  <!-- Main hexagram name -->
  <text x="600" y="200" text-anchor="middle" font-size="120" font-weight="bold" fill="#F5E6D3" font-family="serif">
    ${hex}卦
  </text>

  ${changed ? `
  <!-- Arrow and changed hexagram -->
  <text x="600" y="290" text-anchor="middle" font-size="28" fill="#8B5CF6">↓ 變卦 ↓</text>
  <text x="600" y="360" text-anchor="middle" font-size="72" font-weight="bold" fill="#A78BFA" font-family="serif">
    ${changed}卦
  </text>
  ` : ''}

  <!-- Rating badge -->
  <rect x="420" y="${changed ? 390 : 310}" width="360" height="70" rx="12" fill="${ratingColor}" opacity="0.15"/>
  <rect x="420" y="${changed ? 390 : 310}" width="360" height="70" rx="12" fill="none" stroke="${ratingColor}" stroke-width="2"/>
  <text x="600" y="${changed ? 435 : 355}" text-anchor="middle" font-size="36" font-weight="bold" fill="${ratingColor}">
    ${rating}
  </text>

  <!-- Footer -->
  <text x="600" y="580" text-anchor="middle" font-size="20" fill="#C9A227" opacity="0.5">
    易經占卜 · mylife.first.pet
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
