import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUp, 
  Heart, 
  MessageCircle, 
  ShieldCheck, 
  Zap, 
  ExternalLink 
} from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <footer className="w-full bg-[#081915] text-[#95BDB0] border-t border-[#235447]/60 pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#235447]/50">
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-[#14382F] border border-[#235447] flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
                  <img src="/sidebar-icon.png" alt="Lojinha" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-baloo font-bold text-2xl text-[#FDFEF8] leading-none">
                    Loj<span className="text-[#C1F76B]">inha</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide font-sans bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30">
                    PRO
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-[#95BDB0] leading-relaxed max-w-sm">
                O Cockpit de Vendas e CRM inteligente no WhatsApp feito para lojistas e agências fecharem mais vendas todos os dias sem perder nenhum cliente.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#C1F76B]">
                <ShieldCheck className="w-4 h-4 text-[#C1F76B]" />
                <span className="font-medium">Infraestrutura Segura • Dados Criptografados</span>
              </div>
            </div>

            {/* Col 3: Navegação */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FDFEF8]">Navegação</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#recursos" onClick={(e) => handleScrollToSection(e, '#recursos')} className="hover:text-[#C1F76B] transition-colors">
                    Recursos & Módulos
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" onClick={(e) => handleScrollToSection(e, '#como-funciona')} className="hover:text-[#C1F76B] transition-colors">
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#depoimentos" onClick={(e) => handleScrollToSection(e, '#depoimentos')} className="hover:text-[#C1F76B] transition-colors">
                    Histórias de Sucesso
                  </a>
                </li>
                <li>
                  <a href="#planos" onClick={(e) => handleScrollToSection(e, '#planos')} className="hover:text-[#C1F76B] transition-colors">
                    Planos & Preços
                  </a>
                </li>
                <li>
                  <a href="#faq" onClick={(e) => handleScrollToSection(e, '#faq')} className="hover:text-[#C1F76B] transition-colors">
                    Perguntas Frequentes
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Plataforma */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FDFEF8]">Acesso Rápido</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/register" className="hover:text-[#C1F76B] transition-colors flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#C1F76B]" />
                    <span>Criar Loja Grátis</span>
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#C1F76B] transition-colors">
                    Acessar Cockpit
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="hover:text-[#C1F76B] transition-colors">
                    Recuperar Senha
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: Suporte & Contato */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FDFEF8]">Suporte Direto</p>
              <p className="text-xs text-[#95BDB0]">
                Dúvidas sobre o funcionamento ou implementação na sua loja?
              </p>
              <a
                href="https://wa.me/258840000000?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Loginha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14382F] hover:bg-[#184339] text-[#C1F76B] border border-[#235447] text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Comercial</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Credits */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-center sm:text-left text-[#578577]">
              &copy; {new Date().getFullYear()} Loginha. Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-1 text-[#95BDB0]">
              <span>Desenvolvido com</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block animate-pulse" />
              <span>por</span>
              <a
                href="https://onixagence.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#FDFEF8] hover:text-[#C1F76B] transition-colors ml-1"
              >
                Onix Agence
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-[#C1F76B] text-[#0F2D26] shadow-xl shadow-[#C1F76B]/25 hover:bg-[#C1F76B]/90 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-in fade-in zoom-in-90"
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </>
  );
};
