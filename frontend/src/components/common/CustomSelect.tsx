import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  variant?: 'default' | 'dot-only';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className = '',
  dropdownClassName = '',
  align = 'left',
  size = 'sm',
  leftIcon,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setEffectiveAlign(align);
  }, [align]);

  // Smart auto-alignment to prevent popover cut-off on screen edges
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (align === 'right' && rect.right < 240) {
        setEffectiveAlign('left');
      } else if (align === 'left' && rect.left + 240 > window.innerWidth) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign(align);
      }
    }
  }, [isOpen, align]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';
  const isDotOnly = variant === 'dot-only';

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      {isDotOnly ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-[#14382F] border-[#C1F76B] ring-1 ring-[#C1F76B]/40 shadow-md'
              : 'bg-[#0F2D26] hover:bg-[#14382F] border-[#235447] text-[#FDFEF8] hover:border-[#2D6B5A]'
          }`}
          title={`Fase atual: ${selectedOption?.label || placeholder} (Clique para mudar)`}
        >
          <span
            className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0 animate-pulse"
            style={{ backgroundColor: selectedOption?.color || '#C1F76B' }}
          />
          <ChevronDown
            className={`w-3 h-3 text-[#95BDB0] transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-[#C1F76B]' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 rounded-xl font-medium transition-all duration-150 cursor-pointer border hover:scale-[1.005] active:scale-[0.99] ${
            isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs'
          } ${
            isOpen
              ? 'bg-[#14382F] border-[#C1F76B] text-[#FDFEF8] ring-1 ring-[#C1F76B]/40 shadow-md'
              : 'bg-[#14382F] hover:bg-[#184339] border-[#235447] text-[#FDFEF8] hover:border-[#2D6B5A]'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {leftIcon && (
              <span className="flex-shrink-0">{leftIcon}</span>
            )}
            {selectedOption?.color && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            {selectedOption?.icon && (
              <span className="flex-shrink-0 text-[#95BDB0]">{selectedOption.icon}</span>
            )}
            <span className="truncate font-semibold">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-[#95BDB0] transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-[#C1F76B]' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 z-50 ${isDotOnly ? 'w-56' : 'min-w-full w-full'} max-w-[calc(100vw-24px)] max-h-64 overflow-y-auto rounded-2xl bg-[#0F2D26] border border-[#235447] shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 ${
            effectiveAlign === 'right' ? 'right-0' : 'left-0'
          } ${dropdownClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#C1F76B]/15 text-[#C1F76B] font-bold'
                    : 'text-[#FDFEF8] hover:bg-[#184339] hover:translate-x-1 hover:text-white font-medium active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.icon && (
                    <span className="flex-shrink-0">{option.icon}</span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#C1F76B] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
