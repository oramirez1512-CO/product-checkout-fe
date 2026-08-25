import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export function HomePage() {
  const ready = useSelector((state: RootState) => state.app.ready);
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  return (
    <main className="shell">
      <p className="eyebrow">Product checkout</p>
      <h1>App ready</h1>
      <p className="lede">
        Frontend shell is running. Product and payment screens come next.
      </p>
      <dl className="meta">
        <div>
          <dt>Redux</dt>
          <dd>{ready ? 'connected' : 'offline'}</dd>
        </div>
        <div>
          <dt>API</dt>
          <dd>{apiUrl}</dd>
        </div>
      </dl>
    </main>
  );
}
