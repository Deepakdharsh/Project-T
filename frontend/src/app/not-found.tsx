import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full border border-white/10 bg-zinc-900/40 p-10">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
          404
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">
          Page not found
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist (or was moved). Use the links below to get back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors text-center"
          >
            Go Home
          </Link>
          <Link
            href="/booking"
            className="border border-white/20 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors text-center"
          >
            Book Turf
          </Link>
        </div>
      </div>
    </div>
  );
}


