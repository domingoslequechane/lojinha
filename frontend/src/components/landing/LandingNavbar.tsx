import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard, 
  LogIn, 
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'Planos', href: '#planos' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-6xl z-50 transition-all duration-300">
      <div 
        className={`w-full px-4 sm:px-6 py-3 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex items-center justify-between shadow-xl ${
          isScrolled 
            ? 'bg-[#0F2D26]/90 backdrop-blur-md border-[#235447] shadow-2xl' 
            : 'bg-[#0F2D26]/75 backdrop-blur-md border-[#235447]/60'
        }`}
      >
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

        {/* Desktop Menu Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleScrollToSection(e, link.href)}
              className="text-xs font-medium text-[#95BDB0] hover:text-[#C1F76B] transition-colors py-1 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              to="/cockpit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 transition-all shadow-md shadow-[#C1F76B]/20 hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
              <span>Meu Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-[#D1EAE0] hover:text-[#FDFEF8] hover:bg-[#14382F] rounded-xl border border-transparent hover:border-[#235447] transition-all cursor-pointer"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#C1F76B]/90 transition-all shadow-md shadow-[#C1F76B]/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-[#0F2D26]" />
                <span>Começar Grátis</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/cockpit"
              className="p-2 rounded-xl bg-[#C1F76B] text-[#0F2D26] text-xs font-bold"
              title="Ir para o Cockpit"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-2.5 py-1.5 text-xs font-semibold text-[#D1EAE0] bg-[#14382F] rounded-xl border border-[#235447]"
            >
              Entrar
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] bg-[#14382F] border border-[#235447] cursor-pointer"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl bg-[#0F2D26] border border-[#235447] shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col gap-1 pb-2 border-b border-[#235447]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleScrollToSection(e, link.href)}
                className="px-3 py-2 text-xs font-medium text-[#95BDB0] hover:text-[#C1F76B] hover:bg-[#14382F] rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {isAuthenticated ? (
              <Link
                to="/cockpit"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] flex items-center justify-center gap-2 shadow-md shadow-[#C1F76B]/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Acessar Meu Cockpit</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] flex items-center justify-center gap-2 shadow-md shadow-[#C1F76B]/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar Loja Grátis</span>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-medium text-[#FDFEF8] bg-[#14382F] border border-[#235447] flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#95BDB0]" />
                  <span>Já tenho uma conta</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
