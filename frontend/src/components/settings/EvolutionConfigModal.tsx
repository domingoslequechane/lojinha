import React, { useState } from 'react';
import { Settings, Wifi, QrCode, CheckCircle2, X, Key, Globe, Server, Copy } from 'lucide-react';

interface EvolutionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvolutionConfigModal: React.FC<EvolutionConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [apiUrl, setApiUrl] = useState('https://evolution.meuservidor.com');
  const [apiKey, setApiKey] = useState('B6D711FCDE4D4FD5936544120E713976');
  const [instanceName, setInstanceName] = useState('lojinha-vendas');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('connected');
  const [showQr, setShowQr] = useState(false);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setConnectionStatus('connected');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/20 text-[#C1F76B] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Configuração Evolution API</h3>
              <p className="text-xs text-[#95BDB0]">Integração do seu WhatsApp pessoal ou comercial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status banner */}
          <div className="p-3 rounded-2xl bg-[#14382F] border border-[#2D6B5A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#C1F76B] animate-ping" />
              <div>
                <p className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1">
                  Status: Conectado à Evolution API
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C1F76B]" />
                </p>
                <p className="text-[11px] text-[#95BDB0]">Instância ativa no WhatsApp: +258 84 000 0000</p>
              </div>
            </div>
            <button
              onClick={() => setShowQr(!showQr)}
              className="px-3 py-1.5 rounded-xl bg-[#0F2D26] hover:bg-[#2D6B5A] text-xs text-[#C1F76B] border border-[#2D6B5A] flex items-center gap-1.5 font-medium transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Ocultar QR' : 'Ver QR Code'}</span>
            </button>
          </div>

          {showQr && (
            <div className="p-4 rounded-2xl bg-[#0B241D] border border-[#235447] flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="w-44 h-44 bg-white p-3 rounded-xl shadow-md mb-2 flex items-center justify-center">
                {/* Simulated QR Code illustration */}
                <div className="w-full h-full border-4 border-black p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-black"></div>
                    <div className="w-8 h-8 bg-black"></div>
                  </div>
                  <div className="flex justify-center items-center">
                    <span className="font-mono text-[10px] font-bold text-black tracking-widest">
                      EVOLUTION
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-black"></div>
                    <div className="w-4 h-4 bg-black"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-[#FDFEF8]">Instância já pareada!</p>
              <p className="text-[11px] text-[#95BDB0]">
                Para trocar de número, desconecte no WhatsApp do telemóvel.
              </p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                URL da sua Evolution API
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.seuservidor.com"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] pl-9 pr-3 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Chave Global (API Key)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Sua API Key do .env da Evolution"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] pl-9 pr-3 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Nome da Instância
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: lojinha-vendas"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#14382F] hover:bg-[#2D6B5A] text-[#FDFEF8] border border-[#2D6B5A] transition-all flex items-center gap-1.5"
          >
            <Wifi className="w-3.5 h-3.5 text-[#C1F76B]" />
            <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20 transition-all"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

