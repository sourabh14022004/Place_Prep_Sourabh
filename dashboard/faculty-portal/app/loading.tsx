export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid #1e293b',
          borderTop: '3px solid #6366f1',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          color: '#64748b',
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
