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

export default async function ResultPage({ params }: Props) {
  const resolved = await params;
  const encoded = typeof resolved.encoded === 'string' ? resolved.encoded : '';
  const decoded = decodeResult(encoded);

  if (!decoded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6">☰☷</div>
        <h1 className="text-2xl font-bold mb-4">無法解析占卜結果</h1>
        <a href="/" className="text-amber-400 hover:underline">前往占卜 →</a>
      </div>
    );
  }

  const result = buildResultData(decoded);
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0D0D0D', color: '#F5E6D3' }}>
        <div className="text-6xl mb-6">☰☷</div>
        <h1 className="text-2xl font-bold mb-4">無效的占卜連結</h1>
        <a href="/" className="text-amber-400 hover:underline">前往占卜 →</a>
      </div>
    );
  }

  return (
    <ResultClient
      decoded={decoded}
      hexagramName={result.hexagramName}
      changedHexagramName={result.changedHexagramName}
    />
  );
}
