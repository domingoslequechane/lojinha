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
    <div className="w-full min-h-screen bg-[#091E19] text-[#FDFEF8] font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-[#C1F76B]/30 selection:text-[#FDFEF8]">
      {/* ── 1. Floating Header (Matching Landing Page Navbar) ── */}
      <header className="fixed top-2.5 sm:top-5 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-5xl z-50 transition-all duration-300">
        <div className="w-full px-4 sm:px-6 py-3 rounded-2xl sm:rounded-3xl bg-[#0F2D26]/85 backdrop-blur-md border border-[#235447] shadow-xl flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 select-none group">
            <div className="w-8 h-8 rounded-xl bg-[#14382F] border border-[#235447] flex items-center justify-center p-1 transition-transform group-hover:scale-105">
              <img src="/sidebar-icon.png" alt="Lojinha" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-baloo font-bold text-xl text-[#FDFEF8] leading-none">
                Loj<span className="text-[#C1F76B]">inha</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide font-sans bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30">
                PRO
              </span>
            </div>
          </Link>

          {/* Navigation Action */}
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] px-3 py-1.5 rounded-xl border border-transparent hover:border-[#235447] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Cadastro</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Main Verification Content ── */}
      <main className="w-full flex-1 flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16 px-4 relative">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C1F76B]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-16 -right-20 w-72 h-72 bg-[#27AE60]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-[#0F2D26] border border-[#235447] p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl bg-[#14382F] border border-[#235447] text-[#C1F76B]">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#FDFEF8]">Confirmar E-mail</h1>
            <p className="text-xs mt-1.5 leading-relaxed text-[#95BDB0]">
              Digite o código de 6 dígitos enviado para:<br />
              <strong className="text-[#FDFEF8]">{displayEmail}</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in bg-red-500/10 border border-red-500/25">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 p-3 rounded-xl text-[#C1F76B] text-xs flex items-center gap-2 animate-in fade-in bg-[#C1F76B]/10 border border-[#C1F76B]/25">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#C1F76B]" />
              <span>Novo código enviado com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-bold font-mono rounded-xl focus:outline-none transition-all duration-150 ${
                    digit
                      ? 'bg-[#14382F] text-[#FDFEF8] border border-[#C1F76B] ring-2 ring-[#C1F76B]/20'
                      : 'bg-[#14382F] text-[#95BDB0] border border-[#235447]'
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || digits.join('').length !== 6}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[#C1F76B] text-[#0F2D26]"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirmar Código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center space-y-3">
            <div className="text-xs text-[#95BDB0]">
              Não recebeu o código?{' '}
              {resendCooldown > 0 ? (
                <span>
                  Reenviar em <strong className="font-mono text-[#FDFEF8]">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold cursor-pointer inline-flex items-center gap-1.5 hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-all text-[#C1F76B]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Reenviando...' : 'Reenviar código'}</span>
                </button>
              )}
            </div>
            <div className="pt-3 border-t border-[#235447]">
              <Link
                to="/register"
                className="text-xs inline-flex items-center gap-1.5 text-[#95BDB0] hover:text-[#FDFEF8] transition-colors hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar e corrigir dados</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. Footer ── */}
      <footer className="w-full border-t border-[#235447]/60 py-6 px-4 bg-[#0B241D]/80 backdrop-blur-xs relative z-10 text-center">
        <p className="text-[11px] text-[#95BDB0]">
          © {new Date().getFullYear()} Lojinha. Plataforma de Vendas e Atendimento para WhatsApp.
        </p>
      </footer>
    </div>
  );
};
