import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LojinhaIcon } from '../common/LoginhaLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verifyWhatsApp2FA, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.requires2FA) {
          setShow2FAModal(true);
        } else if (result.onboardingCompleted) {
          navigate('/cockpit', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        setErrorMessage(result.error || 'Falha ao realizar login.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Erro inesperado ao realizar login.');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const result = await verifyWhatsApp2FA(twoFactorCode);
      if (result.success) {
        setShow2FAModal(false);
        navigate('/cockpit', { replace: true });
      } else {
        setErrorMessage(result.error || 'Código 2FA incorreto.');
      }
    } catch (err: any) {
      console.error('2FA error:', err);
      setErrorMessage(err?.message || 'Erro ao verificar código 2FA.');
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden select-none"
      style={{ backgroundColor: 'var(--color-surface-base)', color: 'var(--color-text-primary)' }}>

      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(193,247,107,0.06)' }} />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(39,174,96,0.05)' }} />

      {/* Card */}
      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <LojinhaIcon size={56} className="mb-3" />
          <h1 className="font-baloo font-bold text-2xl flex items-center gap-2" style={{ color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
            <span>{'Loj'}<span style={{ color: '#C1F76B' }}>{'inha'}</span></span>
            <span className="text-xs px-2 py-0.5 rounded-md font-sans font-semibold"
              style={{ color: '#C1F76B', backgroundColor: 'rgba(193,247,107,0.12)', border: '1px solid rgba(193,247,107,0.25)' }}>
              PRO
            </span>
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>A tua loja, simples.</p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              E-mail ou Usuário de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="text" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.co.mz"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#27AE60'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Senha de Acesso</label>
              <Link to="/forgot-password" className="text-[11px] hover:underline" style={{ color: 'var(--color-brand-support)' }}>
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type={showPassword ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full text-xs pl-10 pr-10 py-3 rounded-xl focus:outline-none transition-colors font-mono"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#27AE60'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="remember" checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#27AE60' }} />
            <label htmlFor="remember" className="text-xs cursor-pointer select-none" style={{ color: 'var(--color-text-secondary)' }}>
              Lembrar deste dispositivo
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
            {isLoading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="hover:underline font-bold" style={{ color: 'var(--color-brand-support)' }}>
              Criar Loja Grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Footer credit */}
      <div className="mt-8 text-center text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        Desenvolvido por{' '}
        <a
          href="https://onixagence.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Onix Agence
        </a>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(39,174,96,0.15)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.3)' }}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Autenticação WhatsApp</h3>
                <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Verificação em Duas Etapas</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Enviamos um código de 6 dígitos para o seu WhatsApp. Insira abaixo:
            </p>
            <form onSubmit={handleVerify2FA} className="space-y-3">
              <input type="text" required maxLength={6} value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-lg font-mono font-bold tracking-widest py-3 rounded-xl focus:outline-none"
                style={{ backgroundColor: 'var(--color-surface-input)', color: 'var(--color-text-primary)', border: '1px solid #27AE60' }} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--color-surface-input)', color: 'var(--color-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={twoFactorCode.length !== 6 || isLoading}
                  className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-brand-support)' }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
