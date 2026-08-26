import { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { ApiError, getHealth } from '../shared/api/client';
import { getAppEnv } from '../shared/config/env';
import { Button, Text } from '../shared/ui/atoms';

type HealthState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'error'; message: string };

export function HomePage() {
  const ready = useAppSelector((state) => state.app.ready);
  const { apiUrl, apiKey, fees } = getAppEnv();
  const [health, setHealth] = useState<HealthState>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      setHealth({ kind: 'loading' });
      try {
        const result = await getHealth();
        if (!cancelled) {
          setHealth({ kind: 'ok', status: result.status });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : 'unreachable';
          setHealth({ kind: 'error', message });
        }
      }
    }

    void ping();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="shell">
      <Text as="h1" className="shell__title">
        Product checkout
      </Text>
      <Text tone="muted" className="shell__lede">
        Foundation shell — shared API client, atoms, and env wiring. Product
        catalog lives at <code>/</code>.
      </Text>

      <dl className="meta">
        <div>
          <dt>Redux</dt>
          <dd>{ready ? 'connected' : 'offline'}</dd>
        </div>
        <div>
          <dt>API URL</dt>
          <dd>{apiUrl}</dd>
        </div>
        <div>
          <dt>API key</dt>
          <dd>{apiKey ? 'configured' : 'missing'}</dd>
        </div>
        <div>
          <dt>Fees (display)</dt>
          <dd>
            {fees.baseFee} + {fees.deliveryFee} {fees.currency}
          </dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>
            {health.kind === 'idle' || health.kind === 'loading'
              ? '…'
              : health.kind === 'ok'
                ? health.status
                : health.message}
          </dd>
        </div>
      </dl>

      <div className="shell__actions">
        <Button
          type="button"
          onClick={() => {
            setHealth({ kind: 'loading' });
            void getHealth()
              .then((result) =>
                setHealth({ kind: 'ok', status: result.status }),
              )
              .catch((error: unknown) => {
                const message =
                  error instanceof Error ? error.message : 'unreachable';
                setHealth({ kind: 'error', message });
              });
          }}
        >
          Ping API
        </Button>
        <Button variant="secondary" type="button" disabled>
          Checkout (soon)
        </Button>
      </div>
    </main>
  );
}
