'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

export const Navbar = ({ onViewChange, currentView }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-black/95 border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex items-center cursor-pointer group z-50" 
            onClick={() => { onViewChange('home'); setIsMenuOpen(false); }}
          >
            <span className="font-extrabold text-2xl text-white tracking-tighter uppercase italic group-hover:opacity-80 transition-opacity">
              4Cantera<span className="text-zinc-500">.</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            {['Home', 'Campus', 'NextStep', 'Contact'].map((item) => (
              <button 
                key={item}
                onClick={() => onViewChange(item.toLowerCase() === 'home' ? 'home' : 'booking')}
                className="text-xs font-bold text-white uppercase tracking-widest hover:text-zinc-400 transition-colors"
              >
                {item}
              </button>
            ))}
            
            <button 
              onClick={() => onViewChange('admin-login')}
              className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Login
            </button>

            <button 
              onClick={() => onViewChange('booking')}
              className="bg-white text-black px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
            >
              Book Turf
            </button>
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
            {['Home', 'Campus', 'NextStep', 'Book Turf', 'Admin Login'].map((item) => (
              <button 
                key={item}
                onClick={() => { 
                  onViewChange(item === 'Admin Login' ? 'admin-login' : item === 'Home' ? 'home' : 'booking'); 
                  setIsMenuOpen(false); 
                }}
                className="text-3xl font-black text-white uppercase italic tracking-tighter text-left border-b border-white/10 pb-4"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-auto mb-10 text-zinc-500 text-xs uppercase tracking-widest">
            © 4Cantera Mobile
          </div>
        </div>
      )}
    </nav>
  );
};

