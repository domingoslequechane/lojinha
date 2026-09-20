import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft,
  Zap,
  CheckCircle2
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
    if (password !== confirmPassword) {
      setErrorMessage('A senha e a confirmação não coincidem.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    const result = await startRegistration({ name, email, password });
    if (result.success) {
      navigate('/verify-email');
    } else {
      setErrorMessage(result.error || 'Falha ao iniciar cadastro. Tente novamente.');
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
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-[#D1EAE0] hover:text-[#FDFEF8] bg-[#14382F] border border-[#235447] hover:border-[#C1F76B]/40 transition-all cursor-pointer"
            >
              <span>Já tenho conta</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Main Register Section ── */}
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
              <span>Criar Conta</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FDFEF8] tracking-tight">
              Criar Sua Loja
            </h1>

            <p className="text-xs text-[#95BDB0] leading-relaxed max-w-xs mx-auto">
              Cadastre-se para começar a gerenciar e fechar vendas no WhatsApp hoje mesmo.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1EAE0] block">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Sitoe"
                  className="w-full h-11 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-10 pr-4 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1EAE0] block">
                E-mail de Acesso *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full h-11 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-10 pr-4 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Passwords (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#D1EAE0] block">
                  Senha (mín. 8) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-[#14382F] text-xs text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-9 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#95BDB0] hover:text-[#FDFEF8] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#D1EAE0] block">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-[#14382F] text-xs text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-3 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-sm font-extrabold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 shadow-lg shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar Conta</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Guarantees */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#95BDB0]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C1F76B]" />
            <span>Sem fidelidade • Cancele quando quiser</span>
          </div>

          {/* Card Footer */}
          <div className="pt-4 border-t border-[#235447]/60 text-center">
            <p className="text-xs text-[#95BDB0]">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-bold text-[#C1F76B] hover:text-[#C1F76B]/80 hover:underline transition-colors"
              >
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── 3. Mini Footer ── */}
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
    </div>
  );
};
