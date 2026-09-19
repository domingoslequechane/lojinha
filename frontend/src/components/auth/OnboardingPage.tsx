import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Sparkles, MapPin, Smartphone, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding, logout, isLoading } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [city, setCity] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [twoFactorPhone, setTwoFactorPhone] = useState(user?.phone || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!storeName.trim()) { setErrorMessage('Por favor, informe o Nome da Loja.'); return; }
    const result = await completeOnboarding({
      storeName: storeName.trim(),
      slogan: slogan.trim() || 'Loja Oficial WhatsApp',
      city: city.trim() || undefined,
      enable2FAWhatsApp: enable2FA,
      twoFactorPhone: enable2FA ? twoFactorPhone.trim() : undefined,
    });
    if (result.success) navigate('/cockpit');
    else setErrorMessage(result.error || 'Falha ao salvar informações da loja.');
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => e.currentTarget.style.borderColor = '#27AE60';
  const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => e.currentTarget.style.borderColor = 'var(--color-border)';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-base)', color: 'var(--color-text-primary)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(193,247,107,0.06)' }} />

      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #27AE60, #C1F76B)', color: '#0F2D26' }}>
            <Store className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: '#C1F76B', backgroundColor: 'rgba(193,247,107,0.12)', border: '1px solid rgba(193,247,107,0.2)' }}>
            <Sparkles className="w-3 h-3" /> Configuração Inicial
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Personalize Sua Loja</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Defina a identidade e configure a segurança
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Name */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome da Loja *</label>
            <div className="relative">
              <ShoppingBag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)}
                placeholder="Ex: Minha Loja"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors font-medium"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Slogan / Ramo de Atuação</label>
            <div className="relative">
              <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)}
                placeholder="Ex: Loja Oficial WhatsApp"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Cidade / Região (Opcional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: Sua Cidade ou País"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>

          {/* 2FA Section */}
          <div className="p-3.5 rounded-2xl space-y-2.5 mt-2"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(39,174,96,0.15)', color: '#27AE60' }}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
                    2FA via WhatsApp
                    <span className="text-[10px] font-normal" style={{ color: 'var(--color-text-secondary)' }}>(Opcional)</span>
                  </h3>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                    Proteja o acesso com código no WhatsApp
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setEnable2FA(!enable2FA)}
                className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                style={{ backgroundColor: enable2FA ? '#27AE60' : 'var(--color-surface-hover)' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${enable2FA ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {enable2FA && (
              <div className="pt-2 animate-in fade-in duration-150" style={{ borderTop: '1px solid var(--color-border)' }}>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Número WhatsApp para código 2FA:
                </label>
                <input type="tel" required={enable2FA} value={twoFactorPhone}
                  onChange={e => setTwoFactorPhone(e.target.value)} placeholder="+258 84 000 0000"
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
            {isLoading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Concluir & Abrir o Cockpit</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-4 text-center space-y-3">
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            Você poderá alterar estes dados em <strong>Minha Loja</strong> e <strong>Minha Conta</strong>.
          </p>
          <button
            type="button"
            onClick={() => { logout?.(); navigate('/login'); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 hover:opacity-80 cursor-pointer"
            style={{ color: '#95BDB0', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
};
