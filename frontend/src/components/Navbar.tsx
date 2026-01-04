'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navChrome = scrolled || isMenuOpen
        ? 'bg-black/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] border-b border-white/10'
        : 'bg-transparent';

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navChrome}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center h-20">
                    <Link
                        href="/"
                        className="flex items-center cursor-pointer group z-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span className="font-extrabold text-2xl text-white tracking-tighter uppercase italic group-hover:opacity-80 transition-opacity">
                            4Cantera<span className="text-zinc-500">.</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-10">
                        <Link href="/" className="text-xs font-bold text-white uppercase tracking-widest hover:text-zinc-400 transition-colors">
                            Home
                        </Link>
                        <Link href="/gallery" className="text-xs font-bold text-white uppercase tracking-widest hover:text-zinc-400 transition-colors">
                            Gallery
                        </Link>
                        <Link href="/nextstep" className="text-xs font-bold text-white uppercase tracking-widest hover:text-zinc-400 transition-colors">
                            NextStep
                        </Link>
                        <Link href="/contact" className="text-xs font-bold text-white uppercase tracking-widest hover:text-zinc-400 transition-colors">
                            Contact
                        </Link>

                        <Link
                            href="/admin"
                            className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Admin
                        </Link>

                        <Link
                            href="/booking"
                            className="bg-white text-black px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
                        >
                            Book Turf
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white z-50 p-2"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="fixed inset-0 bg-black z-40 flex flex-col pt-24 px-6 animate-fade-in md:hidden">
                    <div className="flex flex-col space-y-8">
                        {[
                            { label: 'Home', href: '/' },
                            { label: 'Gallery', href: '/gallery' },
                            { label: 'NextStep', href: '/nextstep' },
                            { label: 'Contact', href: '/contact' },
                            { label: 'Book Turf', href: '/booking' },
                            { label: 'Admin', href: '/admin' },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-3xl font-black text-white uppercase italic tracking-tighter text-left border-b border-white/10 pb-4"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="mt-auto mb-10 text-zinc-500 text-xs uppercase tracking-widest">
                        © 4Cantera Mobile
                    </div>
                </div>
            )}
        </nav>
    );
}


