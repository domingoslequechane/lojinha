import React from 'react';

interface LoginhaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  withTagline?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const LojinhaIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 36 }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/lojinha-icon.png"
        alt="Lojinha"
        className="w-full h-full object-contain drop-shadow-sm select-none"
        draggable={false}
      />
    </div>
  );
};

// Aliases for compatibility
export const LoginhaIcon = LojinhaIcon;

export const LojinhaLogo: React.FC<LoginhaLogoProps> = ({
  size = 'md',
  variant = 'full',
  withTagline = true,
  className = '',
  theme = 'dark',
}) => {
  const iconSize = size === 'sm' ? 30 : size === 'md' ? 38 : size === 'lg' ? 46 : 56;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl';
  const taglineSize = size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[11px]' : 'text-xs';

  if (variant === 'icon') {
    return <LojinhaIcon size={iconSize} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LojinhaIcon size={iconSize} className="flex-shrink-0" />
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span 
            className={`font-baloo font-bold tracking-normal ${textSize}`} 
            style={{ 
              color: theme === 'light' ? '#0F2D26' : '#FDFEF8',
              lineHeight: 1.1 
            }}
          >
            Loj<span style={{ color: '#C1F76B' }}>inha</span>
          </span>
          <span
            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide font-sans"
            style={{
              backgroundColor: 'rgba(193, 247, 107, 0.15)',
              color: '#C1F76B',
              border: '1px solid rgba(193, 247, 107, 0.3)',
            }}
          >
            PRO
          </span>
        </div>
        {withTagline && (
          <span className={`font-medium tracking-normal ${taglineSize}`} style={{ color: '#95BDB0' }}>
            A tua loja, simples.
          </span>
        )}
      </div>
    </div>
  );
};

export const LoginhaLogo = LojinhaLogo;

