import { Metadata } from 'next';
import { decodeResult, buildResultData, buildOgTitle } from './shared';
import ResultClient from './ResultClient';

interface Props {
  params: { encoded: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const encoded = typeof resolved.encoded === 'string' ? resolved.encoded : '';

  const decoded = decodeResult(encoded);
  if (!decoded) {
    return {
      title: '易經占卜 - 無效連結',
      description: '此占卜連結已失效，請重新占卜。',
    };
  }

  const result = buildResultData(decoded);
  if (!result) {
    return { title: '易經占卜' };
  }

  const title = buildOgTitle(result.hexagramName, result.changedHexagramName);
  const description = `${result.fortuneRating} — ${result.fortuneSummary.slice(0, 120)}${result.fortuneSummary.length > 120 ? '...' : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: '易經占卜',
      images: [{
        url: `https://mylife.first.pet/api/og?hex=${encodeURIComponent(result.hexagramName)}&changed=${encodeURIComponent(result.changedHexagramName || '')}&rating=${encodeURIComponent(result.fortuneRating)}`,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ResultPage({ params }: Props) {
  return <ResultClient />;
}
