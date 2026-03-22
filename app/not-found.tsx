import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-[var(--color-accent)] text-6xl font-bold mb-4">404</p>
      <p className="font-mono text-[var(--color-muted)] text-sm mb-2">$ cat /dev/null</p>
      <p className="font-mono text-[var(--color-muted)] text-sm mb-8">// page not found</p>
      <Link href="/"
        className="font-mono text-sm text-[var(--color-accent)] hover:underline">
        cd ~/home →
      </Link>
    </div>
  );
}
