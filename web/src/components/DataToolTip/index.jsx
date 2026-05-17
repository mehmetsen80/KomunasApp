import React from 'react';
import './styles.scss';

/**
 * DataToolTip - A high-fidelity reusable wrapper for dashboard definitions.
 * 
 * @param {string} text - The definitive definition/tooltip to display.
 * @param {React.ReactNode} children - The label or icon to trigger the tooltip.
 */
const DataToolTip = ({ text, children, cursor = 'pointer', direction = 'up' }) => {
  return (
    <span 
      className={`data-tooltip-trigger tooltip-${direction}`} 
      data-tooltip={text}
      style={{
        background: 'transparent',
        padding: 0,
        border: 'none',
        display: 'block',
        width: '100%',
        cursor: cursor
      }}
    >
      {children}
    </span>
  );
};

export default DataToolTip;
