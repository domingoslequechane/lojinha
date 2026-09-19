import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendPasswordRecovery, resetPasswordWithCode, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = await sendPasswordRecovery(email);
    if (result.success) { setStep('reset'); setSuccessMessage(`Código enviado para ${email}`); }
    else setErrorMessage(result.error || 'Falha ao enviar e-mail de recuperação.');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword !== confirmPassword) { setErrorMessage('As senhas não coincidem.'); return; }
    if (newPassword.length < 8) { setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    const result = await resetPasswordWithCode(email, code, newPassword);
    if (result.success) navigate('/login');
    else setErrorMessage(result.error || 'Código incorreto ou expirado.');
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#27AE60';
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = 'var(--color-border)';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-base)', color: 'var(--color-text-primary)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(193,247,107,0.06)' }} />

      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #27AE60, #C1F76B)', color: '#0F2D26' }}>
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Recuperar Senha</h1>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {step === 'request'
              ? 'Insira seu e-mail para receber o código de recuperação'
              : `Digite o código de 6 dígitos enviado para ${email}`}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && step === 'reset' && (
          <div className="mb-4 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.25)' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestRecovery} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                E-mail Cadastrado na Conta *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-colors"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
              {isLoading
                ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Enviar E-mail de Recuperação</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5">

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Código de 6 Dígitos *
              </label>
              <input type="text" required maxLength={6} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456"
                className="w-full text-center text-base tracking-widest font-mono font-bold py-2.5 rounded-xl focus:outline-none"
                style={{ ...inputStyle, borderColor: code.length === 6 ? '#27AE60' : 'var(--color-border)' }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nova Senha *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl focus:outline-none font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="p-1 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Confirmar Nova Senha *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <button type="submit" disabled={isLoading || code.length !== 6}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
              {isLoading
                ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Redefinir Senha & Entrar</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Link to="/login" className="text-xs inline-flex items-center gap-1.5 transition-colors hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /><span>Lembrou a senha? Fazer Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
