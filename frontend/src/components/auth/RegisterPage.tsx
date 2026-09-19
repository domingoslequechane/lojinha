import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { startRegistration, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (password !== confirmPassword) { setErrorMessage('A senha e a confirmação não coincidem.'); return; }
    if (password.length < 8) { setErrorMessage('A senha deve ter no mínimo 8 caracteres.'); return; }
    const result = await startRegistration({ name, email, password });
    if (result.success) navigate('/verify-email');
    else setErrorMessage(result.error || 'Falha ao iniciar cadastro.');
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#27AE60';
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = 'var(--color-border)';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden select-none"
      style={{ backgroundColor: 'var(--color-surface-base)', color: 'var(--color-text-primary)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(193,247,107,0.06)' }} />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(39,174,96,0.05)' }} />

      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #27AE60, #C1F76B)', color: '#0F2D26' }}>
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Criar Sua Conta</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Cadastre-se e comece a vender pelo WhatsApp
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Carlos Sitoe"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>E-mail de Acesso *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Senha (mín. 8 caracteres) *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full text-xs pl-8 pr-8 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="p-1 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Confirmar *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-3"
            style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
            {isLoading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Avançar para Verificação</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Já possui uma conta?{' '}
            <Link to="/login" className="hover:underline font-bold" style={{ color: 'var(--color-brand-support)' }}>Fazer Login</Link>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs max-w-md text-center"
        style={{ color: 'var(--color-text-secondary)' }}>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Verificação em 2 Passos
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Loja configurada a seguir
        </span>
      </div>
    </div>
  );
};
