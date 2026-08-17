import { Card } from '../components/ui';

export function ComingSoonPage({ title }: { title: string }) {
  return <div className="page-stack"><div className="eyebrow">ADMIN MODULE</div><h1>{title}</h1><Card className="coming-card"><span className="coming-number">NEXT</span><h2>Data-connected view coming next.</h2><p className="muted">The backend contract is protected and ready. This screen will be connected when its focused admin implementation begins.</p></Card></div>;
}
