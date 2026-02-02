import { motion } from 'framer-motion';
import { Video, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Video className="w-8 h-8 text-primary" />
            <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1" />
          </div>
          <span className="text-xl font-heading font-bold">
            Video<span className="text-gradient">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Fitur
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Harga
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Contoh
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Masuk
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Mulai Gratis
          </button>
        </div>
      </div>
    </motion.header>
  );
};
