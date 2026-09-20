import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const inputClass = "w-full text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors bg-[#14382F] text-[#FDFEF8] placeholder-[#95BDB0] border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/30";

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

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C1F76B]/10 border border-[#C1F76B]/25 text-[11px] font-bold text-[#C1F76B]">
            <Sparkles className="w-3 h-3" />
            Configuração Inicial
          </div>
        </div>
      </header>

      {/* ── 2. Main Content ── */}
      <main className="w-full flex-1 flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16 px-4 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C1F76B]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-16 -right-20 w-72 h-72 bg-[#27AE60]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-[#0F2D26] border border-[#235447] p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-xl bg-[#14382F] border border-[#235447] text-[#C1F76B]">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#FDFEF8]">Personalize Sua Loja</h1>
            <p className="text-xs mt-1 text-[#95BDB0]">
              Defina a identidade e configure a segurança
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in bg-red-500/10 border border-red-500/25">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store Name */}
            <div>
              <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Nome da Loja *</label>
              <div className="relative">
                <ShoppingBag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Minha Loja"
                  className={inputClass + " font-medium"}
                />
              </div>
            </div>

            {/* Slogan */}
            <div>
              <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Slogan / Ramo de Atuação</label>
              <div className="relative">
                <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Loja Oficial WhatsApp"
                  className={inputClass}
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-xs font-semibold block mb-1 text-[#95BDB0]">Cidade / Região (Opcional)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#95BDB0]" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Sua Cidade ou País"
                  className={inputClass}
                />
              </div>
            </div>

            {/* 2FA Section */}
            <div className="p-3.5 rounded-2xl space-y-2.5 mt-2 bg-[#14382F] border border-[#235447]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#C1F76B]/15 text-[#C1F76B]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1">
                      2FA via WhatsApp
                      <span className="text-[10px] font-normal text-[#95BDB0]">(Opcional)</span>
                    </h3>
                    <p className="text-[10px] leading-tight text-[#95BDB0]">
                      Proteja o acesso com código no WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnable2FA(!enable2FA)}
                  className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                  style={{ backgroundColor: enable2FA ? '#C1F76B' : '#235447' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-[#0F2D26] transition duration-200 ${enable2FA ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {enable2FA && (
                <div className="pt-2 animate-in fade-in duration-150 border-t border-[#235447]">
                  <label className="text-[10px] font-semibold block mb-1 text-[#95BDB0]">
                    Número WhatsApp para código 2FA:
                  </label>
                  <input
                    type="tel"
                    required={enable2FA}
                    value={twoFactorPhone}
                    onChange={(e) => setTwoFactorPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none font-mono bg-[#0F2D26] text-[#FDFEF8] placeholder-[#95BDB0] border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/30"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 bg-[#C1F76B] text-[#0F2D26]"
            >
              {isLoading
                ? <span className="inline-block w-4 h-4 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
                : <><span>Concluir & Abrir a Lojinha</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-4 text-center space-y-3">
            <p className="text-[11px] text-[#95BDB0]">
              Você poderá alterar estes dados em <strong className="text-[#FDFEF8]">Minha Loja</strong> e <strong className="text-[#FDFEF8]">Minha Conta</strong>.
            </p>
            <button
              type="button"
              onClick={() => { logout?.(); navigate('/login'); }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 hover:opacity-80 cursor-pointer text-[#95BDB0] bg-white/5 border border-white/8 hover:text-[#FDFEF8]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair da conta
            </button>
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
