import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './styles.scss';

/**
 * DataToolTip - A high-fidelity reusable portal-based tooltip.
 * 
 * @param {string} text - The definitive definition/tooltip to display.
 * @param {React.ReactNode} children - The label or icon to trigger the tooltip.
 */
const DataToolTip = ({ text, children, cursor = 'pointer', direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 260; // matches CSS width
    
    let top = 0;
    let left = 0;

    if (direction === 'up') {
      top = rect.top - 8;
      const center = rect.left + rect.width / 2;
      left = center - tooltipWidth / 2;
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) {
        left = window.innerWidth - tooltipWidth - 8;
      }
    } else if (direction === 'down') {
      top = rect.bottom + 8;
      const center = rect.left + rect.width / 2;
      left = center - tooltipWidth / 2;
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) {
        left = window.innerWidth - tooltipWidth - 8;
      }
    } else if (direction === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + 8;
      if (left + tooltipWidth > window.innerWidth - 8) {
        left = rect.left - tooltipWidth - 8;
      }
      if (left < 8) left = 8;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <>
      <span 
        ref={triggerRef}
        className="data-tooltip-trigger" 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          background: 'transparent',
          padding: 0,
          border: 'none',
          display: 'inline-block',
          cursor: cursor
        }}
      >
        {children}
      </span>
      {isVisible && createPortal(
        <div 
          className={`data-tooltip-portal tooltip-portal-${direction}`}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};

export default DataToolTip;

