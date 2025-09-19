import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  description,
  actions,
}) => (
  <motion.section
    className="page-placeholder"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <header>
      <h1>{title}</h1>
      {description && <p className="muted">{description}</p>}
    </header>
    {actions && <div className="placeholder-actions">{actions}</div>}
  </motion.section>
);
