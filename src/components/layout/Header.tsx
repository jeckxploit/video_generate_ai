import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Sparkles, Menu, X } from 'lucide-react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Harga', href: '#harga' },
    { label: 'Contoh', href: '#contoh' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1" />
          </div>
          <span className="text-base sm:text-xl font-heading font-bold">
            Video<span className="text-gradient">AI</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs sm:text-sm">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-3">
          <button className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors px-2 sm:px-3 py-1.5">
            Masuk
          </button>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
            Mulai Gratis
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2 text-foreground hover:bg-accent/10 rounded-lg transition-colors touch-manipulation"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-3 sm:px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 mt-3 border-t border-border space-y-2">
                <button className="w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors touch-manipulation">
                  Masuk
                </button>
                <button className="w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation">
                  Mulai Gratis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
