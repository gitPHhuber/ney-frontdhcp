import React from 'react';

interface TooltipProps {
  id: string;
  text: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ id, text, className }) => (
  <span className={['tooltip', className].filter(Boolean).join(' ')}>
    <button type="button" className="tooltip__trigger" aria-describedby={id}>
      <span aria-hidden>?</span>
      <span className="tooltip__sr-only">{`Подсказка: ${text}`}</span>
    </button>
    <span role="tooltip" id={id} className="tooltip__bubble">
      {text}
    </span>
  </span>
);
