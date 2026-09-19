import React, { useState } from 'react';
import { 
  Wifi, 
  Plus, 
  QrCode, 
  Power, 
  PowerOff, 
  Trash2, 
  Smartphone, 
  Battery, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  RefreshCw, 
  Radio, 
  MessageSquare,
  Globe,
  Settings,
  ShieldCheck,
  SmartphoneNfc,
  X
} from 'lucide-react';
import { WhatsAppInstance, WhatsAppInstanceStatus } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { evolutionService } from '../../services/evolutionService';
import { supabase } from '../../lib/supabase';

interface WhatsAppInstancesViewProps {
  instances: WhatsAppInstance[];
  storeId?: string;
  onSaveInstances: (instances: WhatsAppInstance[]) => void;
  onSelectDefaultInstance: (instanceId: string) => void;
}

export const WhatsAppInstancesView: React.FC<WhatsAppInstancesViewProps> = ({
  instances,
  storeId,
  onSaveInstances,
  onSelectDefaultInstance,
}) => {
  const [instList, setInstList] = useState<WhatsAppInstance[]>([...instances]);
  const [selectedForQr, setSelectedForQr] = useState<WhatsAppInstance | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isNewInstanceModalOpen, setIsNewInstanceModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'code'>('qr');
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState('+258 8');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const [connectionSuccess, setConnectionSuccess] = useState<{ name: string; phone?: string } | null>(null);

  // Sync with prop updates from realtime
  React.useEffect(() => {
    setInstList([...instances]);
    if (selectedForQr && !connectionSuccess) {
      const live = instances.find((i) => i.id === selectedForQr.id);
      if (live && live.status === 'connected') {
        setConnectionSuccess({ name: live.name, phone: live.phone });
      }
    }
  }, [instances, selectedForQr, connectionSuccess]);

  // Initial fetch on mount — live updates happen purely via Supabase Realtime WebSocket (0 polling)
  React.useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const list = await evolutionService.getInstances(storeId || 'default');
        if (isMounted && list && list.length > 0) {
          setInstList(list);
          onSaveInstances(list);
        }
      } catch {}
    };

    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, [storeId, onSaveInstances]);


  // Custom confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    iconType?: 'trash' | 'logout' | 'alert' | 'power';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Watch Supabase Realtime for QR updates and Connection Success on the selected instance
  React.useEffect(() => {
    if (!selectedForQr) return;

    const channel = supabase
      .channel(`qr-watch-${selectedForQr.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_instances', filter: `id=eq.${selectedForQr.id}` },
        (payload: { new: Record<string, any> }) => {
          const row = payload.new;
          if (!row) return;

          // If reconnected successfully, transition immediately to Success Screen
          if (row.status === 'connected') {
            setConnectionSuccess({
              name: row.name || selectedForQr.name,
              phone: row.phone,
            });
            setIsQrLoading(false);
            setInstList((prev) =>
              prev.map((i) => (i.id === row.id ? { ...i, status: 'connected', phone: row.phone } : i))
            );
            return;
          }

          // If the QR just arrived in last_connected
          if (row?.last_connected && typeof row.last_connected === 'string' && row.last_connected.startsWith('{')) {
            try {
              const parsed = JSON.parse(row.last_connected);
              if (parsed.qr) {
                setQrBase64(parsed.qr);
                setIsQrLoading(false);
              }
            } catch {}
          }
        }
      )
      .subscribe();

    // Fast polling fallback every 2.5s while connection modal is open
    const pollTimer = window.setInterval(async () => {
      try {
        // 1. Check live connection status
        const list = await evolutionService.getInstances(storeId || 'default');
        const found = list.find((i) => i.id === selectedForQr.id);
        if (found && found.status === 'connected') {
          setConnectionSuccess({ name: found.name, phone: found.phone });
          setIsQrLoading(false);
          setInstList(list);
          onSaveInstances(list);
          return;
        }

        // 2. Fetch fresh live QR Code directly from Evolution GO
        const freshQr = await evolutionService.getQrCode(selectedForQr.id);
        if (freshQr?.qrcode) {
          setQrBase64(freshQr.qrcode);
          setIsQrLoading(false);
        }
      } catch {}
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [selectedForQr, storeId, onSaveInstances]);

  // Connect (Open QR Code) — triggers reconnect flow, QR returned directly
  const handleOpenConnect = async (inst: WhatsAppInstance) => {
    setSelectedForQr(inst);
    setConnectionSuccess(null);
    setPairingCode(null);
    setQrBase64(null);
    setIsQrLoading(true);

    // Backend polls for QR internally and returns it directly (up to 22s)
    const result = await evolutionService.reconnectInstance(inst.id);
    if (result?.connected) {
      // Reconnected directly from saved session
      setConnectionSuccess({ name: inst.name, phone: inst.phone });
      setIsQrLoading(false);
    } else if (result?.qrcode) {
      setQrBase64(result.qrcode);
      setIsQrLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!selectedForQr) return;
    setIsRefreshingQr(true);
    setQrBase64(null);
    setIsQrLoading(true);
    const result = await evolutionService.reconnectInstance(selectedForQr.id);
    if (result?.connected) {
      setConnectionSuccess({ name: selectedForQr.name, phone: selectedForQr.phone });
      setIsQrLoading(false);
    } else if (result?.qrcode) {
      setQrBase64(result.qrcode);
      setIsQrLoading(false);
    }
    setTimeout(() => setIsRefreshingQr(false), 500);
  };


  // Generate real Pairing Code from Evolution GO
  const handleGeneratePairingCode = async () => {
    if (!selectedForQr) return;
    setPairingError(null);
    try {
      const cleanPhone = pairingPhoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        setPairingError('Por favor digite um número válido com código do país (ex: +258 84 000 0000).');
        return;
      }
      const code = await evolutionService.getPairingCode(selectedForQr.id, pairingPhoneNumber);
      setPairingCode(code);
    } catch (err: any) {
      console.error('Failed to generate pairing code:', err);
      setPairingError(err?.message || 'Não foi possível gerar o código. Verifique se o telemóvel está correto.');
    }
  };

  // Create New Instance in Evolution GO and Supabase
  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || isCreatingInstance) return;

    setIsCreatingInstance(true);
    setCreateError(null);
    try {
      const newInst = await evolutionService.createInstance(storeId || 'default', newInstanceName.trim());
      const updated = [...instList, newInst];
      setInstList(updated);
      onSaveInstances(updated);
      setNewInstanceName('');
      setIsNewInstanceModalOpen(false);
      handleOpenConnect(newInst);
    } catch (err: any) {
      console.error('Failed to create instance:', err);
      setCreateError(
        err?.message ||
        'Não foi possível conectar ao servidor backend. Verifique se o backend está ativo e configurado corretamente.'
      );
    } finally {
      setIsCreatingInstance(false);
    }
  };



  // Toggle Power (Pausar / Retomar) com API real
  const handleTogglePower = async (id: string) => {
    const inst = instList.find((i) => i.id === id);
    if (!inst) return;

    // Retomar — estava pausada: abre o modal de conexão
    if (inst.status === 'paused' || inst.status === 'disconnected') {
      handleOpenConnect(inst);
      return;
    }

    // Pausar — solicita confirmação
    setConfirmModalState({
      isOpen: true,
      title: 'Pausar Instância WhatsApp',
      message: `Pausar "${inst.name}"? O envio e recebimento de mensagens serão suspensos. Pode retomar sem precisar de novo QR Code.`,
      confirmText: 'Pausar',
      cancelText: 'Cancelar',
      confirmVariant: 'warning',
      iconType: 'power',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        // Optimistic UI
        setInstList((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: 'paused' as WhatsAppInstanceStatus } : i))
        );
        await evolutionService.pauseInstance(id);
      },
    });
  };

  // Disconnect WhatsApp with custom modal
  const handleDisconnect = (id: string) => {
    const inst = instList.find((i) => i.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Desconectar WhatsApp',
      message: `Deseja desconectar o número de "${inst?.name || 'esta instância'}"? Será necessário ler o QR Code novamente para restabelecer a conexão.`,
      confirmText: 'Desconectar',
      cancelText: 'Cancelar',
      confirmVariant: 'danger',
      iconType: 'logout',
      onConfirm: async () => {
        try {
          await evolutionService.logoutInstance(storeId || 'default', id);
        } catch (err) {
          console.warn('Logout error:', err);
        }
        const updated = instList.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'disconnected' as WhatsAppInstanceStatus,
                phone: undefined,
                profilePic: undefined,
              }
            : i
        );
        setInstList(updated);
        onSaveInstances(updated);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete / Remove Instance with custom modal
  const handleDeleteInstance = (id: string) => {
    if (instList.length <= 1) {
      setConfirmModalState({
        isOpen: true,
        title: 'Ação não permitida',
        message: 'Você precisa manter pelo menos uma instância de WhatsApp configurada no seu cockpit.',
        confirmText: 'Entendi',
        cancelText: 'Fechar',
        confirmVariant: 'primary',
        iconType: 'alert',
        onConfirm: () => setConfirmModalState((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const inst = instList.find((i) => i.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Apagar Instância',
      message: `Tem certeza que deseja apagar "${inst?.name}"? Esta ação cancela a conexão e os registros na Evolution API.`,
      confirmText: 'Apagar Instância',
      cancelText: 'Cancelar',
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: async () => {
        try {
          await evolutionService.deleteInstance(storeId || 'default', id);
        } catch (err) {
          console.warn('Delete error:', err);
        }
        const updated = instList.filter((i) => i.id !== id);
        if (updated.length > 0 && !updated.some((i) => i.isDefault)) {
          updated[0].isDefault = true;
        }
        setInstList(updated);
        onSaveInstances(updated);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-6 bg-[#091E19] space-y-4 sm:space-y-6 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-[#C1F76B]" />
            Conectar WhatsApp
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1">
            Gerencie múltiplas contas e instâncias de WhatsApp conectadas à Evolution API
          </p>
        </div>

        <button
          onClick={() => setIsNewInstanceModalOpen(true)}
          className="px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-semibold shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Instância</span>
        </button>
      </div>

      {/* Evolution Server Status Bar */}
      <div className="p-4 rounded-2xl bg-[#0F2D26] border border-[#235447] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-[#FDFEF8]">Servidor Evolution API Online</p>
              <span className="w-2 h-2 rounded-full bg-[#C1F76B] animate-pulse" />
            </div>
            <p className="text-[11px] text-[#95BDB0] font-mono mt-0.5">
              https://evolution.meuservidor.co.mz • Instâncias ativas: {instList.filter((i) => i.status === 'connected').length} / {instList.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#95BDB0] bg-[#14382F] px-3 py-1.5 rounded-xl border border-[#2D6B5A]">
            Versão Baileys: v6.7.8 (QR & Pairing Code)
          </span>
        </div>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instList.map((inst) => {
          const isConnected = inst.status === 'connected';
          const isPaused = inst.status === 'paused';
          const isDisconnected = inst.status === 'disconnected';

          return (
            <div
              key={inst.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition-all bg-[#0F2D26] ${
                inst.isDefault
                  ? 'border-[#C1F76B] shadow-lg shadow-[#C1F76B]/10 ring-1 ring-[#C1F76B]'
                  : 'border-[#235447] hover:border-[#2D6B5A]'
              }`}
            >
              <div>
                {/* Header of Instance Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {inst.profilePic ? (
                        <img
                          src={inst.profilePic}
                          alt={inst.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#2D6B5A]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#14382F] flex items-center justify-center text-[#95BDB0] border border-[#2D6B5A]">
                          <Smartphone className="w-6 h-6" />
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-[#0F2D26] ${
                          isConnected
                            ? 'bg-[#C1F76B]'
                            : isPaused
                            ? 'bg-zinc-500'
                            : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#FDFEF8]">{inst.name}</h4>
                      </div>
                      <p className="text-xs text-[#95BDB0]">
                        {inst.phone || 'Sem número vinculado'}
                      </p>
                    </div>
                  </div>

                  {inst.isDefault && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C1F76B] bg-[#C1F76B]/15 border border-[#C1F76B]/30 px-2 py-0.5 rounded-md">
                      Padrão
                    </span>
                  )}
                </div>

                {/* Status Pill & Uptime */}
                <div className="p-3 bg-[#0B241D] rounded-2xl border border-[#235447]/60 mb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#95BDB0]">Status:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isConnected
                          ? 'text-[#C1F76B]'
                          : isPaused
                          ? 'text-zinc-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {isConnected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isPaused && <PowerOff className="w-3.5 h-3.5" />}
                      {isDisconnected && <AlertCircle className="w-3.5 h-3.5" />}
                      {isConnected ? 'Conectado / Online' : isPaused ? 'Desligado / Pausado' : 'Aguardando Conexão'}
                    </span>
                  </div>

                  {isConnected && (
                    <div className="flex items-center justify-between text-[11px] text-[#95BDB0] pt-1 border-t border-[#235447]/40">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3 h-3 text-[#C1F76B]" />
                        Bateria: {inst.batteryLevel || 90}%
                      </span>
                      <span>{inst.messagesToday} msgs hoje</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#95BDB0] pt-1 border-t border-[#235447]/40">
                    <span>Último sync:</span>
                    <span className="text-[#FDFEF8]">{inst.lastConnected}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-[#235447] space-y-2">
                {/* Connect / Disconnect button */}
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(inst.id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#14382F] hover:bg-red-500/20 hover:border-red-500/40 text-xs text-red-400 font-medium flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] cursor-pointer border border-red-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desconectar WhatsApp</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(inst)}
                    className="w-full py-2 px-3 rounded-xl bg-[#C1F76B] hover:bg-[#219653] hover:brightness-110 text-[#FDFEF8] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#C1F76B]/25 hover:shadow-[#C1F76B]/40 transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Conectar pelo Telemóvel</span>
                  </button>
                )}

                {/* Secondary Actions row: Toggle Power, Set Default, Delete */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleTogglePower(inst.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                      isPaused
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-[#14382F] border-[#2D6B5A] text-[#95BDB0] hover:text-[#FDFEF8] hover:border-[#95BDB0]/40'
                    }`}
                    title={isPaused ? "Ligar Instância" : "Desligar / Pausar Instância"}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isPaused ? 'Ligar' : 'Desligar'}</span>
                  </button>

                  {!inst.isDefault && isConnected && (
                    <button
                      onClick={() => onSelectDefaultInstance(inst.id)}
                      className="py-1.5 px-2.5 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] hover:border-[#C1F76B]/50 hover:text-[#C1F76B] text-xs text-[#95BDB0] border border-[#2D6B5A] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                      title="Usar como número principal no Cockpit"
                    >
                      Tornar Principal
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteInstance(inst.id)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Remover Instância"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code / Pairing Code Connection Modal */}
      {selectedForQr && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/20 text-[#C1F76B] flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#FDFEF8]">Conectar WhatsApp</h3>
                  <p className="text-xs text-[#95BDB0]">{selectedForQr.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedForQr(null)}
                className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {connectionSuccess ? (
              /* Success Screen */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#C1F76B]/20 border-2 border-[#C1F76B] flex items-center justify-center text-[#C1F76B] shadow-2xl shadow-[#C1F76B]/30">
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F76B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C1F76B]"></span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-[#FDFEF8]">
                    Conectado com Sucesso!
                  </h3>
                  <p className="text-xs text-[#95BDB0] max-w-xs">
                    A instância <strong className="text-[#FDFEF8]">{connectionSuccess.name}</strong> foi pareada com êxito e já está pronta para envio e recebimento de mensagens.
                  </p>
                </div>

                {connectionSuccess.phone && (
                  <div className="px-4 py-2 rounded-2xl bg-[#14382F] border border-[#2D6B5A] flex items-center gap-2.5 text-[#C1F76B] font-mono font-bold text-sm shadow-inner">
                    <Smartphone className="w-4 h-4 text-[#C1F76B]" />
                    <span>{connectionSuccess.phone}</span>
                    <span className="text-[10px] uppercase font-sans tracking-wider px-2 py-0.5 rounded-md bg-[#C1F76B]/20 text-[#C1F76B] font-bold">Online</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setConnectionSuccess(null);
                    setSelectedForQr(null);
                    setQrBase64(null);
                  }}
                  className="w-full py-3 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] font-bold text-xs rounded-2xl transition-all duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg shadow-[#C1F76B]/20 flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Ir para o Cockpit</span>
                </button>
              </div>
            ) : (
              <>
                {/* Method Tabs (QR Code vs Pairing Code) */}
                <div className="p-3 bg-[#14382F] border-b border-[#235447] flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPairingMethod('qr')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pairingMethod === 'qr'
                        ? 'bg-[#C1F76B] text-[#0F2D26] shadow-sm'
                        : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear QR Code</span>
                  </button>
                  <button
                    onClick={() => setPairingMethod('code')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pairingMethod === 'code'
                        ? 'bg-[#C1F76B] text-[#0F2D26] shadow-sm'
                        : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                    }`}
                  >
                    <SmartphoneNfc className="w-3.5 h-3.5" />
                    <span>Código de Pareamento</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                  {pairingMethod === 'qr' ? (
                    <>
                      {/* Real QR Code Graphic from Evolution GO */}
                      <div className="relative p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center min-w-[240px] min-h-[240px]">
                        {qrBase64 ? (
                          <img
                            src={qrBase64}
                            alt="QR Code WhatsApp"
                            className="w-56 h-56 rounded-xl object-contain animate-in fade-in duration-300"
                          />
                        ) : (
                          <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-zinc-600">
                            <RefreshCw className="w-8 h-8 animate-spin text-[#0F2D26]" />
                            <p className="text-xs font-semibold">
                              {isQrLoading ? 'Gerando QR Code...' : 'Aguardando QR Code...'}
                            </p>
                          </div>
                        )}

                        {isRefreshingQr && (
                          <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center text-black font-semibold text-xs gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#0F2D26]" />
                            Atualizando QR Code...
                          </div>
                        )}
                      </div>

                      {/* Mobile Instructions */}
                      <div className="text-left text-xs text-[#95BDB0] bg-[#0B241D] p-3.5 rounded-2xl border border-[#235447] space-y-1.5 max-w-sm">
                        <p className="font-bold text-[#FDFEF8] mb-1">Como conectar no seu telemóvel:</p>
                        <p>1. Abra o <strong>WhatsApp</strong> no telemóvel</p>
                        <p>2. Toque em <strong>Menu (três pontinhos)</strong> ou <strong>Configurações</strong></p>
                        <p>3. Selecione <strong>Aparelhos conectados</strong> e toque em <strong>Conectar um aparelho</strong></p>
                        <p>4. Aponte a câmera para o QR Code acima</p>
                      </div>
                    </>
                  ) : (
                    /* Pairing Code Method */
                    <div className="w-full space-y-4 text-left">
                      <div>
                        <label className="text-xs font-semibold text-[#95BDB0] block mb-1">
                          Número do WhatsApp (+258)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pairingPhoneNumber}
                            onChange={(e) => setPairingPhoneNumber(e.target.value)}
                            placeholder="+258 84 000 0000"
                            className="flex-1 bg-[#14382F] text-sm text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
                          />
                          <button
                            onClick={handleGeneratePairingCode}
                            className="px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Gerar Código
                          </button>
                        </div>
                      </div>

                      {pairingError && (
                        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>{pairingError}</span>
                        </div>
                      )}

                      {pairingCode && (
                        <div className="p-4 rounded-2xl bg-[#0B241D] border border-[#C1F76B]/40 text-center space-y-2">
                          <p className="text-xs text-[#95BDB0]">Digite este código no seu telemóvel:</p>
                          <p className="text-2xl font-mono font-extrabold text-[#C1F76B] tracking-widest">
                            {pairingCode}
                          </p>
                          <p className="text-[11px] text-[#95BDB0]">
                            Uma notificação de confirmação aparecerá no seu WhatsApp
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-[#95BDB0] bg-[#0B241D] p-3.5 rounded-2xl border border-[#235447] space-y-1">
                        <p className="font-bold text-[#FDFEF8] mb-1">No telemóvel:</p>
                        <p>Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar com número de telefone.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between">
                  <button
                    onClick={handleRefreshQr}
                    className="px-3 py-2 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-xs text-[#95BDB0] hover:text-[#FDFEF8] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin' : ''}`} />
                    <span>Recarregar QR</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedForQr(null)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluir / Fechar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create New Instance Modal */}
      {isNewInstanceModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#FDFEF8] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C1F76B]" />
                Criar Nova Instância WhatsApp
              </h3>
              <button
                onClick={() => {
                  setIsNewInstanceModalOpen(false);
                  setCreateError(null);
                }}
                className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInstance} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{createError}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                  Nome da Instância *
                </label>
                <input
                  type="text"
                  required
                  value={newInstanceName}
                  onChange={(e) => {
                    setNewInstanceName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="Ex: Linha 2 - Atendimento Matola"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3.5 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
                <p className="text-[10px] text-[#95BDB0] mt-1">
                  Identificador para organizar suas linhas de vendas e suporte
                </p>
              </div>

              <div className="p-3 bg-[#0B241D] rounded-xl border border-[#235447] text-xs text-[#95BDB0] space-y-1">
                <p className="text-[#FDFEF8] font-semibold">Após criar:</p>
                <p>O QR Code será gerado automaticamente para você escanear com o telemóvel.</p>
              </div>

              <div className="pt-3 border-t border-[#235447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewInstanceModalOpen(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingInstance}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {isCreatingInstance ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Criando Instância...</span>
                    </>
                  ) : (
                    <span>Criar & Conectar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        confirmVariant={confirmModalState.confirmVariant}
        iconType={confirmModalState.iconType}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

