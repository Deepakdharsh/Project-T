'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

type GalleryItem = {
    id: string;
    src: string;
    alt: string;
    span?: 'tall' | 'wide' | 'normal';
};

function shuffle<T>(arr: T[]) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function GalleryPage() {
    const initial: GalleryItem[] = useMemo(
        () => [
            {
                id: 'g1',
                src: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1800&auto=format&fit=crop',
                alt: 'Ground view',
                span: 'tall',
            },
            {
                id: 'g2',
                src: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1800&auto=format&fit=crop',
                alt: 'Players on the field',
            },
            {
                id: 'g3',
                src: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1800&auto=format&fit=crop',
                alt: 'Turf close-up',
            },
            {
                id: 'g4',
                src: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1800&auto=format&fit=crop',
                alt: 'Stadium lights',
                span: 'wide',
            },
            {
                id: 'g5',
                src: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1800&auto=format&fit=crop',
                alt: 'Kickoff moment',
            },
            {
                id: 'g6',
                src: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1800&auto=format&fit=crop',
                alt: 'Warm-up drills',
            },
            {
                id: 'g7',
                src: 'https://images.unsplash.com/photo-1520975867597-0f1f1a90a8a0?q=80&w=1800&auto=format&fit=crop',
                alt: 'Goal net',
                span: 'tall',
            },
            {
                id: 'g8',
                src: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?q=80&w=1800&auto=format&fit=crop',
                alt: 'Evening match',
            },
            {
                id: 'g9',
                src: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1800&auto=format&fit=crop',
                alt: 'Training session',
            },
            {
                id: 'g10',
                src: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1800&auto=format&fit=crop',
                alt: 'Corner view',
                span: 'wide',
            },
        ],
        []
    );

    const [items, setItems] = useState<GalleryItem[]>(() => shuffle(initial));

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
                                Gallery
                            </h1>
                            <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
                                A Pinterest-style wall of our ground highlights — lighting, turf, and match moments.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setItems(shuffle(items))}
                            className="self-start md:self-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                            aria-label="Shuffle gallery"
                            title="Shuffle"
                        >
                            <RefreshCcw size={18} className="text-white" />
                        </button>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-b from-black via-[#12081f] to-black border border-white/10 rounded-3xl p-5 md:p-7 shadow-[0_40px_140px_rgba(0,0,0,0.6)]">
                        <div className="columns-2 md:columns-3 lg:columns-4 [column-gap:1.25rem] md:[column-gap:1.5rem]">
                            {items.map((img) => (
                                <div
                                    key={img.id}
                                    className="mb-5 md:mb-6 break-inside-avoid rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.55)] hover:-translate-y-1 transition-transform"
                                >
                                    <div
                                        className={[
                                            'relative w-full',
                                            img.span === 'tall' ? 'h-80 md:h-96' : img.span === 'wide' ? 'h-56 md:h-64' : 'h-64 md:h-72',
                                        ].join(' ')}
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.alt}
                                            className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-[0.9]"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-200 bg-black/40 border border-white/10 px-3 py-1 rounded-full backdrop-blur">
                                            <ImageIcon size={14} className="text-zinc-200" />
                                            Ground
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <div className="text-white font-black italic tracking-tight text-lg leading-tight">
                                                {img.alt}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom blur/fade mask (blur fades out upward) */}
                        <div
                            className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-black/80 backdrop-blur-xl [mask-image:linear-gradient(to_top,black_0%,black_35%,transparent_100%)]"
                            aria-hidden="true"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


