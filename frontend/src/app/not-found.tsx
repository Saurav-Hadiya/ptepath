export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-primary)' }}>
        404
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
    </main>
  );
}
