import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { 
  initialColumns, 
  initialContacts, 
  initialMessages, 
  defaultQuickReplies,
  initialInstances,
  initialStoreSettings
} from './mock/mockData';
import { 
  KanbanColumn, 
  ContactLead, 
  ChatMessage, 
  MessageType,
  MessageStatus,
  QuickReply, 
  CockpitViewMode,
  WhatsAppInstance,
  StoreSettings
} from './types';
import { Sidebar } from './components/cockpit/Sidebar';
import { Header } from './components/cockpit/Header';
import { MobileNav } from './components/cockpit/MobileNav';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ChatPanel } from './components/chat/ChatPanel';
import { FollowUpModal } from './components/followup/FollowUpModal';
import { FollowUpListModal } from './components/followup/FollowUpListModal';
import { ColumnManagerModal } from './components/kanban/ColumnManagerModal';
import { NewLeadModal } from './components/leads/NewLeadModal';
import { DeleteLeadModal } from './components/leads/DeleteLeadModal';
import { ImportCsvModal } from './components/leads/ImportCsvModal';
import { DeduplicateLeadsModal } from './components/leads/DeduplicateLeadsModal';
import { MetricsView } from './components/metrics/MetricsView';
import { LeadsListView } from './components/leads/LeadsListView';
import { QuickRepliesView } from './components/quickreplies/QuickRepliesView';
import { WhatsAppInstancesView } from './components/whatsapp/WhatsAppInstancesView';
import { StoreSettingsView } from './components/settings/StoreSettingsView';
import { MyStoreView } from './components/settings/MyStoreView';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { OnboardingPage } from './components/auth/OnboardingPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { LandingPage } from './components/landing/LandingPage';
import { useAuth } from './context/AuthContext';
import { kanbanService, DEFAULT_STORE_ID } from './services/kanbanService';
import { chatService } from './services/chatService';
import { storeService } from './services/storeService';
import { realtimeService } from './services/realtimeService';
import { evolutionService } from './services/evolutionService';
import { subscribeToPush, getPermissionStatus, onLeadOpenMessage, isPushSupported } from './services/pushService';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F2D26]">
        <div className="w-8 h-8 border-4 border-[#C1F76B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user has not completed store onboarding and is not already on /onboarding, redirect to /onboarding
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has already completed store onboarding and is on /onboarding, redirect to /cockpit
  if (user.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/cockpit" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// Public Only Route Wrapper (redirects if already logged in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F2D26]">
        <div className="w-8 h-8 border-4 border-[#C1F76B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (!user.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/cockpit" replace />;
  }
  return <>{children}</>;
};

function CockpitWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentStoreId = user?.storeId || DEFAULT_STORE_ID;

  // Determine active tab from current URL pathname
  const currentPath = location.pathname.replace('/', '').toLowerCase();
  const validTabs = ['cockpit', 'leads', 'quickreplies', 'metrics', 'store', 'whatsapp', 'account'];
  const activeTab = validTabs.includes(currentPath) ? currentPath : 'cockpit';

  const handleSelectTab = (tab: string) => {
    navigate('/' + tab);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Clean legacy mock data AND stale column/lead caches that may have mock IDs (col-new, etc.)
  useEffect(() => {
    localStorage.removeItem('lojinha_leads');
    localStorage.removeItem('lojinha_messages');
    // Remove stale column and lead caches — Supabase is always the source of truth
    localStorage.removeItem(`lojinha_columns_${currentStoreId}`);
    localStorage.removeItem(`lojinha_leads_${currentStoreId}`);
  }, [currentStoreId]);

  // SaaS Tenant-scoped State — start empty, always load from Supabase
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const columnsRef = useRef<KanbanColumn[]>([]);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const [leads, setLeads] = useState<ContactLead[]>([]);

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem(`lojinha_messages_${currentStoreId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(() => {
    const saved = localStorage.getItem(`lojinha_quick_replies_${currentStoreId}`);
    return saved ? JSON.parse(saved) : defaultQuickReplies;
  });

  const [instances, setInstances] = useState<WhatsAppInstance[]>(() => {
    const saved = localStorage.getItem(`lojinha_instances_${currentStoreId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`lojinha_store_settings_${currentStoreId}`);
    return saved ? JSON.parse(saved) : initialStoreSettings;
  });

  // When currentStoreId changes (e.g. from DEFAULT to real storeId after auth loads),
  // re-read localStorage so cached settings are restored before Supabase responds.
  const prevStoreIdRef = useRef<string>(currentStoreId);
  useEffect(() => {
    if (prevStoreIdRef.current === currentStoreId) return;
    prevStoreIdRef.current = currentStoreId;
    const saved = localStorage.getItem(`lojinha_store_settings_${currentStoreId}`);
    if (saved) {
      try { setStoreSettings(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [currentStoreId]);

  // UI state: on reload, default to full Kanban mode with chat closed
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLeadIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedLeadIdRef.current = selectedLeadId;
  }, [selectedLeadId]);

  // ── Push Notifications ──────────────────────────────────────────
  // Auto-subscribe to push when user has already granted permission
  useEffect(() => {
    if (!isPushSupported() || !currentStoreId) return;
    if (getPermissionStatus() === 'granted') {
      subscribeToPush(currentStoreId).catch(console.error);
    }
  }, [currentStoreId]);

  // Listen for "open lead" messages from the Service Worker (clicked notification)
  useEffect(() => {
    if (!isPushSupported()) return;
    const unsub = onLeadOpenMessage((leadId) => {
      setSelectedLeadId(leadId);
      setViewMode('split');
    });
    return unsub;
  }, []);

  const [viewMode, setViewMode] = useState<CockpitViewMode>('kanban-only');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isDeduplicateOpen, setIsDeduplicateOpen] = useState(false);
  const [newLeadDefaultColumn, setNewLeadDefaultColumn] = useState<string | undefined>();
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isFollowUpListOpen, setIsFollowUpListOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    isPushSupported() ? getPermissionStatus() : 'unsupported'
  );

  const handleEnablePush = async () => {
    const ok = await subscribeToPush(currentStoreId);
    if (ok) setPushPermission('granted');
  };

  const [leadForFollowUp, setLeadForFollowUp] = useState<ContactLead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<ContactLead | null>(null);

  // Ref for the chat panel — used by the click-outside handler below
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Click-outside to close chat:
  // - Clicking a Kanban card (data-kanban-card) → switches lead, chat stays open
  // - Clicking elsewhere outside the chat panel → closes chat
  useEffect(() => {
    if (window.innerWidth < 768) return; // mobile handled differently
    const isChatOpen = () => selectedLeadIdRef.current !== null;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isChatOpen()) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Click inside the chat panel → keep open
      if (chatPanelRef.current?.contains(target)) return;
      // Click on a kanban card → keep open (card onClick will switch the lead)
      if (target.closest('[data-kanban-card]')) return;
      // Click on any modal / overlay / dropdown → keep open
      if (target.closest('[role="dialog"]')) return;
      if (target.closest('[data-overlay]')) return;
      // Otherwise → close chat
      setSelectedLeadId(null);
      setViewMode('kanban-only');
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Input focus detection to hide bottom navigation during mobile keyboard typing
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);


  // 1. Initial Data Loading from Supabase (runs ONCE on mount / store switch — 0 polling loops)
  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseData() {
      try {
        const [dbCols, dbLeads, dbSettings, dbReplies, dbInstances] = await Promise.all([
          kanbanService.getColumns(currentStoreId),
          kanbanService.getLeads(currentStoreId),
          storeService.getStoreSettings(currentStoreId),
          storeService.getQuickReplies(currentStoreId),
          evolutionService.getInstances(currentStoreId).catch(() => []),
        ]);

        if (!isMounted) return;

        if (dbCols && dbCols.length > 0) {
          setColumns(dbCols);
        } else {
          // If Supabase has no columns yet, seed default columns
          const seedResult = await kanbanService.saveColumns(initialColumns, currentStoreId);
          if (seedResult.success && isMounted) {
            setColumns(seedResult.columns);
          }
        }

        if (dbLeads) {
          setLeads(dbLeads);
        }

        if (dbSettings) {
          setStoreSettings(dbSettings);
        }

        if (dbReplies) {
          setQuickReplies(dbReplies);
        }

        if (dbInstances) {
          setInstances(dbInstances);
        }
      } catch (err) {
        console.error('Initial data fetch from Supabase failed (using local cache):', err);
      }
    }

    loadSupabaseData();

    // 2. Realtime WebSocket Push Subscription (0ms latency, zero polling, zero unnecessary egress)
    const unsubscribe = realtimeService.subscribe({
      onMessageChange: ({ eventType, message, lead: incomingLead }) => {
        if (eventType === 'INSERT') {
          const leadId = message.contactId;
          const isCurrentlyActive = selectedLeadIdRef.current === leadId;

          // 1. Instantly update messages for the active or background chat (with smart de-duplication)
          setMessages((prev) => {
            const currentList = prev[leadId] || [];
            
            // Check if this exact message or a matching optimistic message already exists
            const existingIndex = currentList.findIndex(
              (m) =>
                m.id === message.id ||
                (message.fromMe &&
                  m.fromMe &&
                  (m.id.startsWith('msg-') || !m.id) &&
                  (m.text === message.text || m.mediaUrl === message.mediaUrl))
            );

            let updatedList: ChatMessage[];
            if (existingIndex !== -1) {
              // Replace existing / optimistic message with the confirmed realtime message
              updatedList = [...currentList];
              updatedList[existingIndex] = {
                ...updatedList[existingIndex],
                ...message,
              };
            } else {
              // Append new message
              updatedList = [...currentList, message];
            }

            return {
              ...prev,
              [leadId]: updatedList,
            };
          });

          // 2. Instantly update the lead card in Kanban
          setLeads((prev) => {
            const existing = prev.find((l) => l.id === leadId);
            const msgPreview =
              message.text ||
              (message.type === 'image'
                ? 'Foto recebida'
                : message.type === 'video'
                ? 'Vídeo recebido'
                : message.type === 'audio'
                ? 'Áudio recebido'
                : 'Mensagem recebida');

            if (isCurrentlyActive && !message.fromMe) {
              // Immediately sync database markAsRead
              chatService.markAsRead(leadId);
            }

            if (existing) {
              return prev.map((l) =>
                l.id === leadId
                  ? {
                      ...l,
                      lastMessage: msgPreview,
                      lastMessageTime: message.timestamp || 'Agora',
                      lastMessageTimestamp: Date.now(),
                      unreadCount: isCurrentlyActive || message.fromMe ? 0 : l.unreadCount + 1,
                    }
                  : l
              );
            } else if (incomingLead) {
              // Brand new lead card arriving in realtime
              const l = incomingLead;
              const fallbackColId = columnsRef.current[0]?.id || 'col-new';
              return [
                {
                  id: l.id || leadId,
                  name: l.name || message.contactId,
                  phone: l.phone || '',
                  avatar: l.avatar || undefined,
                  columnId: l.column_id || fallbackColId,
                  unreadCount: isCurrentlyActive || message.fromMe ? 0 : 1,
                  lastMessage: msgPreview,
                  lastMessageTime: message.timestamp || 'Agora',
                  lastMessageTimestamp: Date.now(),
                  dealValue: Number(l.deal_value) || 0,
                  tags: l.tags || [],
                  location: l.location,
                  childInfo: l.child_info,
                  productInterest: l.product_interest,
                  followUpDate: l.follow_up_date,
                  followUpNotes: l.follow_up_notes,
                  assignedTo: l.assigned_to,
                  stageHistory: l.stage_history || [],
                },
                ...prev,
              ];
            }
            return prev;
          });
        } else if (eventType === 'UPDATE') {
          setMessages((prev) => ({
            ...prev,
            [message.contactId]: (prev[message.contactId] || []).map((msg) =>
              msg.id === message.id ? { ...msg, ...message } : msg
            ),
          }));
        }
      },

      onLeadChange: ({ eventType, lead: l }) => {
        if (!l || !l.id) return;
        const isCurrentlyActive = selectedLeadIdRef.current === l.id;
        if (isCurrentlyActive && l.unread_count > 0) {
          chatService.markAsRead(l.id);
        }

        const fallbackColId = columnsRef.current[0]?.id || 'col-new';

        if (eventType === 'INSERT') {
          setLeads((prev) => [
            {
              id: l.id,
              name: l.name || '',
              phone: l.phone || '',
              avatar: l.avatar || undefined,
              columnId: l.column_id || fallbackColId,
              unreadCount: isCurrentlyActive ? 0 : (l.unread_count || 0),
              lastMessage: l.last_message || '',
              lastMessageTime: l.last_message_time || 'Agora',
              lastMessageTimestamp: Number(l.last_message_timestamp) || Date.now(),
              dealValue: Number(l.deal_value) || 0,
              tags: l.tags || [],
              location: l.location,
              childInfo: l.child_info,
              productInterest: l.product_interest,
              followUpDate: l.follow_up_date,
              followUpNotes: l.follow_up_notes,
              assignedTo: l.assigned_to,
              stageHistory: l.stage_history || [],
            },
            ...prev.filter((item) => item.id !== l.id),
          ]);
        } else if (eventType === 'UPDATE') {
          setLeads((prev) =>
            prev.map((item) =>
              item.id === l.id
                ? {
                    ...item,
                    name: l.name ?? item.name,
                    phone: l.phone ?? item.phone,
                    avatar: l.avatar || item.avatar,
                    columnId: l.column_id ?? item.columnId,
                    unreadCount: isCurrentlyActive ? 0 : (l.unread_count ?? item.unreadCount),
                    lastMessage: l.last_message ?? item.lastMessage,
                    lastMessageTime: l.last_message_time ?? item.lastMessageTime,
                    dealValue: Number(l.deal_value ?? item.dealValue),
                    followUpDate: l.follow_up_date ?? item.followUpDate,
                    followUpNotes: l.follow_up_notes ?? item.followUpNotes,
                    stageHistory: l.stage_history || item.stageHistory,
                  }
                : item
            )
          );
        } else if (eventType === 'DELETE') {
          setLeads((prev) => prev.filter((item) => item.id !== l.id));
        }
      },

      onReceiptUpdate: ({ leadId, status }) => {
        setMessages((prev) => {
          if (!prev[leadId]) return prev;
          return {
            ...prev,
            [leadId]: prev[leadId].map((m) =>
              m.fromMe && (m.status === 'sent' || m.status === 'delivered')
                ? { ...m, status }
                : m
            ),
          };
        });
      },

      onMessageDeleted: ({ messageId, leadId }) => {
        setMessages((prev) => {
          if (!prev[leadId]) return prev;
          return {
            ...prev,
            [leadId]: prev[leadId].map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    status: 'deleted',
                    text: 'Esta mensagem foi apagada',
                    mediaUrl: undefined,
                    mediaCaption: undefined,
                    deletedAt: new Date().toISOString(),
                  }
                : m
            ),
          };
        });
      },

      onWhatsAppInstanceChange: ({ eventType, instance: inst }) => {
        if (!inst || !inst.id) return;
        if (eventType === 'INSERT') {
          setInstances((prev) => [
            ...prev.filter((i) => i.id !== inst.id),
            {
              id: inst.id,
              instanceName: inst.name || inst.id,
              name: inst.name || 'Instância WhatsApp',
              phone: inst.phone || undefined,
              status: inst.status || 'disconnected',
              profilePic: inst.profile_pic || undefined,
              messagesToday: inst.messages_today || 0,
              isDefault: inst.is_default || false,
              batteryLevel: inst.battery_level || undefined,
              lastConnected: inst.last_connected || 'Agora',
            },
          ]);
        } else if (eventType === 'UPDATE') {
          setInstances((prev) =>
            prev.map((i) =>
              i.id === inst.id
                ? {
                    ...i,
                    name: inst.name || i.name,
                    phone: inst.phone || i.phone,
                    status: inst.status || i.status,
                    profilePic: inst.profile_pic || i.profilePic,
                    messagesToday: inst.messages_today ?? i.messagesToday,
                    isDefault: inst.is_default ?? i.isDefault,
                    lastConnected: inst.last_connected || i.lastConnected,
                  }
                : i
            )
          );
        } else if (eventType === 'DELETE') {
          setInstances((prev) => prev.filter((i) => i.id !== inst.id));
        }
      },
    }, currentStoreId);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentStoreId]);


  // Local storage caching for offline buffer (scoped by tenant)
  useEffect(() => {
    try {
      localStorage.setItem(`lojinha_columns_${currentStoreId}`, JSON.stringify(columns));
    } catch (e) {
      console.warn('[LocalStorage] Columns cache error:', e);
    }
  }, [columns, currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lojinha_leads_${currentStoreId}`, JSON.stringify(leads));
    } catch (e) {
      console.warn('[LocalStorage] Leads cache error:', e);
    }
  }, [leads, currentStoreId]);

  useEffect(() => {
    try {
      // Remove bulky base64 data URLs to prevent QuotaExceededError (5MB limit)
      // Supabase already safely stores the messages.
      const safeCache: Record<string, ChatMessage[]> = {};
      for (const [leadId, list] of Object.entries(messages)) {
        safeCache[leadId] = list.slice(-20).map((m) => ({
          ...m,
          mediaUrl: m.mediaUrl && m.mediaUrl.startsWith('data:') ? undefined : m.mediaUrl,
        }));
      }
      localStorage.setItem(`lojinha_messages_${currentStoreId}`, JSON.stringify(safeCache));
    } catch (e) {
      console.warn('[LocalStorage] Messages cache quota exceeded. Safe in Supabase:', e);
    }
  }, [messages, currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lojinha_quick_replies_${currentStoreId}`, JSON.stringify(quickReplies));
    } catch (e) {
      console.warn('[LocalStorage] Quick replies cache error:', e);
    }
  }, [quickReplies, currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lojinha_instances_${currentStoreId}`, JSON.stringify(instances));
    } catch (e) {
      console.warn('[LocalStorage] Instances cache error:', e);
    }
  }, [instances, currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lojinha_store_settings_${currentStoreId}`, JSON.stringify(storeSettings));
    } catch (e) {
      console.warn('[LocalStorage] Store settings cache error:', e);
    }
  }, [storeSettings, currentStoreId]);

  // Selected lead object
  const activeLead = leads.find((l) => l.id === selectedLeadId) || null;
  const isMobileNavHidden = Boolean((selectedLeadId && activeLead) || isInputFocused);
  const activeChatMessages = selectedLeadId ? messages[selectedLeadId] || [] : [];
  const defaultInstance = instances.find((i) => i.isDefault) || instances[0];

  // Filtered leads by search term
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.phone.includes(term) ||
      (lead.location && lead.location.toLowerCase().includes(term)) ||
      (lead.productInterest && lead.productInterest.toLowerCase().includes(term)) ||
      lead.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  // Financial and follow-up aggregations
  const totalRevenue = leads.reduce((acc, curr) => acc + curr.dealValue, 0);
  const leadsWithFollowUp = leads.filter((l) => l.followUpDate);

  // Handlers with Supabase Realtime Persistence
  const handleMoveLead = (leadId: string, targetColumnId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.columnId === targetColumnId) return; // No real movement

    const fromCol = columns.find((c) => c.id === lead.columnId);
    const toCol = columns.find((c) => c.id === targetColumnId);

    const now = Date.now();
    const dt = new Date(now);
    const pad = (n: number) => String(n).padStart(2, '0');
    const label = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)} às ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    const historyEntry = {
      fromColumnId: lead.columnId,
      fromColumnTitle: fromCol?.title || lead.columnId,
      toColumnId: targetColumnId,
      toColumnTitle: toCol?.title || targetColumnId,
      movedAt: now,
      movedAtLabel: label,
    };

    // Optimistic state update
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          columnId: targetColumnId,
          stageHistory: [...(l.stageHistory || []), historyEntry],
        };
      })
    );

    // Persist to Supabase
    kanbanService.moveLeadColumn(leadId, targetColumnId, historyEntry, lead.stageHistory);
  };

  const handleSaveColumns = async (newCols: KanbanColumn[]) => {
    try {
      const result = await kanbanService.saveColumns(newCols, currentStoreId);
      if (result.success) {
        setColumns(result.columns);
        // If any columns were deleted, safely remap local leads state to the fallback column
        if (result.deletedColumnIds.length > 0 && result.fallbackColumnId) {
          const fallbackId = result.fallbackColumnId;
          setLeads((prev) =>
            prev.map((lead) =>
              result.deletedColumnIds.includes(lead.columnId)
                ? { ...lead, columnId: fallbackId }
                : lead
            )
          );
        }
      } else {
        console.error('Falha ao salvar colunas do Kanban:', result.error);
        alert('Erro ao salvar as etapas no banco de dados. Por favor, tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao salvar colunas:', err);
      alert('Erro inesperado ao salvar as etapas do Kanban.');
    }
  };

  const handleSelectLead = (lead: ContactLead) => {
    // Se clicar no mesmo card que já está aberto no modo Cockpit, fecha o chat e entra no modo do Kanban
    if (selectedLeadId === lead.id && viewMode === 'split') {
      setSelectedLeadId(null);
      setViewMode('kanban-only');
      return;
    }

    // Ao clicar em um card, abre o chat no Modo Cockpit
    setSelectedLeadId(lead.id);
    setViewMode('split');

    // Limpar contador de não lidas no Supabase e no state
    if (lead.unreadCount > 0) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, unreadCount: 0 } : l))
      );
      chatService.markAsRead(lead.id);
    }

    // Carregar mensagens do Supabase e mesclar com estado local
    chatService.getMessages(lead.id).then((dbMsgs) => {
      if (dbMsgs.length > 0) {
        setMessages((prev) => {
          const existing = prev[lead.id] || [];
          const map = new Map<string, ChatMessage>();
          dbMsgs.forEach((m) => map.set(m.id, m));
          existing.forEach((m) => {
            if (!map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          const combined = Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          return {
            ...prev,
            [lead.id]: combined,
          };
        });
      }
    });

    // Se o lead não tem avatar, dispara busca em background via backend
    if (!lead.avatar) {
      fetch(`/api/leads/${lead.id}/refresh-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': (import.meta.env.VITE_INTERNAL_SECRET as string) ?? '',
          'x-store-id': currentStoreId,
        },
      }).catch(() => {/* silently ignore */});
    }
  };

  const handleSendMessage = (
    text: string, 
    type: MessageType = 'text', 
    mediaUrl?: string,
    audioDuration?: string
  ) => {
    if (!selectedLeadId) return;

    const leadId = selectedLeadId;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const cleanText = text ? text.trim() : '';
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newMsg: ChatMessage = {
      id: tempId,
      contactId: leadId,
      fromMe: true,
      type,
      text: type === 'text' ? cleanText : undefined,
      mediaUrl,
      mediaCaption: (type === 'image' || type === 'video') ? (cleanText || undefined) : undefined,
      audioDuration: type === 'audio' ? (audioDuration || '0:15') : undefined,
      timestamp: timeStr,
      fullDate: `Hoje, ${timeStr}`,
      status: 'pending', // Inicia em envio/processamento como no WhatsApp
      createdAt: now.toISOString(),
    };

    // Optimistic UI update: exibe a mensagem imediatamente com indicador de envio
    setMessages((prev) => ({
      ...prev,
      [leadId]: [...(prev[leadId] || []), newMsg],
    }));

    // Update lead last message in UI
    const lastMsgText =
      type === 'audio'
        ? 'Nota de voz enviada'
        : type === 'video'
        ? (cleanText ? `Vídeo: ${cleanText}` : 'Vídeo enviado')
        : type === 'image'
        ? (cleanText ? `Foto: ${cleanText}` : 'Foto enviada')
        : cleanText;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              lastMessage: lastMsgText,
              lastMessageTime: timeStr,
              lastMessageTimestamp: Date.now(),
            }
          : l
      )
    );

    // Asynchronous delivery to WhatsApp & Supabase
    (async () => {
      const targetLead = leads.find((l) => l.id === leadId);
      let evolutionSuccess = false;
      let returnedWaId: string | undefined = undefined;
      let returnedMediaUrl: string | undefined = undefined;

      if (targetLead?.phone) {
        try {
          if (type === 'text' && cleanText) {
            const resp = await evolutionService.sendText(targetLead.phone, cleanText, undefined, currentStoreId);
            evolutionSuccess = true;
            returnedWaId = resp?.whatsappMessageId;
          } else if (mediaUrl) {
            const resp = await evolutionService.sendMedia(
              targetLead.phone,
              mediaUrl,
              type === 'audio' ? 'audio' : type === 'video' ? 'video' : type === 'document' ? 'document' : 'image',
              cleanText || undefined,
              undefined,
              currentStoreId
            );
            evolutionSuccess = true;
            returnedWaId = resp?.whatsappMessageId;
            returnedMediaUrl = resp?.mediaUrl;
          }
        } catch (err) {
          console.error('[Evolution] Error sending to WhatsApp:', err);
        }
      } else {
        evolutionSuccess = true;
      }

      const initialSentStatus: MessageStatus = evolutionSuccess ? 'sent' : 'failed';

      // Atualiza o estado da interface imediatamente assim que a Evolution API confirma o despacho
      setMessages((prev) => ({
        ...prev,
        [leadId]: (prev[leadId] || []).map((m) =>
          m.id === tempId
            ? {
                ...m,
                status: initialSentStatus,
                whatsappMessageId: returnedWaId || m.whatsappMessageId,
                mediaUrl: returnedMediaUrl || m.mediaUrl,
              }
            : m
        ),
      }));

      // Persist message to Supabase with current store ID
      try {
        const saved = await chatService.sendMessage(
          leadId,
          {
            ...newMsg,
            status: initialSentStatus,
            mediaUrl: returnedMediaUrl || newMsg.mediaUrl,
          },
          currentStoreId
        );

        if (saved) {
          setMessages((prev) => ({
            ...prev,
            [leadId]: (prev[leadId] || []).map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: saved.id,
                    createdAt: saved.createdAt || m.createdAt,
                    mediaUrl: saved.mediaUrl || m.mediaUrl,
                  }
                : m
            ),
          }));
        }
      } catch (dbErr) {
        console.error('[Chat] Error saving message to Supabase:', dbErr);
      }
    })();
  };

  const handleOpenFollowUp = (lead: ContactLead) => {
    setLeadForFollowUp(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (
    leadId: string,
    followUpDate: string,
    notes: string,
    followUpType: 'followup' | 'entrega' = 'followup',
    delivery?: { address?: string; product?: string; quantity?: string; value?: number }
  ) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              followUpDate,
              followUpNotes: notes,
              followUpType,
              deliveryAddress: delivery?.address,
              deliveryProduct: delivery?.product,
              deliveryQuantity: delivery?.quantity,
              deliveryValue: delivery?.value,
            }
          : l
      )
    );
    kanbanService.updateFollowUp(leadId, followUpDate, notes, followUpType, delivery);
  };

  const handleClearFollowUp = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, followUpDate: undefined, followUpNotes: undefined, followUpType: undefined }
          : l
      )
    );
    kanbanService.updateFollowUp(leadId, undefined, undefined, 'followup', undefined);
  };

  const handleUpdateLead = (updatedLead: ContactLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
    );
    kanbanService.updateLead(updatedLead.id, updatedLead);
  };

  const handleConfirmDeleteLead = async (leadId: string) => {
    // 1. Optimistic UI update
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
      setViewMode('kanban-only');
    }
    setMessages((prev) => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });

    // 2. Cascade delete in Supabase (messages then lead)
    await kanbanService.deleteLead(leadId);
  };

  const handleDeleteDuplicateLeads = async (leadIdsToDelete: string[]): Promise<boolean> => {
    if (leadIdsToDelete.length === 0) return true;
    const idSet = new Set(leadIdsToDelete);

    // 1. Optimistic UI update
    setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
    if (selectedLeadId && idSet.has(selectedLeadId)) {
      setSelectedLeadId(null);
      setViewMode('kanban-only');
    }
    setMessages((prev) => {
      const next = { ...prev };
      leadIdsToDelete.forEach((id) => delete next[id]);
      return next;
    });

    // 2. Cascade batch delete from Supabase
    const { success } = await kanbanService.deleteMultipleLeads(leadIdsToDelete);
    return success > 0;
  };

  const handleAddLeadToColumn = (columnId: string) => {
    setNewLeadDefaultColumn(columnId);
    setIsNewLeadOpen(true);
  };

  const handleCreateLead = (newLead: ContactLead, initialMessage: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Optimistic UI
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);
    setViewMode('split');
    navigate('/cockpit');

    const firstMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      contactId: newLead.id,
      fromMe: false,
      type: 'text',
      text: initialMessage,
      timestamp: timeStr,
      fullDate: `Hoje, ${timeStr}`,
      status: 'delivered',
    };

    setMessages((prev) => ({
      ...prev,
      [newLead.id]: [firstMsg],
    }));

    // Persist lead and initial message in Supabase
    kanbanService.createLead(newLead, currentStoreId).then((created) => {
      const finalId = created ? created.id : newLead.id;
      if (created) {
        setLeads((prev) => prev.map((l) => (l.id === newLead.id ? created : l)));
        setSelectedLeadId(finalId);
      }
      chatService.sendMessage(finalId, {
        contactId: finalId,
        fromMe: false,
        type: 'text',
        text: initialMessage,
        timestamp: timeStr,
        fullDate: `Hoje, ${timeStr}`,
        status: 'delivered',
      }, currentStoreId);
    });
  };

  const handleDeleteMessage = async (messageId: string, whatsappMessageId?: string) => {
    if (!selectedLeadId) return;
    const leadId = selectedLeadId;
    const activeInstance = instances.find((i) => i.isDefault) || instances[0];

    // Optimistic update: mark as deleted immediately
    setMessages((prev) => ({
      ...prev,
      [leadId]: (prev[leadId] || []).map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              status: 'deleted',
              text: 'Esta mensagem foi apagada',
              mediaUrl: undefined,
              mediaCaption: undefined,
              deletedAt: new Date().toISOString(),
            }
          : msg
      ),
    }));

    try {
      await evolutionService.deleteMessage(messageId, whatsappMessageId, activeInstance?.id, currentStoreId);
    } catch (err) {
      console.error('[App] handleDeleteMessage error:', err);
      // No rollback needed — the DB update will sync via realtime or user can refresh
    }
  };

  const handleSetDefaultInstance = async (instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) => ({
        ...inst,
        isDefault: inst.id === instanceId,
      }))
    );
    try {
      await evolutionService.setDefault(currentStoreId, instanceId);
    } catch (err) {
      console.error('Failed to set default instance in Evolution:', err);
    }
  };

  const handleSaveStoreSettings = async (updated: StoreSettings) => {
    setStoreSettings(updated); // Optimistically update local state immediately
    const ok = await storeService.saveStoreSettings(updated, currentStoreId);
    if (!ok) {
      console.error('[App] Failed to save store settings to Supabase — check RLS policies on stores/store_settings tables.');
    }
  };

  const handleSaveQuickReplies = async (updated: QuickReply[]) => {
    setQuickReplies(updated);
    try {
      await storeService.saveQuickReplies(updated, currentStoreId);
    } catch (err) {
      console.error('Failed to persist quick replies to Supabase:', err);
    }
  };

  return (
    <div className="w-full max-w-[100vw] min-h-[100dvh] bg-[#091E19] text-[#FDFEF8] font-sans relative md:flex md:flex-row md:h-screen md:overflow-hidden overflow-x-hidden selection:bg-[#C1F76B]/30 selection:text-[#FDFEF8]">
      {/* Ambient Glows matching Landing Page */}
      <div className="absolute top-10 left-1/3 w-[500px] max-w-full h-[300px] bg-[#C1F76B]/05 rounded-full blur-[140px] pointer-events-none overflow-hidden" />
      <div className="absolute bottom-10 right-10 w-80 max-w-full h-80 bg-[#27AE60]/05 rounded-full blur-[120px] pointer-events-none overflow-hidden" />

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        totalLeads={leads.length}
        totalRevenue={totalRevenue}
        pendingFollowUps={leadsWithFollowUp.length}
        connectedInstancesCount={instances.filter((i) => i.status === 'connected').length}
        storeName={storeSettings.storeName}
        storeLogoUrl={storeSettings.logoUrl}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area (Natural flow on mobile matching landing page) */}
      <main className="w-full max-w-full overflow-x-hidden pt-[4.5rem] md:pt-0 pb-24 md:pb-0 md:flex-1 md:flex md:flex-col md:h-full md:overflow-hidden md:min-h-0 min-w-0">
        {/* 2. Top Floating Header */}
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenColumnManager={() => setIsColumnManagerOpen(true)}
          onOpenNewLead={() => {
            setNewLeadDefaultColumn(undefined);
            setIsNewLeadOpen(true);
          }}
          onOpenImportCsv={() => setIsImportCsvOpen(true)}
          onOpenDeduplicate={() => setIsDeduplicateOpen(true)}
          onOpenFollowUpList={() => setIsFollowUpListOpen(true)}
          pendingFollowUpsCount={leadsWithFollowUp.length}
          totalFilteredLeads={filteredLeads.length}
          activeInstanceName={defaultInstance?.name}
          activeInstanceStatus={defaultInstance?.status}
          onNavigateToWhatsApp={() => navigate('/whatsapp')}
        />


        {/* Push Notification Permission Banner */}
        {pushPermission === 'default' && isPushSupported() && (
          <div className="mx-3 mt-2 mb-0 flex items-center justify-between gap-3 bg-[#0F2D26] border border-[#C1F76B]/30 rounded-2xl px-4 py-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs text-[#D1EAE0]">
              <span className="text-lg">🔔</span>
              <span>Ative as notificações para receber alertas de mensagens e agendamentos mesmo com o app fechado.</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] transition-all cursor-pointer whitespace-nowrap"
            >
              Ativar
            </button>
          </div>
        )}

        {/* 3. Dynamic Views based on active route */}
        {activeTab === 'metrics' ? (
          <MetricsView columns={columns} leads={leads} />
        ) : activeTab === 'leads' ? (
          <div className="w-full md:flex-1 md:flex md:flex-row md:h-full md:overflow-hidden relative">
            <div className={`w-full md:flex-1 md:h-full md:overflow-hidden md:flex md:flex-col ${selectedLeadId && activeLead ? 'hidden md:flex' : 'block'}`}>
              <LeadsListView
                leads={leads}
                columns={columns}
                selectedLeadId={selectedLeadId}
                onOpenImportCsv={() => setIsImportCsvOpen(true)}
                onOpenDeduplicate={() => setIsDeduplicateOpen(true)}
                onSelectLeadForChat={(l) => {
                  if (selectedLeadId === l.id) {
                    setSelectedLeadId(null);
                  } else {
                    setSelectedLeadId(l.id);
                    if (l.unreadCount > 0) {
                      setLeads((prev) =>
                        prev.map((lead) => (lead.id === l.id ? { ...lead, unreadCount: 0 } : lead))
                      );
                      chatService.markAsRead(l.id);
                    }
                    chatService.getMessages(l.id).then((dbMsgs) => {
                      if (dbMsgs.length > 0) {
                        setMessages((prev) => {
                          const existing = prev[l.id] || [];
                          const map = new Map<string, ChatMessage>();
                          dbMsgs.forEach((m) => map.set(m.id, m));
                          existing.forEach((m) => {
                            if (!map.has(m.id)) {
                              map.set(m.id, m);
                            }
                          });
                          const combined = Array.from(map.values()).sort(
                            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                          );
                          return {
                            ...prev,
                            [l.id]: combined,
                          };
                        });
                      }
                    });
                  }
                }}
                onOpenFollowUpModal={handleOpenFollowUp}
                onDeleteLead={(l) => setLeadToDelete(l)}
              />
            </div>

            {/* Right Chat Panel inside Leads view without navigating away */}
            {selectedLeadId && activeLead && (
              <div
                ref={chatPanelRef}
                className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto md:flex h-full w-full md:w-auto"
              >
                <ChatPanel
                  lead={activeLead}
                  columns={columns}
                  messages={activeChatMessages}
                  quickReplies={quickReplies}
                  storeSettings={storeSettings}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onChangeColumn={handleMoveLead}
                  onOpenFollowUpModal={handleOpenFollowUp}
                  onUpdateLead={handleUpdateLead}
                  onCloseChat={() => setSelectedLeadId(null)}
                  onNavigateToSettings={() => navigate('/store')}
                />
              </div>
            )}

          </div>
        ) : activeTab === 'quickreplies' ? (
          <QuickRepliesView
            quickReplies={quickReplies}
            onSaveReplies={handleSaveQuickReplies}
          />
        ) : activeTab === 'whatsapp' ? (
          <WhatsAppInstancesView
            instances={instances}
            storeId={currentStoreId}
            onSaveInstances={setInstances}
            onSelectDefaultInstance={handleSetDefaultInstance}
          />
        ) : activeTab === 'store' ? (
          <MyStoreView
            store={storeSettings}
            onSaveStore={handleSaveStoreSettings}
          />
        ) : activeTab === 'account' ? (
          <StoreSettingsView
            store={storeSettings}
            onSaveStore={handleSaveStoreSettings}
          />
        ) : (
          /* Cockpit Mode: Central Kanban + Live Chat Side by Side */
          <div className="w-full md:flex-1 md:flex md:flex-row md:h-full md:overflow-hidden relative">
            {/* Center Kanban Board */}
            <div className={`w-full md:flex-1 md:h-full md:overflow-hidden md:flex md:flex-col ${viewMode === 'split' ? 'hidden md:flex' : 'block'}`}>
              <KanbanBoard
                columns={columns}
                leads={filteredLeads}
                selectedLeadId={viewMode === 'split' ? selectedLeadId : null}
                onSelectLead={handleSelectLead}
                onMoveLead={handleMoveLead}
                onEditColumn={() => setIsColumnManagerOpen(true)}
                onAddNewColumn={() => setIsColumnManagerOpen(true)}
                onOpenFollowUpModal={handleOpenFollowUp}
                onAddLeadToColumn={handleAddLeadToColumn}
              />
            </div>

            {/* Right Chat Panel (Active only in Cockpit split mode) */}
            {viewMode === 'split' && (
              <div
                ref={chatPanelRef}
                className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto md:flex h-full w-full md:w-auto"
              >
                <ChatPanel
                  lead={activeLead}
                  columns={columns}
                  messages={activeChatMessages}
                  quickReplies={quickReplies}
                  storeSettings={storeSettings}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onChangeColumn={handleMoveLead}
                  onOpenFollowUpModal={handleOpenFollowUp}
                  onUpdateLead={handleUpdateLead}
                  onCloseChat={() => {
                    setSelectedLeadId(null);
                    setViewMode('kanban-only');
                  }}
                  onNavigateToSettings={() => navigate('/store')}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) + above bottom nav */}
      {!isMobileNavHidden && (
        <button
          type="button"
          onClick={() => {
            setNewLeadDefaultColumn(undefined);
            setIsNewLeadOpen(true);
          }}
          className="fixed bottom-20 right-4 md:hidden z-40 w-12 h-12 rounded-full bg-[#C1F76B] text-[#0F2D26] shadow-2xl shadow-[#C1F76B]/40 flex items-center justify-center font-bold text-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-[#0F2D26]"
          title="Adicionar Novo Lead"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      )}

      {/* Mobile Bottom Navigation Bar & Drawer (Mobile Only) */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        totalLeads={leads.length}
        unreadLeadsCount={leads.filter((l) => (l.unreadCount || 0) > 0).length}
        connectedInstancesCount={instances.filter((i) => i.status === 'connected').length}
        storeName={storeSettings.storeName}
        storeLogoUrl={storeSettings.logoUrl}
        onOpenImportCsv={() => setIsImportCsvOpen(true)}
        onOpenDeduplicate={() => setIsDeduplicateOpen(true)}
        onOpenColumnManager={() => setIsColumnManagerOpen(true)}
        onLogout={handleLogout}
        hidden={isMobileNavHidden}
      />

      {/* Modals */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        lead={leadForFollowUp}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setLeadForFollowUp(null);
        }}
        onSave={handleSaveFollowUp}
        onClear={handleClearFollowUp}
      />

      <FollowUpListModal
        isOpen={isFollowUpListOpen}
        leadsWithFollowUp={leadsWithFollowUp}
        onClose={() => setIsFollowUpListOpen(false)}
        onSelectLeadForChat={handleSelectLead}
        onResolveFollowUp={handleClearFollowUp}
      />

      <ColumnManagerModal
        isOpen={isColumnManagerOpen}
        columns={columns}
        onClose={() => setIsColumnManagerOpen(false)}
        onSaveColumns={handleSaveColumns}
      />

      <NewLeadModal
        isOpen={isNewLeadOpen}
        columns={columns}
        defaultColumnId={newLeadDefaultColumn}
        onClose={() => setIsNewLeadOpen(false)}
        onCreateLead={handleCreateLead}
      />

      <DeleteLeadModal
        isOpen={!!leadToDelete}
        lead={leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirmDelete={handleConfirmDeleteLead}
      />

      <ImportCsvModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        columns={columns}
        currentStoreId={currentStoreId}
        onSuccess={(newLeads) => {
          setLeads((prev) => [...newLeads, ...prev]);
        }}
      />

      <DeduplicateLeadsModal
        isOpen={isDeduplicateOpen}
        onClose={() => setIsDeduplicateOpen(false)}
        leads={leads}
        columns={columns}
        onDeleteDuplicateLeads={handleDeleteDuplicateLeads}
      />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verify-email"
        element={<EmailVerificationPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected Cockpit Workspace Routes */}
      <Route
        path="/cockpit"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quickreplies"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metrics"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <CockpitWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
