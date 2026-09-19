import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MailCheck, ArrowRight, AlertCircle, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { pendingRegistration, verifyEmailCode, resendEmailCode, isLoading } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const displayEmail = pendingRegistration?.email || 'seu.email@exemplo.com';

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => { if (i < 6) newDigits[i] = d; });
      setDigits(newDigits);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const clean = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const fullCode = digits.join('');
    if (fullCode.length !== 6) { setErrorMessage('Por favor, digite todos os 6 dígitos.'); return; }
    const result = await verifyEmailCode(fullCode);
    if (result.success) navigate('/onboarding');
    else setErrorMessage(result.error || 'Código inválido. Tente novamente.');
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setErrorMessage(null);
    setIsResending(true);
    try {
      const [result] = await Promise.all([
        resendEmailCode(),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
      if (result.success) {
        setResendSuccess(true);
        setResendCooldown(60);
        setTimeout(() => setResendSuccess(false), 4000);
      } else {
        setErrorMessage(result.error || 'Não foi possível reenviar o código. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao reenviar o código.');
    } finally {
      setIsResending(false);
    }
  };

  const activeDigitStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid #27AE60',
    boxShadow: '0 0 0 2px rgba(39,174,96,0.2)',
  };
  const idleDigitStyle = {
    backgroundColor: 'var(--color-surface-input)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden select-none"
      style={{ backgroundColor: 'var(--color-surface-base)', color: 'var(--color-text-primary)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(193,247,107,0.06)' }} />

      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #27AE60, #C1F76B)', color: '#0F2D26' }}>
            <MailCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Confirmar E-mail</h1>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Digite o código de 6 dígitos enviado para:<br />
            <strong style={{ color: 'var(--color-text-primary)' }}>{displayEmail}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="mb-4 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in"
            style={{ backgroundColor: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.25)' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Novo código enviado com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text" inputMode="numeric" maxLength={6} value={digit}
                onChange={e => handleDigitChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-bold font-mono rounded-xl focus:outline-none transition-all duration-150"
                style={digit ? activeDigitStyle : idleDigitStyle} />
            ))}
          </div>

          <button type="submit" disabled={isLoading || digits.join('').length !== 6}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-brand-support)', color: '#fff' }}>
            {isLoading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Confirmar Código</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Não recebeu o código?{' '}
            {resendCooldown > 0
              ? <span>Reenviar em <strong className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{resendCooldown}s</strong></span>
              : <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold cursor-pointer inline-flex items-center gap-1.5 hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  style={{ color: 'var(--color-brand-support)' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Reenviando...' : 'Reenviar código'}</span>
                </button>}
          </div>
          <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link to="/register" className="text-xs inline-flex items-center gap-1.5 transition-colors hover:underline"
              style={{ color: 'var(--color-text-secondary)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /><span>Voltar e corrigir dados</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
