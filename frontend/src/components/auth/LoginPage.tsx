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
  ShieldCheck, 
  Sparkles, 
  ArrowLeft,
  Zap,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verifyWhatsApp2FA, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha o e-mail e a senha de acesso.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

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
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Erro inesperado ao verificar credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying2FA) return;
    setErrorMessage(null);
    setIsVerifying2FA(true);
    try {
      const result = await verifyWhatsApp2FA(twoFactorCode);
      if (result.success) {
        setShow2FAModal(false);
        navigate('/cockpit', { replace: true });
      } else {
        setErrorMessage(result.error || 'Código 2FA incorreto ou expirado.');
      }
    } catch (err: any) {
      console.error('2FA error:', err);
      setErrorMessage(err?.message || 'Erro ao verificar código de autenticação.');
    } finally {
      setIsVerifying2FA(false);
    }
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
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] px-3 py-1.5 rounded-xl border border-transparent hover:border-[#235447] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Site</span>
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 transition-all shadow-md shadow-[#C1F76B]/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-[#0F2D26]" />
              <span>Criar Loja Grátis</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Main Login Section ── */}
      <main className="w-full flex-1 flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16 px-4 relative">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C1F76B]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-16 -right-20 w-72 h-72 bg-[#27AE60]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-16 -left-20 w-72 h-72 bg-[#38BDF8]/05 rounded-full blur-[120px] pointer-events-none" />

        {/* Card Container */}
        <div className="w-full max-w-md rounded-3xl bg-[#0F2D26] border border-[#235447] p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 animate-in fade-in zoom-in-95 duration-200 space-y-6">
          {/* Header Title & Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14382F] border border-[#C1F76B]/30 text-[11px] font-bold text-[#C1F76B] shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>Acesso à Lojinha</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FDFEF8] tracking-tight">
              Bem-vindo de volta
            </h1>

            <p className="text-xs text-[#95BDB0] leading-relaxed max-w-xs mx-auto">
              Entre com suas credenciais para gerenciar suas vendas e clientes no WhatsApp.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start justify-between gap-3 shadow-lg shadow-red-950/50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200 p-0.5 rounded-md transition-colors"
                title="Fechar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1EAE0] block">
                E-mail ou Usuário de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="seu.email@exemplo.com"
                  className={`w-full h-11 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-10 pr-4 rounded-xl border focus:outline-none transition-all ${
                    errorMessage
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#D1EAE0]">
                  Senha de Acesso
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#C1F76B] hover:text-[#C1F76B]/80 hover:underline transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full h-11 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-10 pr-10 rounded-xl border font-mono focus:outline-none transition-all ${
                    errorMessage
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 absolute right-2 top-1/2 -translate-y-1/2 text-[#95BDB0] hover:text-[#FDFEF8] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#14382F] border-[#235447] text-[#C1F76B] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#C1F76B]"
              />
              <label
                htmlFor="remember"
                className="text-xs text-[#95BDB0] hover:text-[#FDFEF8] cursor-pointer select-none"
              >
                Lembrar deste dispositivo
              </label>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-12 rounded-xl text-sm font-extrabold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-lg shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-3"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Verificando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Lojinha</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Card Bottom Link */}
          <div className="pt-4 border-t border-[#235447]/60 text-center">
            <p className="text-xs text-[#95BDB0]">
              Ainda não tem uma conta?{' '}
              <Link
                to="/register"
                className="font-bold text-[#C1F76B] hover:text-[#C1F76B]/80 hover:underline transition-colors"
              >
                Criar Loja Grátis
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── 3. Mini Footer (Institutional Credit) ── */}
      <footer className="w-full py-6 text-center text-xs text-[#578577] border-t border-[#235447]/40">
        <p>
          &copy; {new Date().getFullYear()} Loginha. Desenvolvido por{' '}
          <a
            href="https://onixagence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#95BDB0] hover:text-[#C1F76B] transition-colors"
          >
            Onix Agence
          </a>
        </p>
      </footer>

      {/* ── 4. WhatsApp 2FA Modal ── */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="rounded-3xl max-w-sm w-full p-6 bg-[#0F2D26] border border-[#235447] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#27AE60]/20 border border-[#27AE60]/40 flex items-center justify-center text-[#C1F76B]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FDFEF8]">Autenticação WhatsApp</h3>
                <p className="text-[11px] text-[#95BDB0]">Verificação em Duas Etapas</p>
              </div>
            </div>

            <p className="text-xs text-[#95BDB0] leading-relaxed">
              Enviamos um código de 6 dígitos para o seu WhatsApp cadastrado. Insira abaixo para prosseguir:
            </p>

            <form onSubmit={handleVerify2FA} className="space-y-3.5">
              <input
                type="text"
                required
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-xl font-mono font-bold tracking-widest py-3 rounded-xl bg-[#14382F] text-[#FDFEF8] border border-[#C1F76B] focus:outline-none focus:ring-1 focus:ring-[#C1F76B]"
              />

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] border border-[#235447] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={twoFactorCode.length !== 6 || isVerifying2FA}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] disabled:opacity-50 cursor-pointer shadow-md shadow-[#C1F76B]/20 flex items-center justify-center gap-2"
                >
                  {isVerifying2FA ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <span>Confirmar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
