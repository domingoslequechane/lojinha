export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  slaHours: number; // Horas máximas antes de emitir alerta de inatividade
  defaultTemplateId?: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';


export interface ChatMessage {
  id: string;
  contactId: string;
  fromMe: boolean;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  audioDuration?: string; // ex: "0:34"
  timestamp: string; // ex: "14:22"
  fullDate: string;
  status: MessageStatus;
  createdAt?: string; // ISO 8601 — used to compute media expiry countdown
  whatsappMessageId?: string; // WA message ID for deletion via Evolution API
  deletedAt?: string; // ISO 8601 — set when message is deleted for everyone
}

export interface StageHistoryEntry {
  fromColumnId: string;
  fromColumnTitle: string;
  toColumnId: string;
  toColumnTitle: string;
  movedAt: number; // Unix timestamp ms
  movedAtLabel: string; // Human readable, ex: "16/09 às 14:32"
}

export interface ContactLead {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  columnId: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimestamp: number;
  dealValue: number; // em Meticais (MT)
  tags: string[];
  location?: string;
  childInfo?: string; // ex: "Menino 4 anos"
  productInterest?: string; // ex: "Tablet 7' Rosa"
  followUpDate?: string; // Data ISO ou texto ex: "2026-09-17T10:00"
  followUpNotes?: string;
  assignedTo?: string;
  stageHistory?: StageHistoryEntry[]; // Rastreamento de etapas percorridas
}

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  category: 'demonstracao' | 'pagamento' | 'entrega' | 'followup';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export type WhatsAppInstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'paused';

export interface WhatsAppInstance {
  id: string;
  name: string;
  instanceName?: string;
  phone?: string;
  status: WhatsAppInstanceStatus;
  profilePic?: string;
  messagesToday: number;
  isDefault: boolean;
  batteryLevel?: number;
  lastConnected?: string;
}

export interface StoreProduct {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  caption: string;
}

export interface PaymentSettings {
  mpesaNumber: string;
  mpesaName: string;
  emolaNumber: string;
  emolaName: string;
  bankName?: string;
  bankAccount?: string;
  customInstructions?: string;
}

export interface ShippingSettings {
  maputoFee: string;
  matolaFee: string;
  provincesFee: string;
  pickupAddress: string;
  shippingNotes?: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  loginName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string;
  bannerUrl: string;
  bannerPositionX: number; // 0-100, default 50
  bannerPositionY: number; // 0-100, default 50
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  websiteUrl: string;
  twoFactorWhatsAppEnabled?: boolean;
  twoFactorPhone?: string;
  products?: StoreProduct[];
  paymentSettings?: PaymentSettings;
  shippingSettings?: ShippingSettings;
}

export type CockpitViewMode = 'split' | 'kanban-only';
