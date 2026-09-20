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

  const inputClass = "w-full text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-colors bg-[#14382F] text-[#FDFEF8] placeholder-[#95BDB0] border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/30";

  return (
    <div className="w-full min-h-screen bg-[#091E19] text-[#FDFEF8] font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-[#C1F76B]/30 selection:text-[#FDFEF8]">
      {/* ── 1. Floating Header ── */}
      <header className="fixed top-2.5 sm:top-5 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-5xl z-50 transition-all duration-300">
        <div className="w-full px-4 sm:px-6 py-3 rounded-2xl sm:rounded-3xl bg-[#0F2D26]/85 backdrop-blur-md border border-[#235447] shadow-xl flex items-center justify-between">
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

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] px-3 py-1.5 rounded-xl border border-transparent hover:border-[#235447] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Login</span>
          </Link>
        </div>
      </header>

      {/* ── 2. Main Content ── */}
      <main className="w-full flex-1 flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16 px-4 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C1F76B]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-16 -right-20 w-72 h-72 bg-[#27AE60]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-[#0F2D26] border border-[#235447] p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl bg-[#14382F] border border-[#235447] text-[#C1F76B]">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#FDFEF8]">Recuperar Senha</h1>
            <p className="text-xs mt-1 leading-relaxed text-[#95BDB0]">
              {step === 'request'
                ? 'Insira seu e-mail para receber o código de recuperação'
                : `Digite o código de 6 dígitos enviado para ${email}`}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in bg-red-500/10 border border-red-500/25">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && step === 'reset' && (
            <div className="mb-4 p-3 rounded-xl text-[#C1F76B] text-xs flex items-center gap-2 animate-in fade-in bg-[#C1F76B]/10 border border-[#C1F76B]/25">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#C1F76B]" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-[#95BDB0]">
                  E-mail Cadastrado na Conta *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-[#C1F76B] text-[#0F2D26]"
              >
                {isLoading
                  ? <span className="inline-block w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
                  : <><span>Enviar E-mail de Recuperação</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Código de 6 Dígitos *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className={`w-full text-center text-base tracking-widest font-mono font-bold py-2.5 rounded-xl focus:outline-none transition-colors bg-[#14382F] text-[#FDFEF8] placeholder-[#95BDB0] border focus:ring-1 focus:ring-[#C1F76B]/30 ${
                    code.length === 6 ? 'border-[#C1F76B]' : 'border-[#235447]'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Nova Senha *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-9 py-3 rounded-xl focus:outline-none transition-colors bg-[#14382F] text-[#FDFEF8] placeholder-[#95BDB0] border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#95BDB0] hover:text-[#FDFEF8] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Confirmar Nova Senha *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3 py-3 rounded-xl focus:outline-none transition-colors bg-[#14382F] text-[#FDFEF8] placeholder-[#95BDB0] border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/30 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-[#C1F76B] text-[#0F2D26]"
              >
                {isLoading
                  ? <span className="inline-block w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
                  : <><span>Redefinir Senha & Entrar</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 text-center border-t border-[#235447]">
            <Link
              to="/login"
              className="text-xs inline-flex items-center gap-1.5 text-[#95BDB0] hover:text-[#FDFEF8] transition-colors hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lembrou a senha? Fazer Login</span>
            </Link>
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

