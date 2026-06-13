import * as Sentry from '@sentry/react';

function FallbackUI() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>The error has been reported. Please try refreshing the page.</p>
      <button onClick={() => window.location.reload()}>Refresh</button>
    </div>
  );
}

export default function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={<FallbackUI />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
