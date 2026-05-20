import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface JellyViewProps {
  children: ReactNode;
}

export function JellyView({ children }: JellyViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
