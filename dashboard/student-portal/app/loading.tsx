/**
 * Student Portal — global loading skeleton.
 * Shown while a page/layout is streaming or fetching.
 *
 * Background matches the app shell (bg-gray-50) — it used to be #0a0a0f,
 * which flashed near-black on every stream boundary before the page painted.
 */
export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        gap: '1rem',
      }}
    >
      {/* Animated spinner */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          margin: 0,
        }}
      >
        Loading...
      </p>
    </div>
  );
}
