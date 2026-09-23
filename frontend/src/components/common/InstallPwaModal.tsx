import React from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  Bell, 
  Zap, 
  CheckCircle2, 
  MoreVertical,
  Layers
} from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIos, install } = usePwaInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-left animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#14382F] border border-[#235447] flex items-center justify-center p-2 shadow-inner flex-shrink-0">
              <img src="/sidebar-icon.png" alt="Lojinha" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FDFEF8] leading-tight">
                Instalar Aplicativo Lojinha
              </h3>
              <p className="text-xs text-[#95BDB0] mt-0.5">
                Acesse sua loja direto da tela inicial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] border border-transparent hover:border-[#235447] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status / Main Action */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-[#C1F76B]/10 border border-[#C1F76B]/30 flex items-center gap-3 text-[#C1F76B]">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Aplicativo Já Instalado!</p>
              <p className="text-[11px] text-[#D1EAE0] mt-0.5">
                O Lojinha já está configurado no seu dispositivo.
              </p>
            </div>
          </div>
        ) : canInstall ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#C1F76B]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Instalar Aplicativo Agora</span>
            </button>
            <p className="text-[11px] text-center text-[#95BDB0]">
              Clique no botão acima para adicionar o app ao seu celular ou computador.
            </p>
          </div>
        ) : isIos ? (
          /* iOS Step-by-Step Instructions */
          <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FDFEF8]">
              <Smartphone className="w-4 h-4 text-[#C1F76B]" />
              <span>Como instalar no iPhone / iPad (Safari):</span>
            </div>
            <ol className="space-y-2.5 text-xs text-[#D1EAE0]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F2D26] border border-[#235447] text-[#C1F76B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  No Safari, toque no botão <strong>Compartilhar</strong> (ícone <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> na barra inferior).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F2D26] border border-[#235447] text-[#C1F76B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role a lista para baixo e toque em <strong className="text-[#C1F76B]">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#C1F76B]" />).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F2D26] border border-[#235447] text-[#C1F76B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          /* Android / Desktop Manual Guide */
          <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FDFEF8]">
              <MoreVertical className="w-4 h-4 text-[#C1F76B]" />
              <span>Como instalar no navegador:</span>
            </div>
            <ol className="space-y-2.5 text-xs text-[#D1EAE0]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F2D26] border border-[#235447] text-[#C1F76B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Abra o menu do navegador (três pontinhos <MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-[#C1F76B]" /> no canto superior).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F2D26] border border-[#235447] text-[#C1F76B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Selecione <strong className="text-[#C1F76B]">"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#235447]/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#95BDB0]">
            Vantagens do Aplicativo:
          </p>
          <div className="flex items-center gap-2.5 text-xs text-[#D1EAE0]">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Acesso instantâneo em 1 toque sem digitar o endereço</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#D1EAE0]">
            <Bell className="w-4 h-4 text-[#C1F76B] flex-shrink-0" />
            <span>Receba notificações Push mesmo com o aplicativo fechado</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#D1EAE0]">
            <Layers className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span>Experiência em tela cheia sem barras de navegação</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] bg-[#14382F] hover:bg-[#184339] border border-[#235447] transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
