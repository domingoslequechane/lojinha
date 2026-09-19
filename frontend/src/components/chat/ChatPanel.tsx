import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Clock, 
  ChevronLeft,
  ChevronRight, 
  Check,
  CheckCheck, 
  Play, 
  Pause, 
  Zap, 
  MapPin, 
  Phone, 
  MoreVertical,
  Baby,
  X,
  Plus,
  Image as ImageIcon,
  CreditCard,
  Trash2,
  Sparkles,
  Settings,
  Package,
  FileText,
  AlertCircle,
  Loader2,
  Timer,
  Pencil,
  TrendingUp,
  Maximize2,
  Download,
  Video
} from 'lucide-react';
import { ContactLead, ChatMessage, MessageType, KanbanColumn, QuickReply, StoreSettings, StoreProduct } from '../../types';
import { CustomSelect } from '../common/CustomSelect';
import { EditLeadModal } from '../leads/EditLeadModal';
import { formatPhoneForCall } from '../../utils/phoneUtils';

/** Returns "Remove em Xh Ym" remaining until 48h expiry.
 *  Shown for all image/video messages — media is cleaned up after 48h. */
function getMediaExpiryLabel(createdAt: string | undefined): string {
  const createdMs = createdAt ? new Date(createdAt).getTime() : Date.now();
  const validMs = isNaN(createdMs) ? Date.now() : createdMs;
  const expiryMs = validMs + 48 * 60 * 60 * 1000; // 48 horas
  const remainingMs = expiryMs - Date.now();
  if (remainingMs <= 0) return 'Expirado';
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Remove em ${hours}h ${minutes}m`;
  return `Remove em ${minutes}m`;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Expressões',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '🥳', '🤔', '🤗', '👍', '👏', '🙏', '❤️', '🔥', '✨', '👌']
  },
  {
    name: 'Vendas & Entrega',
    emojis: ['📱', '💻', '🎁', '🚀', '💰', '💳', '🚚', '📦', '🏷️', '🛍️', '⚡', '🔔', '📞', '📍', '⭐', '💯', '🤝', '✅', '🕒', '📋']
  },
  {
    name: 'Infantil & Brinquedos',
    emojis: ['🧸', '👶', '👧', '🧒', '🎨', '📚', '🎒', '✏️', '🧩', '🎮', '🦄', '🦖', '🌟', '🌈', '🍭', '⚽', '🎯']
  }
];

const CatalogProductCard: React.FC<{ item: StoreProduct; onSend: (item: StoreProduct) => void }> = ({ item, onSend }) => {
  const [imgError, setImgError] = React.useState(false);
  const isVideo = item.mediaType === 'video' || (item.imageUrl && item.imageUrl.startsWith('data:video')) || !!item.videoUrl || (item.imageUrl && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(item.imageUrl));
  const mediaUrl = item.videoUrl || item.imageUrl;

  return (
    <div className="bg-[#14382F] border border-[#235447] rounded-2xl p-3 flex flex-col justify-between hover:border-[#C1F76B]/60 transition-all duration-150 hover:scale-[1.02] group">
      <div>
        <div className="w-full h-28 rounded-xl mb-2 overflow-hidden bg-[#0F2D26] flex items-center justify-center relative">
          {mediaUrl && !imgError ? (
            isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#C1F76B] text-[#0F2D26] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1">
                  <Video className="w-2.5 h-2.5 text-[#C1F76B]" />
                  Vídeo
                </span>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt={item.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-[#578577] gap-1">
              <Package className="w-7 h-7" />
              <span className="text-[10px]">Sem mídia</span>
            </div>
          )}
        </div>
        <h4 className="font-bold text-xs text-[#FDFEF8] leading-tight">{item.title}</h4>
        <p className="font-extrabold text-xs text-[#C1F76B] mt-1">{item.price}</p>
      </div>
      <button
        type="button"
        onClick={() => onSend(item)}
        className="mt-3 w-full py-2 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#C1F76B]/20"
      >
        <Send className="w-3 h-3" />
        <span>{isVideo ? 'Enviar Vídeo' : 'Enviar Foto'}</span>
      </button>
    </div>
  );
};

interface ChatPanelProps {
  lead: ContactLead | null;
  columns: KanbanColumn[];
  messages: ChatMessage[];
  quickReplies: QuickReply[];
  storeSettings?: StoreSettings;
  onSendMessage: (text: string, type?: MessageType, mediaUrl?: string, audioDuration?: string) => void;
  onDeleteMessage?: (messageId: string, whatsappMessageId?: string) => void;
  onChangeColumn: (leadId: string, newColumnId: string) => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
  onUpdateLead?: (updatedLead: ContactLead) => void;
  onCloseChat: () => void;
  onNavigateToSettings?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  lead,
  columns,
  messages,
  quickReplies,
  storeSettings,
  onSendMessage,
  onDeleteMessage,
  onChangeColumn,
  onOpenFollowUpModal,
  onUpdateLead,
  onCloseChat,
  onNavigateToSettings,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedMedias, setAttachedMedias] = useState<{
    id: string;
    type: 'image' | 'video' | 'audio';
    dataUrl: string;
    name: string;
    caption: string;
  }[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showQuickBar, setShowQuickBar] = useState(true);

  // Functional Popovers & Attachments state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Audio Recording state & live levels
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 35, 20, 50, 30, 60, 40, 25, 45, 30, 20, 40]);
  const [audioProgress, setAudioProgress] = useState<{ [id: string]: number }>({});
  const [audioRemaining, setAudioRemaining] = useState<{ [id: string]: string }>({});

  // Context menu & delete confirmation modal
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);

  // Header popovers: Notes and Funnel Journey
  const [showNotesPopover, setShowNotesPopover] = useState(false);
  const [showJourneyPopover, setShowJourneyPopover] = useState(false);

  // Maximized Media Lightbox & Gallery state
  const [viewingMediaIndex, setViewingMediaIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  // Audio capture & playback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, lead]);

  // Reset attached media, input and media viewer on lead change
  useEffect(() => {
    setAttachedMedias([]);
    setSelectedMediaId(null);
    setInputText('');
    setViewingMediaIndex(null);
  }, [lead?.id]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputAreaRef.current && !inputAreaRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanupMediaResources = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  // Cleanup recording interval and audio on unmount
  useEffect(() => {
    return () => {
      cleanupMediaResources();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);



  if (!lead) {
    return (
      <div className="w-[480px] min-w-[420px] h-full bg-[#0F2D26] border-l border-[#235447] hidden md:flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-[#14382F] flex items-center justify-center text-[#C1F76B] mb-4">
          <Zap className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-[#FDFEF8] mb-2">Painel de Atendimento WhatsApp</h3>
        <p className="text-sm text-[#95BDB0] max-w-xs leading-relaxed">
          Selecione um cliente no Kanban ao lado para abrir a conversa ao vivo e disparar mensagens.
        </p>
      </div>
    );
  }

  const currentColumn = columns.find((c) => c.id === lead.columnId);

  // Filter all non-deleted media (images and videos) in the current chat conversation
  const conversationMediaList = React.useMemo(() => {
    return messages.filter(
      (m) =>
        !m.deletedAt &&
        m.status !== 'deleted' &&
        m.mediaUrl &&
        (m.type === 'image' || m.type === 'video')
    );
  }, [messages]);

  const viewingMedia =
    viewingMediaIndex !== null &&
    viewingMediaIndex >= 0 &&
    viewingMediaIndex < conversationMediaList.length
      ? conversationMediaList[viewingMediaIndex]
      : null;

  const handleOpenMediaViewer = (msgId: string) => {
    const idx = conversationMediaList.findIndex((m) => m.id === msgId);
    if (idx !== -1) {
      setViewingMediaIndex(idx);
    }
  };

  const handleCloseMediaViewer = () => {
    setViewingMediaIndex(null);
  };

  const handlePrevMedia = () => {
    if (viewingMediaIndex !== null && viewingMediaIndex > 0) {
      setViewingMediaIndex(viewingMediaIndex - 1);
    }
  };

  const handleNextMedia = () => {
    if (viewingMediaIndex !== null && viewingMediaIndex < conversationMediaList.length - 1) {
      setViewingMediaIndex(viewingMediaIndex + 1);
    }
  };

  // Keyboard navigation for media viewer (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (viewingMediaIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingMediaIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setViewingMediaIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setViewingMediaIndex((prev) =>
          prev !== null && prev < conversationMediaList.length - 1 ? prev + 1 : prev
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingMediaIndex, conversationMediaList.length]);

  // Active media item being currently edited in textarea
  const activeMedia = attachedMedias.find((m) => m.id === selectedMediaId) || attachedMedias[0] || null;
  const currentInputValue = attachedMedias.length > 0 ? (activeMedia ? activeMedia.caption : '') : inputText;

  const handleTextChange = (val: string) => {
    if (attachedMedias.length > 0 && activeMedia) {
      setAttachedMedias((prev) =>
        prev.map((m) => (m.id === activeMedia.id ? { ...m, caption: val } : m))
      );
    } else {
      setInputText(val);
    }
  };

  // Auto-adjust textarea height dynamically when content, media or placeholder changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(42, scrollH), 128)}px`;
    }
  }, [currentInputValue, selectedMediaId, attachedMedias.length]);

  const handleSend = () => {
    if (attachedMedias.length > 0) {
      const mediasToSend = [...attachedMedias];
      setAttachedMedias([]);
      setSelectedMediaId(null);
      setInputText('');
      setShowEmojiPicker(false);
      setShowAttachMenu(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      mediasToSend.forEach((media, index) => {
        const caption = media.caption ? media.caption.trim() : '';
        if (index === 0) {
          onSendMessage(caption, media.type, media.dataUrl);
        } else {
          setTimeout(() => {
            onSendMessage(caption, media.type, media.dataUrl);
          }, index * 120);
        }
      });
      return;
    }

    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (attachedMedias.length > 0 && activeMedia) {
      setAttachedMedias((prev) =>
        prev.map((m) => (m.id === activeMedia.id ? { ...m, caption: (m.caption || '') + emoji } : m))
      );
    } else {
      setInputText((prev) => prev + emoji);
    }
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readPromises = files.map((file) => {
      return new Promise<{
        id: string;
        type: 'image' | 'video' | 'audio';
        dataUrl: string;
        name: string;
        caption: string;
      }>((resolve) => {
        const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i.test(file.name);
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name);
        const msgType: 'image' | 'video' | 'audio' = isAudio ? 'audio' : isVideo ? 'video' : 'image';
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: msgType,
            dataUrl: ev.target?.result as string,
            name: file.name,
            caption: '',
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((newItems) => {
      setAttachedMedias((prev) => [...prev, ...newItems]);
      setSelectedMediaId((prevSelected) => prevSelected || newItems[0]?.id || null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    });

    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleRemoveAttachedMedia = (idToRemove: string) => {
    setAttachedMedias((prev) => {
      const remaining = prev.filter((item) => item.id !== idToRemove);
      if (selectedMediaId === idToRemove) {
        setSelectedMediaId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  const catalogProducts: StoreProduct[] = storeSettings?.products || [];

  const handleSendTabletPhoto = (product: StoreProduct) => {
    const isVideo = product.mediaType === 'video' || (product.imageUrl && product.imageUrl.startsWith('data:video')) || !!product.videoUrl || (product.imageUrl && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(product.imageUrl));
    const mediaUrl = product.videoUrl || product.imageUrl;
    const newId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      id: newId,
      type: (isVideo ? 'video' : 'image') as 'image' | 'video',
      dataUrl: mediaUrl,
      name: product.title,
      caption: product.caption || `*${product.title}*\nPreço: ${product.price}`,
    };
    setAttachedMedias((prev) => [...prev, newItem]);
    setSelectedMediaId(newId);
    setShowCatalogModal(false);
    setShowAttachMenu(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSendPaymentInfo = () => {
    const payment = storeSettings?.paymentSettings;
    const lines: string[] = ['💳 *DADOS PARA PAGAMENTO / RESERVA:*', ''];
    if (payment?.mpesaNumber) {
      lines.push(`📱 *M-Pesa (Vodacom):* ${payment.mpesaNumber}${payment.mpesaName ? ` (Nome: ${payment.mpesaName})` : ''}`);
    }
    if (payment?.emolaNumber) {
      lines.push(`📱 *e-Mola (Movitel):* ${payment.emolaNumber}${payment.emolaName ? ` (Nome: ${payment.emolaName})` : ''}`);
    }
    if (payment?.bankName && payment?.bankAccount) {
      lines.push(`🏦 *${payment.bankName}:* ${payment.bankAccount}`);
    }
    if (payment?.customInstructions) {
      lines.push('', payment.customInstructions);
    }

    if (lines.length <= 2) {
      onSendMessage('💳 Nenhuma conta de pagamento configurada ainda. Por favor, configure seus dados em Minha Loja.');
    } else {
      onSendMessage(lines.join('\n'));
    }
    setShowAttachMenu(false);
  };

  const handleSendLocationInfo = () => {
    const shipping = storeSettings?.shippingSettings;
    const lines: string[] = ['📍 *INFORMAÇÕES DE ENTREGA & FRETE:*', ''];
    if (shipping?.maputoFee) lines.push(`• *Entrega Local:* ${shipping.maputoFee}`);
    if (shipping?.matolaFee) lines.push(`• *Envio Regional:* ${shipping.matolaFee}`);
    if (shipping?.provincesFee) lines.push(`• *Envio Nacional / Longa Distância:* ${shipping.provincesFee}`);
    if (shipping?.pickupAddress) lines.push(`• *Ponto de Retirada:* ${shipping.pickupAddress}`);
    if (shipping?.shippingNotes) lines.push('', `ℹ️ *Observação:* ${shipping.shippingNotes}`);

    if (lines.length <= 2) {
      onSendMessage('📍 Informações de frete ainda não configuradas. Por favor, configure seus dados em Minha Loja.');
    } else {
      onSendMessage(lines.join('\n'));
    }
    setShowAttachMenu(false);
  };

  // Real Voice Recording Handlers via MediaRecorder & Web Audio API
  const handleStartRecording = async () => {
    try {
      setShowEmojiPicker(false);
      setShowAttachMenu(false);

      // Clean up any stale streams first
      cleanupMediaResources();

      // Request real microphone stream with driver-friendly fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }
      audioStreamRef.current = stream;


      // Setup audio analyzer for live dancing waveform
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevels = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              const levels = Array.from(dataArray.slice(0, 14)).map((v) => Math.max(15, (v / 255) * 100));
              setAudioLevels(levels);
              animationFrameRef.current = requestAnimationFrame(updateLevels);
            }
          };
          updateLevels();
        }
      } catch (err) {
        console.warn('Audio visualizer not supported:', err);
      }

      // Choose supported mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            mimeType = '';
          }
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setAudioError('Não foi possível aceder ao microfone. Por favor, permita o microfone no navegador.');
      setTimeout(() => setAudioError(null), 5000);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupMediaResources();
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const handleSendVoiceNote = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      handleCancelRecording();
      return;
    }

    const currentDurationSec = recordingSeconds;
    const mins = Math.floor(currentDurationSec / 60);
    const secs = currentDurationSec % 60;
    const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs === 0 ? '01' : secs}`;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Convert audio blob to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64DataUrl = reader.result as string;
        onSendMessage('', 'audio', base64DataUrl, durationStr);
      };
      reader.readAsDataURL(audioBlob);

      cleanupMediaResources();
      setIsRecordingAudio(false);
      setRecordingSeconds(0);
      audioChunksRef.current = [];
    };

    recorder.stop();
  };

  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.mediaUrl) {
      onSendMessage(reply.content, reply.mediaType || 'image', reply.mediaUrl);
    } else {
      onSendMessage(reply.content, 'text');
    }
  };

  const parseDurationSecs = (str?: string): number => {
    if (!str) return 0;
    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const toggleAudio = (msgId: string, mediaUrl?: string, fallbackDurationStr?: string) => {
    if (playingAudioId === msgId) {
      currentAudioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (!mediaUrl) return;

    try {
      const audio = new Audio(mediaUrl);
      currentAudioRef.current = audio;
      setPlayingAudioId(msgId);

      const knownDurationSecs = parseDurationSecs(fallbackDurationStr) || 10;

      const updateProgress = () => {
        let total = audio.duration;
        if (!total || !Number.isFinite(total) || isNaN(total) || total <= 0) {
          total = knownDurationSecs;
        }

        const current = audio.currentTime || 0;
        const pct = Math.min(100, Math.max(0, (current / total) * 100));
        setAudioProgress((prev) => ({ ...prev, [msgId]: pct }));

        // Countdown time remaining: e.g. 0:11 -> 0:10 -> 0:00 (guarding strictly against Infinity/NaN)
        const remainingSecs = Math.max(0, Math.ceil(total - current));
        const mins = Math.floor(remainingSecs / 60);
        const secs = remainingSecs % 60;
        const remainingStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setAudioRemaining((prev) => ({ ...prev, [msgId]: remainingStr }));
      };

      audio.ontimeupdate = updateProgress;
      audio.onloadedmetadata = updateProgress;
      audio.onplay = updateProgress;

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
        setAudioRemaining((prev) => {
          const copy = { ...prev };
          delete copy[msgId];
          return copy;
        });
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.warn('Audio play error:', err);
        setPlayingAudioId(null);
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      setPlayingAudioId(null);
    }
  };

  const handleSeekAudio = (msgId: string, mediaUrl?: string, fallbackDurationStr?: string, pct: number = 0) => {
    const knownDurationSecs = parseDurationSecs(fallbackDurationStr) || 10;
    if (playingAudioId === msgId && currentAudioRef.current) {
      const total = Number.isFinite(currentAudioRef.current.duration) && currentAudioRef.current.duration > 0
        ? currentAudioRef.current.duration
        : knownDurationSecs;
      currentAudioRef.current.currentTime = total * pct;
    } else if (mediaUrl) {
      toggleAudio(msgId, mediaUrl, fallbackDurationStr);
      if (currentAudioRef.current) {
        currentAudioRef.current.onloadedmetadata = () => {
          const total = Number.isFinite(currentAudioRef.current?.duration) && (currentAudioRef.current?.duration || 0) > 0
            ? (currentAudioRef.current?.duration || 0)
            : knownDurationSecs;
          if (currentAudioRef.current) {
            currentAudioRef.current.currentTime = total * pct;
          }
        };
      }
    }
  };




  // Slash commands matching (active only in standard text mode)
  const isSlashActive = attachedMedias.length === 0 && inputText.startsWith('/');
  const matchingSlashReplies = isSlashActive
    ? quickReplies.filter(
        (r) =>
          r.shortcut.toLowerCase().includes(inputText.toLowerCase()) ||
          r.title.toLowerCase().includes(inputText.slice(1).toLowerCase())
      )
    : [];

  // Helper to render Notes Popover
  const renderNotesPopoverContent = () => (
    <div className="absolute right-0 mt-1.5 z-50 w-72 max-w-[calc(100vw-24px)] bg-[#0F2D26] border border-[#235447] rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-[#235447] mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#FDFEF8]">
          <FileText className="w-3.5 h-3.5 text-[#C1F76B]" />
          <span>Nota & Follow-up</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowNotesPopover(false);
            onOpenFollowUpModal(lead);
          }}
          className="p-1 rounded-lg bg-[#14382F] hover:bg-[#235447] text-[#C1F76B] hover:text-[#FDFEF8] transition-colors cursor-pointer"
          title="Editar Nota"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {lead.followUpDate && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-amber-300 mb-2">
          <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span>Agendado para: {lead.followUpDate}</span>
        </div>
      )}

      {lead.followUpNotes ? (
        <p className="text-xs text-[#E3F2ED] whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto pr-1">
          {lead.followUpNotes}
        </p>
      ) : (
        <p className="text-xs text-[#95BDB0]/70 italic py-2">
          Nenhuma nota registrada. Clique na caneta para anotar detalhes.
        </p>
      )}

      <div className="mt-3 pt-2 border-t border-[#235447]">
        <button
          type="button"
          onClick={() => {
            setShowNotesPopover(false);
            onOpenFollowUpModal(lead);
          }}
          className="w-full py-1.5 px-3 rounded-xl bg-[#14382F] hover:bg-[#1C4E41] text-[#C1F76B] hover:text-[#FDFEF8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#235447]"
        >
          <Pencil className="w-3 h-3" />
          <span>{lead.followUpNotes ? 'Editar Nota' : '+ Adicionar Nota'}</span>
        </button>
      </div>
    </div>
  );

  // Helper to render Journey Popover
  const renderJourneyPopoverContent = () => (
    <div className="absolute right-0 mt-1.5 z-50 w-80 max-w-[calc(100vw-24px)] bg-[#0F2D26] border border-[#235447] rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-[#235447] mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#FDFEF8]">
          <TrendingUp className="w-3.5 h-3.5 text-[#C1F76B]" />
          <span>Jornada no Funil</span>
        </div>
        <span className="text-[10px] font-semibold text-[#95BDB0] bg-[#14382F] px-2 py-0.5 rounded-full">
          {lead.stageHistory?.length || 1} {lead.stageHistory?.length === 1 ? 'movimento' : 'movimentos'}
        </span>
      </div>

      {/* Timeline Dots Strip */}
      <div className="flex items-center gap-1 overflow-x-auto py-2 px-2 mb-2.5 bg-[#14382F]/60 rounded-xl border border-[#235447]/60">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" title="Entrada do Lead" />
        <div className="h-px w-2.5 bg-[#2D6B5A] flex-shrink-0" />
        {(lead.stageHistory || []).map((entry, idx) => {
          const color = columns.find((c) => c.id === entry.toColumnId)?.color || '#C1F76B';
          return (
            <React.Fragment key={idx}>
              <div
                className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                style={{ backgroundColor: color }}
                title={`${entry.fromColumnTitle} → ${entry.toColumnTitle}`}
              />
              <div className="h-px w-2.5 bg-[#2D6B5A] flex-shrink-0" />
            </React.Fragment>
          );
        })}
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white flex-shrink-0 animate-pulse"
          style={{ backgroundColor: currentColumn?.color || '#C1F76B' }}
          title={`Etapa Atual: ${currentColumn?.title}`}
        />
      </div>

      {/* History List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {(lead.stageHistory || []).map((entry, idx) => {
          const color = columns.find((c) => c.id === entry.toColumnId)?.color || '#C1F76B';
          return (
            <div key={idx} className="flex items-start justify-between text-[11px] p-1.5 rounded-lg bg-[#14382F] border border-[#235447]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate text-[#FDFEF8] font-medium">{entry.toColumnTitle.replace(/^[^ ]+ /, '')}</span>
              </div>
              <span className="text-[10px] text-[#95BDB0] flex-shrink-0">{entry.movedAtLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Summary */}
      <div className="mt-2.5 pt-2 border-t border-[#235447] flex items-center justify-between text-[11px]">
        <span className="text-[#95BDB0]">Fase Atual:</span>
        <span className="font-bold flex items-center gap-1.5 text-[#FDFEF8]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColumn?.color || '#C1F76B' }} />
          {currentColumn?.title.replace(/^[^ ]+ /, '')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full md:w-[480px] md:min-w-[420px] lg:w-[500px] h-full bg-[#091E19] border-l border-[#235447] flex flex-col z-20 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-right-4 relative overflow-hidden">
      {/* 1. Mobile Chat Header (Row 1: Back + Avatar + Name & Phone in ONE SINGLE line + Close X) */}
      <div className="md:hidden h-14 bg-[#14382F] px-2.5 flex items-center justify-between gap-2 border-b border-[#235447]/60 select-none flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onCloseChat}
            className="p-1 -ml-1 text-[#95BDB0] hover:text-[#C1F76B] active:scale-95 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
            title="Voltar ao Funil"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {lead.avatar ? (
              <img
                src={lead.avatar}
                alt={lead.name}
                className="w-9 h-9 rounded-full object-cover border border-[#2D6B5A]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#0F2D26] border border-[#2D6B5A] flex items-center justify-center text-xs font-bold text-[#C1F76B]">
                {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#C1F76B] ring-2 ring-[#14382F]" />
          </div>

          {/* Name on top, contact/phone underneath */}
          <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
            <h3 className="font-bold text-sm text-[#FDFEF8] truncate">
              {lead.name}
            </h3>
            {lead.phone && (
              <a
                href={formatPhoneForCall(lead.phone)}
                className="text-[11px] text-[#95BDB0] hover:text-[#C1F76B] truncate font-normal transition-colors flex items-center gap-1 mt-0.5"
                title={`Ligar para ${lead.phone}`}
              >
                <span>{lead.phone}</span>
                {lead.location && <span>• {lead.location}</span>}
              </a>
            )}
          </div>
        </div>

        {/* Close Chat Button */}
        <button
          type="button"
          onClick={onCloseChat}
          className="p-1.5 rounded-xl bg-[#0F2D26] border border-[#235447] text-[#95BDB0] hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all flex-shrink-0"
          title="Fechar Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Mobile Action Buttons Bar (Row 2: Action buttons underneath) */}
      <div className="md:hidden flex items-center justify-between gap-1.5 px-3 py-1.5 bg-[#0F2D26] border-b border-[#235447] select-none flex-shrink-0">
        {/* Direct Call Button */}
        {lead.phone && (
          <a
            href={formatPhoneForCall(lead.phone)}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#14382F] hover:bg-[#C1F76B] text-[#C1F76B] hover:text-[#0F2D26] border border-[#235447] hover:border-[#C1F76B] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title={`Ligar para ${lead.name || lead.phone}`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Ligar</span>
          </a>
        )}

        {/* Column Stage Switcher (aligned left so it opens to the right on mobile) */}
        <CustomSelect
          variant="dot-only"
          value={lead.columnId}
          onChange={(newColId) => onChangeColumn(lead.id, newColId)}
          options={columns.map((col) => ({
            value: col.id,
            label: col.title,
            color: col.color,
          }))}
          align="left"
        />

        {/* Edit Lead Info */}
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="p-2 rounded-xl border bg-[#14382F] border-[#235447] text-[#95BDB0] hover:text-[#C1F76B] hover:border-[#C1F76B] transition-all duration-150 active:scale-95"
          title="Editar Informações do Cliente"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Notes & Follow-up Button + Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotesPopover(!showNotesPopover);
              setShowJourneyPopover(false);
            }}
            className={`p-2 rounded-xl border relative transition-all duration-150 active:scale-95 ${
              showNotesPopover || lead.followUpNotes
                ? 'bg-[#14382F] border-[#C1F76B] text-[#C1F76B] ring-1 ring-[#C1F76B]/30'
                : 'bg-[#14382F] border-[#235447] text-[#95BDB0]'
            }`}
            title={lead.followUpNotes ? "Ver/Editar Notas" : "Adicionar Notas"}
          >
            <FileText className="w-4 h-4" />
            {lead.followUpNotes && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C1F76B]" />
            )}
          </button>
          {showNotesPopover && renderNotesPopoverContent()}
        </div>

        {/* Funnel Journey Button + Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowJourneyPopover(!showJourneyPopover);
              setShowNotesPopover(false);
            }}
            className={`p-2 rounded-xl border relative transition-all duration-150 active:scale-95 ${
              showJourneyPopover
                ? 'bg-[#14382F] border-[#C1F76B] text-[#C1F76B] ring-1 ring-[#C1F76B]/30'
                : 'bg-[#14382F] border-[#235447] text-[#95BDB0]'
            }`}
            title="Jornada no Funil"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          {showJourneyPopover && renderJourneyPopoverContent()}
        </div>

        {/* Follow-up Schedule Button */}
        <button
          onClick={() => onOpenFollowUpModal(lead)}
          className={`p-2 rounded-xl border transition-all duration-150 active:scale-95 ${
            lead.followUpDate
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-[#14382F] border-[#235447] text-[#95BDB0]'
          }`}
          title={lead.followUpDate ? `Follow-up: ${lead.followUpDate}` : "Agendar Follow-up"}
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Desktop Chat Top Header (Hidden on mobile, visible on md+) */}
      <div className="hidden md:flex h-16 bg-[#14382F] px-3.5 items-center justify-between border-b border-[#235447] select-none flex-shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          <div className="relative flex-shrink-0">
            {lead.avatar ? (
              <img
                src={lead.avatar}
                alt={lead.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2D6B5A]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#14382F] border border-[#2D6B5A] flex items-center justify-center text-sm font-bold text-[#C1F76B]">
                {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#C1F76B] ring-2 ring-[#14382F]" />
          </div>

          <div className="truncate">
            <h3 className="font-semibold text-sm text-[#FDFEF8] truncate flex items-center gap-1.5">
              {lead.name}
            </h3>
            <div className="text-[11px] text-[#95BDB0] truncate flex items-center gap-1">
              {lead.phone ? (
                <a
                  href={formatPhoneForCall(lead.phone)}
                  className="hover:text-[#C1F76B] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  title={`Ligar para ${lead.phone}`}
                >
                  <Phone className="w-2.5 h-2.5 text-[#C1F76B]" />
                  <span>{lead.phone}</span>
                </a>
              ) : (
                <span>Sem telefone</span>
              )}
              {lead.location && <span>• {lead.location}</span>}
            </div>
          </div>
        </div>

        {/* Desktop Header Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {lead.phone && (
            <a
              href={formatPhoneForCall(lead.phone)}
              className="p-2 rounded-xl border bg-[#0F2D26] border-[#235447] text-[#C1F76B] hover:text-[#0F2D26] hover:bg-[#C1F76B] hover:border-[#C1F76B] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
              title={`Fazer ligação para ${lead.name || lead.phone}`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-xs font-bold">Ligar</span>
            </a>
          )}

          <CustomSelect
            variant="dot-only"
            value={lead.columnId}
            onChange={(newColId) => onChangeColumn(lead.id, newColId)}
            options={columns.map((col) => ({
              value: col.id,
              label: col.title,
              color: col.color,
            }))}
            align="right"
          />

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-xl border bg-[#0F2D26] border-[#235447] text-[#95BDB0] hover:text-[#C1F76B] hover:border-[#C1F76B] hover:bg-[#14382F] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            title="Editar Informações do Cliente"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotesPopover(!showNotesPopover);
                setShowJourneyPopover(false);
              }}
              className={`p-2 rounded-xl border relative transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                showNotesPopover || lead.followUpNotes
                  ? 'bg-[#14382F] border-[#C1F76B] text-[#C1F76B] ring-1 ring-[#C1F76B]/30'
                  : 'bg-[#0F2D26] border-[#235447] text-[#95BDB0] hover:text-[#FDFEF8] hover:border-[#2D6B5A]'
              }`}
              title={lead.followUpNotes ? "Ver/Editar Notas do Cliente" : "Adicionar Notas do Cliente"}
            >
              <FileText className="w-4 h-4" />
              {lead.followUpNotes && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C1F76B] shadow-xs shadow-[#C1F76B]" />
              )}
            </button>
            {showNotesPopover && renderNotesPopoverContent()}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowJourneyPopover(!showJourneyPopover);
                setShowNotesPopover(false);
              }}
              className={`p-2 rounded-xl border relative transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                showJourneyPopover
                  ? 'bg-[#14382F] border-[#C1F76B] text-[#C1F76B] ring-1 ring-[#C1F76B]/30'
                  : 'bg-[#0F2D26] border-[#235447] text-[#95BDB0] hover:text-[#FDFEF8] hover:border-[#2D6B5A]'
              }`}
              title="Jornada no Funil"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            {showJourneyPopover && renderJourneyPopoverContent()}
          </div>

          <button
            onClick={() => onOpenFollowUpModal(lead)}
            className={`p-2 rounded-xl border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
              lead.followUpDate
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-[#0F2D26] border-[#235447] text-[#95BDB0] hover:text-[#FDFEF8] hover:border-[#2D6B5A]'
            }`}
            title={lead.followUpDate ? `Follow-up: ${lead.followUpDate}` : "Agendar Follow-up"}
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            onClick={onCloseChat}
            className="p-2 rounded-xl bg-[#0F2D26] border border-[#235447] text-[#95BDB0] hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            title="Fechar Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Quick Info Strip (Ultra-slim 28px) — Clique para editar */}
      <div
        onClick={() => setIsEditModalOpen(true)}
        className="px-3.5 py-1.5 bg-[#14382F] border-b border-[#235447] flex items-center justify-between text-xs text-[#95BDB0] hover:bg-[#184339] transition-colors cursor-pointer group"
        title="Clique para editar informações do cliente"
      >
        <div className="flex items-center gap-2 truncate">
          <Baby className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
          <span className="truncate text-[#FDFEF8] font-medium group-hover:text-[#C1F76B] transition-colors">
            {lead.childInfo || 'Sem dados da criança'}
          </span>
          <span className="text-[#C2DDD4]">• {lead.productInterest || 'Tablet'}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-[#C1F76B] bg-[#C1F76B]/15 px-2 py-0.5 rounded text-[11px]">
            {lead.dealValue.toLocaleString()} MT
          </span>
          <Pencil className="w-3 h-3 text-[#95BDB0] group-hover:text-[#C1F76B] transition-colors" />
        </div>
      </div>

      {/* Edit Customer Info Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={lead}
        columns={columns}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updated) => onUpdateLead?.(updated)}
      />

      {/* Messages Area */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#091E19]"
        style={{
          backgroundImage: `radial-gradient(#14382F 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.fromMe;
          const isDeleted = msg.status === 'deleted' || !!msg.deletedAt;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              onClick={() => contextMenuMsgId === msg.id && setContextMenuMsgId(null)}
            >
              {/* Bubble wrapper — relative for the context menu dropdown */}
              <div className="relative group/bubble max-w-[85%]">
                {/* ⋮ Context Menu button (only own messages, only when not deleted) */}
                {isMe && !isDeleted && onDeleteMessage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuMsgId(contextMenuMsgId === msg.id ? null : msg.id);
                    }}
                    className="absolute -top-1 -left-7 z-30 w-6 h-6 rounded-full bg-[#235447] hover:bg-[#174E3F] text-[#95BDB0] hover:text-[#FDFEF8] flex items-center justify-center opacity-0 group-hover/bubble:opacity-100 transition-opacity shadow-md cursor-pointer"
                    title="Opções da mensagem"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Context menu dropdown */}
                {contextMenuMsgId === msg.id && (
                  <div className="absolute -top-1 -left-36 z-40 bg-[#0F2D26] border border-[#235447] rounded-xl shadow-xl py-1 min-w-[140px] animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuMsgId(null);
                        setMessageToDelete(msg);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-[#174E3F] hover:text-red-300 transition-colors rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Apagar para todos
                    </button>
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2 shadow-sm text-sm relative ${
                    isMe
                      ? 'bg-[#174E3F] text-[#FDFEF8] rounded-tr-xs'
                      : 'bg-[#14382F] text-[#FDFEF8] rounded-tl-xs'
                  }`}
                >
                  {/* Deleted message bubble */}
                  {isDeleted ? (
                    <div className="flex items-center gap-1.5 py-1 text-[#95BDB0] italic text-xs select-none">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span>{isMe ? '🚫 Você apagou esta mensagem' : '🚫 Esta mensagem foi apagada'}</span>
                    </div>
                  ) : (
                    <>
                      {/* Media Image message */}
                      {msg.type === 'image' && msg.mediaUrl && !msg.mediaUrl.startsWith('data:audio') && !/\.(mp3|wav|ogg|m4a|aac|flac|opus)($|\?)/i.test(msg.mediaUrl) && (() => {
                        const expiryLabel = getMediaExpiryLabel(msg.createdAt);
                        return (
                          <div 
                            onClick={() => handleOpenMediaViewer(msg.id)}
                            className="mb-2 overflow-hidden rounded-xl relative group cursor-pointer select-none"
                            title="Clique para ampliar a imagem e navegar na galeria"
                          >
                            {/* Expiry countdown badge */}
                            {expiryLabel && (
                              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-amber-400/40 rounded-full px-2.5 py-0.5 shadow-lg pointer-events-none">
                                <Timer className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                                <span className="text-[11px] font-semibold text-amber-300 tracking-tight whitespace-nowrap">{expiryLabel}</span>
                              </div>
                            )}
                            <img
                              src={msg.mediaUrl}
                              alt="Mídia"
                              className="w-full max-h-56 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-y-1 group-hover:translate-y-0 bg-[#0F2D26]/90 border border-[#235447] text-[#C1F76B] p-2 rounded-full shadow-lg flex items-center gap-1">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                            {msg.status === 'pending' && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-10 select-none">
                                <div className="w-10 h-10 rounded-full border-3 border-white/20 border-t-[#C1F76B] animate-spin shadow-lg" />
                              </div>
                            )}
                            {msg.mediaCaption && msg.mediaCaption.trim() && (
                              <p className="text-xs text-[#FDFEF8]/90 mt-1.5 leading-relaxed">
                                {msg.mediaCaption}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Media Video message */}
                      {msg.type === 'video' && msg.mediaUrl && (() => {
                        const expiryLabel = getMediaExpiryLabel(msg.createdAt);
                        return (
                          <div className="mb-2 overflow-hidden rounded-xl bg-black max-w-sm relative group">
                            {/* Expiry countdown badge */}
                            {expiryLabel && (
                              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-amber-400/40 rounded-full px-2.5 py-0.5 shadow-lg pointer-events-none">
                                <Timer className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                                <span className="text-[11px] font-semibold text-amber-300 tracking-tight whitespace-nowrap">{expiryLabel}</span>
                              </div>
                            )}
                            {/* Maximize button */}
                            <button
                              type="button"
                              onClick={() => handleOpenMediaViewer(msg.id)}
                              className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/70 hover:bg-[#0F2D26] text-[#95BDB0] hover:text-[#C1F76B] border border-[#235447] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                              title="Maximizar vídeo na galeria"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <video
                              src={msg.mediaUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-72 rounded-xl object-contain bg-black"
                            />
                            {msg.status === 'pending' && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 select-none">
                                <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-[#C1F76B] animate-spin shadow-lg" />
                              </div>
                            )}
                            {((msg.mediaCaption && msg.mediaCaption.trim()) || (msg.text && msg.text.trim())) && (
                              <p className="text-xs text-[#FDFEF8]/90 mt-1.5 p-1 leading-relaxed">
                                {msg.mediaCaption || msg.text}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Audio Voice Note or MP3 Media message */}
                      {(msg.type === 'audio' || (msg.mediaUrl && (msg.mediaUrl.startsWith('data:audio') || /\.(mp3|wav|ogg|m4a|aac|flac|opus)($|\?)/i.test(msg.mediaUrl)))) && (
                        <div className="flex flex-col gap-1.5 py-1 pr-2 min-w-[230px]">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleAudio(msg.id, msg.mediaUrl, msg.audioDuration)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md cursor-pointer ${
                                playingAudioId === msg.id
                                  ? 'bg-[#219653] text-[#FDFEF8]'
                                  : 'bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26]'
                              }`}
                              title={playingAudioId === msg.id ? 'Pausar áudio' : 'Ouvir áudio'}
                            >
                              {playingAudioId === msg.id ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1">
                              {/* Smooth WhatsApp Waveform Track */}
                              <div
                                className="relative h-6 flex items-center cursor-pointer select-none py-1"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                  handleSeekAudio(msg.id, msg.mediaUrl, msg.audioDuration, clickPct);
                                }}
                              >
                                {/* Waveform Bars */}
                                <div className="flex items-center justify-between gap-[3px] h-full w-full">
                                  {[30, 60, 25, 80, 50, 95, 40, 70, 35, 90, 30, 65, 50, 35, 75, 45, 85, 60, 40, 75, 50, 80].map((val, idx, arr) => {
                                    const barPct = (idx / (arr.length - 1)) * 100;
                                    const isPlayed = (audioProgress[msg.id] || 0) >= barPct;
                                    return (
                                      <span
                                        key={idx}
                                        className={`w-[3px] rounded-full transition-colors duration-100 flex-shrink-0 ${
                                          isPlayed
                                            ? 'bg-[#C1F76B] shadow-xs shadow-[#C1F76B]/40'
                                            : 'bg-[#95BDB0]/40'
                                        }`}
                                        style={{ height: `${val}%` }}
                                      />
                                    );
                                  })}
                                </div>

                                {/* Scrubber thumb tracking current position */}
                                {playingAudioId === msg.id && (
                                  <span
                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C1F76B] shadow-md shadow-[#C1F76B] pointer-events-none -ml-1 transition-[left] duration-75 ease-linear"
                                    style={{ left: `${Math.min(98, Math.max(2, audioProgress[msg.id] || 0))}%` }}
                                  />
                                )}
                              </div>

                              {/* Status & Realtime Countdown Timer */}
                              <div className="flex items-center justify-between text-[10px] text-[#95BDB0] mt-0.5">
                                <span className={playingAudioId === msg.id ? 'text-[#C1F76B] font-semibold' : ''}>
                                  {playingAudioId === msg.id ? 'Reproduzindo...' : 'Áudio / MP3'}
                                </span>
                                <span className={`font-mono ${playingAudioId === msg.id ? 'text-[#C1F76B] font-bold' : ''}`}>
                                  {playingAudioId === msg.id && audioRemaining[msg.id]
                                    ? audioRemaining[msg.id]
                                    : msg.audioDuration || '0:15'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {msg.mediaCaption && msg.mediaCaption.trim() && (
                            <p className="text-xs text-[#FDFEF8]/90 mt-1 leading-relaxed">
                              {msg.mediaCaption}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Text Message */}
                      {msg.text && msg.type !== 'image' && msg.type !== 'video' && (
                        <p className="whitespace-pre-line leading-relaxed text-[13.5px]">
                          {msg.text}
                        </p>
                      )}
                    </>
                  )}

                  {/* Timestamp & Status checks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-[#95BDB0] mt-1 select-none">
                    <span>{msg.timestamp}</span>
                    {isMe && !isDeleted && (
                      <span className="inline-flex items-center">
                        {msg.status === 'pending' && (
                          <span title="Processando envio...">
                            <Clock className="w-3.5 h-3.5 text-[#95BDB0] animate-pulse" />
                          </span>
                        )}
                        {msg.status === 'sent' && (
                          <span title="Enviado aos servidores">
                            <Check className="w-3.5 h-3.5 text-[#95BDB0]" />
                          </span>
                        )}
                        {msg.status === 'delivered' && (
                          <span title="Entregue no WhatsApp">
                            <CheckCheck className="w-3.5 h-3.5 text-[#95BDB0]" />
                          </span>
                        )}
                        {msg.status === 'read' && (
                          <span title="Lido">
                            <CheckCheck className="w-3.5 h-3.5 text-[#C1F76B]" />
                          </span>
                        )}
                        {msg.status === 'failed' && (
                          <span title="Falha ao entregar no WhatsApp">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies Action Pill Bar */}
      <div className="bg-[#0F2D26] border-t border-[#235447] px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Respostas Rápidas (1 Toque):
          </span>
          <button
            onClick={() => setShowQuickBar(!showQuickBar)}
            className="text-[10px] text-[#C1F76B] hover:underline"
          >
            {showQuickBar ? 'Ocultar' : 'Exibir'}
          </button>
        </div>

        {showQuickBar && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleQuickReplyClick(reply)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#14382F] hover:bg-[#C1F76B] hover:text-[#FDFEF8] text-[#C2DDD4] border border-[#2D6B5A] hover:border-[#C1F76B] whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 font-medium hover:shadow-md"
                title={reply.content}
              >
                <span className="text-amber-400 font-mono text-[10px]">{reply.shortcut}</span>
                <span>{reply.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input for real device uploads (supports multiple files) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Message Input Bar & Interactive Popovers Container */}
      <div ref={inputAreaRef} className="relative bg-[#14382F] border-t border-[#235447]">
        {/* 1. Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-3 z-50 bg-[#0F2D26] border border-[#2D6B5A] rounded-2xl shadow-2xl p-3 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#235447]">
              <span className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                Emojis
              </span>
              <div className="flex items-center gap-1">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveEmojiCat(idx)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                      activeEmojiCat === idx
                        ? 'bg-[#C1F76B] text-[#0F2D26]'
                        : 'text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1">
              {EMOJI_CATEGORIES[activeEmojiCat].emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-[#14382F] hover:scale-125 active:scale-95 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Attachment Menu Popover */}
        {showAttachMenu && (
          <div className="absolute bottom-full mb-2 left-10 z-50 bg-[#0F2D26] border border-[#2D6B5A] rounded-2xl shadow-2xl p-2 w-64 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Fotos e Vídeos</p>
                <p className="text-[10px] text-[#95BDB0]">Fazer upload do telemóvel</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setShowCatalogModal(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Catálogo dos Tablets</p>
                <p className="text-[10px] text-[#95BDB0]">Fotos de alta qualidade</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSendPaymentInfo}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Dados M-Pesa / e-Mola</p>
                <p className="text-[10px] text-[#95BDB0]">Contas para transferência</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSendLocationInfo}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Locais de Entrega & Frete</p>
                <p className="text-[10px] text-[#95BDB0]">Opções e taxas configuradas</p>
              </div>
            </button>
          </div>
        )}

        {/* 3. Slash Command Suggestions Dropdown */}
        {matchingSlashReplies.length > 0 && (
          <div className="absolute bottom-full mb-2 left-3 right-3 z-40 bg-[#0F2D26] border border-[#2D6B5A] rounded-2xl shadow-2xl p-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="text-[10px] text-[#95BDB0] font-semibold uppercase px-2 py-1 border-b border-[#235447] mb-1">
              Atalhos de Resposta Rápida (Clique para usar)
            </div>
            {matchingSlashReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => {
                  if (reply.mediaUrl) {
                    onSendMessage(reply.content, reply.mediaType || 'image', reply.mediaUrl);
                  } else {
                    onSendMessage(reply.content, 'text');
                  }
                  setInputText('');
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-[#14382F] transition-colors text-left group cursor-pointer"
              >
                <span className="font-mono text-amber-400 font-bold">{reply.shortcut}</span>
                <span className="text-[#FDFEF8] font-medium truncate flex-1 mx-2">{reply.title}</span>
                <span className="text-[10px] text-[#95BDB0] group-hover:text-[#C1F76B]">Enviar ↵</span>
              </button>
            ))}
          </div>
        )}

        {/* Attached Media Multi-Staging Preview Bar */}
        {attachedMedias.length > 0 && (
          <div className="px-3.5 py-2.5 bg-[#0B241D] border-b border-[#235447] animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
            {/* Horizontal thumbnail scroll gallery */}
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-[#235447]">
              {attachedMedias.map((media, index) => {
                const isSelected = media.id === (activeMedia?.id || attachedMedias[0]?.id);
                const hasCaption = Boolean(media.caption && media.caption.trim().length > 0);

                return (
                  <div
                    key={media.id}
                    onClick={() => {
                      setSelectedMediaId(media.id);
                      textareaRef.current?.focus();
                    }}
                    className={`relative group w-14 h-14 rounded-xl overflow-hidden bg-black/60 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#C1F76B] opacity-100 shadow-md shadow-[#C1F76B]/25'
                        : 'border-2 border-[#235447] opacity-60 hover:opacity-100 hover:border-[#95BDB0]'
                    }`}
                    title={`Mídia ${index + 1}: ${media.name}${hasCaption ? ' (Com legenda)' : ' (Sem legenda)'}`}
                  >
                    {media.type === 'image' ? (
                      <img src={media.dataUrl} alt={media.name} className="w-full h-full object-cover" />
                    ) : media.type === 'video' ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <video src={media.dataUrl} className="w-full h-full object-cover opacity-80" />
                        <Play className="w-3.5 h-3.5 text-white fill-current absolute inset-0 m-auto drop-shadow" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#14382F] text-[#C1F76B] p-1">
                        <Mic className="w-4 h-4 mb-0.5" />
                        <span className="text-[8px] font-mono text-[#95BDB0] truncate max-w-full">Áudio</span>
                      </div>
                    )}

                    {/* Top-left Caption Indicator Badge */}
                    {hasCaption && (
                      <span
                        className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-[#C1F76B] text-[#0F2D26] flex items-center gap-0.5 shadow-sm"
                        title="Legenda configurada"
                      >
                        <FileText className="w-2.5 h-2.5" />
                      </span>
                    )}

                    {/* Top-right remove single item button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAttachedMedia(media.id);
                      }}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md opacity-90 group-hover:opacity-100"
                      title="Remover esta mídia"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>

                    {/* Bottom type badge */}
                    <span className="absolute bottom-0.5 left-0.5 px-1 rounded text-[7px] font-black uppercase tracking-tight bg-black/80 text-[#C1F76B] pointer-events-none">
                      {media.type === 'video' ? 'VÍD' : 'IMG'}
                    </span>
                  </div>
                );
              })}

              {/* Quick Add Plus Card at the end */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-xl border-2 border-dashed border-[#235447] hover:border-[#C1F76B] bg-[#14382F]/40 hover:bg-[#14382F] text-[#95BDB0] hover:text-[#C1F76B] flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors cursor-pointer"
                title="Adicionar mais arquivos"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[8px] font-bold">+ Mais</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Input Area: Voice Recording Mode OR Standard Input Mode */}
        {isRecordingAudio ? (
          <div className="p-3 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            {/* Left: Blinking recording dot & timer */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-bold font-mono text-sm tracking-wider">
                0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
              </span>
              <span className="text-[#95BDB0] text-xs hidden sm:inline">• Gravando áudio...</span>
            </div>

            {/* Center: Live dancing soundwave bars based on real mic audio levels */}
            <div className="flex-1 flex items-center justify-center gap-1 h-7 max-w-xs overflow-hidden px-2">
              {audioLevels.map((lvl, i) => (
                <span
                  key={i}
                  className="w-1.5 bg-[#C1F76B] rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(15, Math.min(100, lvl))}%`,
                  }}
                />
              ))}
            </div>

            {/* Right: Cancel & Send Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
                title="Cancelar Gravação"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="w-10 h-10 rounded-xl bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-[#C1F76B]/40 flex-shrink-0"
                title="Enviar Áudio Gravado"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {audioError && (
              <div className="mx-3 mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{audioError}</span>
              </div>
            )}

            <div className="p-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                }}
                className={`p-2 rounded-xl transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer ${
                  showEmojiPicker
                    ? 'text-[#C1F76B] bg-[#14382F]'
                    : 'text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
                }`}
                title="Inserir Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 rounded-xl transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer ${
                  showAttachMenu
                    ? 'text-[#C1F76B] bg-[#14382F]'
                    : 'text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
                }`}
                title="Anexar Fotos, Produtos ou Informações"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Input box with auto-adjusting height starting compact at 42px */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={currentInputValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(Math.max(42, target.scrollHeight), 128)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedMedias.length > 0
                    ? attachedMedias.length === 1
                      ? "Adicione uma legenda (opcional)..."
                      : `Legenda da mídia selecionada (${attachedMedias.findIndex(m => m.id === (activeMedia?.id || attachedMedias[0]?.id)) + 1}/${attachedMedias.length}) [opcional]...`
                    : "Digite uma mensagem ou digite / para atalhos..."
                }
                className="flex-1 min-h-[42px] max-h-32 bg-[#2D6B5A] text-sm text-[#FDFEF8] placeholder-[#95BDB0] px-3.5 py-2.5 rounded-2xl border border-transparent focus:border-[#C1F76B] focus:outline-none resize-none transition-[height] duration-75 leading-snug"
              />


              {inputText.trim() || attachedMedias.length > 0 ? (
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-10 h-10 rounded-xl bg-[#C1F76B] hover:bg-[#219653] hover:brightness-110 text-[#0F2D26] flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-[#C1F76B]/40 flex-shrink-0"
                  title={
                    attachedMedias.length > 0
                      ? `Enviar ${attachedMedias.length} mídia(s)`
                      : "Enviar mensagem"
                  }
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="w-10 h-10 rounded-xl bg-[#2D6B5A] hover:bg-[#C1F76B] text-[#95BDB0] hover:text-[#FDFEF8] flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
                  title="Gravar / Enviar Nota de Voz"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quick Tablet Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-sm text-[#FDFEF8]">Catálogo de Produtos ({catalogProducts.length})</h3>
              </div>
              <div className="flex items-center gap-3">
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCatalogModal(false);
                      onNavigateToSettings();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#C1F76B]/15 hover:bg-[#C1F76B]/25 text-[#C1F76B] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#C1F76B]/30"
                    title="Abrir Configurações do Catálogo"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configurar no Painel</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="p-1 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {catalogProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#14382F] border border-[#235447] flex items-center justify-center">
                    <Package className="w-7 h-7 text-[#578577]" />
                  </div>
                  <p className="text-sm font-bold text-[#FDFEF8]">Catálogo vazio</p>
                  <p className="text-xs text-[#95BDB0] max-w-xs leading-relaxed">
                    Nenhum produto cadastrado ainda. Adicione produtos em <strong className="text-[#FDFEF8]">Minha Loja → Catálogo</strong>.
                  </p>
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCatalogModal(false);
                        onNavigateToSettings();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Ir para Minha Loja
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalogProducts.map((item) => (
                    <CatalogProductCard key={item.id} item={item} onSend={handleSendTabletPhoto} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#FDFEF8]">Apagar mensagem?</h3>
              <p className="text-xs text-[#95BDB0] leading-relaxed">
                Deseja realmente apagar esta mensagem para todos? Esta ação será refletida na aplicação e no WhatsApp do destinatário.
              </p>
            </div>
            <div className="p-4 bg-[#14382F] border-t border-[#235447] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#235447] hover:bg-[#2D6B5A] text-[#FDFEF8] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (messageToDelete) {
                    onDeleteMessage?.(messageToDelete.id, messageToDelete.whatsappMessageId);
                    setMessageToDelete(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-900/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar para todos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maximized Media Viewer / Lightbox Gallery (Contained within Chat Area without overflowing) */}
      {viewingMedia && (
        <div
          className="absolute inset-0 z-50 flex flex-col bg-[#061411]/95 backdrop-blur-md select-none animate-in fade-in duration-150"
          onClick={handleCloseMediaViewer}
        >
          {/* Lightbox Header Bar */}
          <div
            className="h-14 px-4 bg-[#0F2D26]/95 border-b border-[#235447] flex items-center justify-between z-20 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-bold text-[#FDFEF8] bg-[#14382F] px-2.5 py-1 rounded-lg border border-[#235447]">
                Mídia {viewingMediaIndex! + 1} de {conversationMediaList.length}
              </span>
              <span className="text-[#95BDB0] truncate hidden sm:inline">
                {viewingMedia.fromMe ? 'Enviada por Você' : lead.name || 'Cliente'} • {viewingMedia.timestamp}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Expiry badge if applicable */}
              {(() => {
                const expiry = getMediaExpiryLabel(viewingMedia.createdAt);
                return expiry ? (
                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-300">
                    <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>{expiry}</span>
                  </div>
                ) : null;
              })()}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseMediaViewer}
                className="p-1.5 rounded-xl bg-[#14382F] hover:bg-[#235447] text-[#95BDB0] hover:text-[#FDFEF8] transition-colors cursor-pointer border border-[#235447]"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Media Area with Left / Right Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Navigation Arrow */}
            {conversationMediaList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevMedia}
                disabled={viewingMediaIndex === 0}
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#0F2D26]/90 hover:bg-[#14382F] text-[#FDFEF8] border border-[#235447] shadow-2xl transition-all duration-150 ${
                  viewingMediaIndex === 0
                    ? 'opacity-25 cursor-not-allowed'
                    : 'hover:scale-110 active:scale-95 cursor-pointer text-[#C1F76B] hover:border-[#C1F76B]/60'
                }`}
                title="Mídia anterior (Seta esquerda ⬅)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Main Maximized Media (strictly bounded to fit chat container without overflowing) */}
            <div className="w-full h-full flex items-center justify-center max-w-full max-h-full p-1">
              {viewingMedia.type === 'video' ? (
                <video
                  src={viewingMedia.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl bg-black border border-[#235447]"
                />
              ) : (
                <img
                  src={viewingMedia.mediaUrl}
                  alt={viewingMedia.mediaCaption || 'Mídia maximizada'}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-[#235447]/60 animate-in zoom-in-95 duration-150"
                />
              )}
            </div>

            {/* Right Navigation Arrow */}
            {conversationMediaList.length > 1 && (
              <button
                type="button"
                onClick={handleNextMedia}
                disabled={viewingMediaIndex === conversationMediaList.length - 1}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#0F2D26]/90 hover:bg-[#14382F] text-[#FDFEF8] border border-[#235447] shadow-2xl transition-all duration-150 ${
                  viewingMediaIndex === conversationMediaList.length - 1
                    ? 'opacity-25 cursor-not-allowed'
                    : 'hover:scale-110 active:scale-95 cursor-pointer text-[#C1F76B] hover:border-[#C1F76B]/60'
                }`}
                title="Próxima mídia (Seta direita ➡)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Lightbox Footer: Caption & Thumbnail Strip */}
          <div
            className="bg-[#0F2D26]/95 border-t border-[#235447] px-4 py-2.5 flex-shrink-0 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Caption if available */}
            {(viewingMedia.mediaCaption || viewingMedia.text) && (
              <p className="text-xs text-[#FDFEF8] text-center mb-2 px-3 py-1.5 bg-[#14382F] rounded-xl border border-[#235447] leading-relaxed max-h-16 overflow-y-auto">
                {viewingMedia.mediaCaption || viewingMedia.text}
              </p>
            )}

            {/* Thumbnails Carousel */}
            {conversationMediaList.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {conversationMediaList.map((mediaItem, idx) => {
                  const isCurrent = idx === viewingMediaIndex;
                  return (
                    <button
                      key={mediaItem.id}
                      type="button"
                      onClick={() => setViewingMediaIndex(idx)}
                      className={`w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-150 cursor-pointer border-2 relative ${
                        isCurrent
                          ? 'border-[#C1F76B] ring-2 ring-[#C1F76B]/40 scale-105 opacity-100 shadow-md'
                          : 'border-transparent opacity-50 hover:opacity-100 hover:border-[#95BDB0]'
                      }`}
                      title={`Ver mídia ${idx + 1}`}
                    >
                      {mediaItem.type === 'video' ? (
                        <div className="w-full h-full bg-[#14382F] flex items-center justify-center text-[#C1F76B]">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                      ) : (
                        <img
                          src={mediaItem.mediaUrl}
                          alt="Miniatura"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

