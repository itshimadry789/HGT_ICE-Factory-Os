
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<'top' | 'bottom' | 'left' | 'right'>(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close tooltip
  useEffect(() => {
    if (isClicked) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tooltipRef.current &&
          triggerRef.current &&
          !tooltipRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsVisible(false);
          setIsClicked(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isClicked]);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      // Small delay to ensure tooltip is rendered and measured
      const timeoutId = setTimeout(() => {
        if (!tooltipRef.current || !triggerRef.current) return;
        const trigger = triggerRef.current;
        const tooltip = tooltipRef.current;
        const rect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        let top = 0;
        let left = 0;
        let actualArrowDirection: 'top' | 'bottom' | 'left' | 'right' = position;
        
        // Calculate position based on preferred position and available space
        if (position === 'top') {
          if (rect.top - tooltipRect.height - 12 < 0) {
            // Not enough space above, position below
            top = rect.bottom + window.scrollY + 12;
            actualArrowDirection = 'top';
          } else {
            top = rect.top + window.scrollY - tooltipRect.height - 12;
            actualArrowDirection = 'bottom';
          }
          left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (position === 'bottom') {
          if (rect.bottom + tooltipRect.height + 12 > window.innerHeight) {
            // Not enough space below, position above
            top = rect.top + window.scrollY - tooltipRect.height - 12;
            actualArrowDirection = 'bottom';
          } else {
            top = rect.bottom + window.scrollY + 12;
            actualArrowDirection = 'top';
          }
          left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (position === 'left') {
          if (rect.left - tooltipRect.width - 12 < 0) {
            // Not enough space on left, position right
            left = rect.right + window.scrollX + 12;
            actualArrowDirection = 'left';
          } else {
            left = rect.left + window.scrollX - tooltipRect.width - 12;
            actualArrowDirection = 'right';
          }
          top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        } else {
          if (rect.right + tooltipRect.width + 12 > window.innerWidth) {
            // Not enough space on right, position left
            left = rect.left + window.scrollX - tooltipRect.width - 12;
            actualArrowDirection = 'right';
          } else {
            left = rect.right + window.scrollX + 12;
            actualArrowDirection = 'left';
          }
          top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        }
        
        // Ensure tooltip stays within viewport
        left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));
        top = Math.max(12, Math.min(top, window.innerHeight + window.scrollY - tooltipRect.height - 12));
        
        setTooltipStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 9999,
          pointerEvents: 'none'
        });
        
        // Arrow positioning - center it on the side facing the trigger
        if (actualArrowDirection === 'top' || actualArrowDirection === 'bottom') {
          // For top/bottom arrows, center horizontally
          const triggerCenterX = rect.left + window.scrollX + (rect.width / 2);
          const arrowLeft = triggerCenterX - left;
          const arrowStyleObj: React.CSSProperties = {
            position: 'absolute',
            left: `${Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12))}px`,
            transform: 'translateX(-50%)'
          };
          if (actualArrowDirection === 'top') {
            arrowStyleObj.top = '-4px';
          } else {
            arrowStyleObj.bottom = '-4px';
          }
          setArrowStyle(arrowStyleObj);
        } else {
          // For left/right arrows, center vertically
          const triggerCenterY = rect.top + window.scrollY + (rect.height / 2);
          const arrowTop = triggerCenterY - top;
          const arrowStyleObj: React.CSSProperties = {
            position: 'absolute',
            top: `${Math.max(12, Math.min(arrowTop, tooltipRect.height - 12))}px`,
            transform: 'translateY(-50%)'
          };
          if (actualArrowDirection === 'left') {
            arrowStyleObj.left = '-4px';
          } else {
            arrowStyleObj.right = '-4px';
          }
          setArrowStyle(arrowStyleObj);
        }
        
        setArrowDirection(actualArrowDirection);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, position]);

  const handleClick = () => {
    setIsVisible(!isVisible);
    setIsClicked(!isVisible);
  };

  const arrowClasses = {
    top: 'border-t-white border-r-transparent border-b-transparent border-l-transparent',
    bottom: 'border-b-white border-r-transparent border-t-transparent border-l-transparent',
    left: 'border-l-white border-r-transparent border-t-transparent border-b-transparent',
    right: 'border-r-white border-l-transparent border-t-transparent border-b-transparent'
  };

  const tooltipContent = isVisible ? (
    <div 
      ref={tooltipRef}
      className="w-80 max-w-[90vw] animate-in fade-in zoom-in-95 duration-200"
      style={tooltipStyle}
    >
      <div className="bg-white backdrop-blur-xl text-slate-900 text-sm font-medium rounded-xl px-5 py-4 shadow-2xl border border-slate-200 relative">
        <p className="leading-relaxed whitespace-normal break-words">{content}</p>
        <div 
          className={`absolute w-2 h-2 border-4 ${arrowClasses[arrowDirection]}`}
          style={arrowStyle}
        ></div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onMouseEnter={() => {
            if (!isClicked) setIsVisible(true);
          }}
          onMouseLeave={() => {
            if (!isClicked) setIsVisible(false);
          }}
          onClick={handleClick}
          className="cursor-help"
        >
          {children}
        </div>
      </div>
      {typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}

