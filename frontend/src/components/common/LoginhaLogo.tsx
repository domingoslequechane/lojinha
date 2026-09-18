import React from 'react';

interface LoginhaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  withTagline?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const LoginhaIcon: React.FC<{ className?: string; size?: number }> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* App Icon Rounded Square Background (optional container, or transparent) */}
      <rect width="100" height="100" rx="28" fill="#0F2D26" />
      
      {/* Store Awning (Roof) */}
      <path
        d="M26 40C26 31 32 24 40 24H60C68 24 74 31 74 40C74 42 72 44 70 44C68 44 66 42 65 40C64 42 62 44 60 44C58 44 56 42 55 40C54 42 52 44 50 44C48 44 46 42 45 40C44 42 42 44 40 44C38 44 36 42 35 40C34 42 32 44 30 44C28 44 26 42 26 40Z"
        fill="#C1F76B"
      />
      {/* Awning green stripes detail */}
      <path
        d="M33 24.5C36 29 37 36 38 43"
        stroke="#27AE60"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M48 24C49 29 49 36 49 43"
        stroke="#27AE60"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M63 24.5C62 29 61 36 60 43"
        stroke="#27AE60"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      {/* Store Bottom Frame / Body */}
      <path
        d="M29 46H71V62C71 70.8366 63.8366 78 55 78H45C36.1634 78 29 70.8366 29 62V46Z"
        stroke="#FDFEF8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Friendly Smile inside store */}
      <path
        d="M42 61C44.5 64.5 50 67 55 63"
        stroke="#C1F76B"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const LoginhaLogo: React.FC<LoginhaLogoProps> = ({
  size = 'md',
  variant = 'full',
  withTagline = true,
  className = '',
  theme = 'dark',
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 44 : 54;
  const textSize = size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-xl' : 'text-2xl';
  const taglineSize = size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[11px]' : 'text-xs';

  if (variant === 'icon') {
    return <LoginhaIcon size={iconSize} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LoginhaIcon size={iconSize} className="flex-shrink-0" />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight ${textSize}`} style={{ color: theme === 'light' ? '#0F2D26' : '#FDFEF8' }}>
            Log<span style={{ color: '#C1F76B' }}>inha</span>
          </span>
          <span
            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded"
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
          <span className={`font-medium mt-0.5 tracking-normal ${taglineSize}`} style={{ color: '#95BDB0' }}>
            A tua loja, simples.
          </span>
        )}
      </div>
    </div>
  );
};
