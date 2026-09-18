import { KanbanColumn, ContactLead, ChatMessage, QuickReply, WhatsAppInstance, StoreSettings } from '../types';

// Default starter columns for new stores (SaaS Template)
export const initialColumns: KanbanColumn[] = [
  {
    id: 'col-new',
    title: 'Novo Lead (WhatsApp)',
    color: '#38bdf8',
    order: 0,
    slaHours: 1,
  },
  {
    id: 'col-demo',
    title: 'Em Demonstração / Catálogo',
    color: '#a78bfa',
    order: 1,
    slaHours: 3,
  },
  {
    id: 'col-validation',
    title: 'Validação c/ Família',
    color: '#f59e0b',
    order: 2,
    slaHours: 24,
  },
  {
    id: 'col-freight',
    title: 'Localização / Frete',
    color: '#eab308',
    order: 3,
    slaHours: 4,
  },
  {
    id: 'col-scheduled',
    title: 'Agendado (Salário / Reserva)',
    color: '#27AE60',
    order: 4,
    slaHours: 48,
  },
];

// Completely clean - No fake leads
export const initialContacts: ContactLead[] = [];

// Completely clean - No fake messages
export const initialMessages: Record<string, ChatMessage[]> = {};

// Clean starter quick replies - completely empty for user to configure
export const defaultQuickReplies: QuickReply[] = [];

// Completely clean - No fake WhatsApp instances
export const initialInstances: WhatsAppInstance[] = [];

// Default clean store settings
export const initialStoreSettings: StoreSettings = {
  storeName: 'Minha Loja',
  slogan: 'A tua loja, simples.',
  loginName: 'admin',
  email: '',
  phone: '+258 84 000 0000',
  address: 'Maputo',
  city: 'Maputo Cidade',
  logoUrl: '',
  bannerUrl: '',
  bannerPositionX: 50,
  bannerPositionY: 50,
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  websiteUrl: '',
  twoFactorWhatsAppEnabled: false,
  twoFactorPhone: '',
  products: [],
  paymentSettings: {
    mpesaNumber: '',
    mpesaName: '',
    emolaNumber: '',
    emolaName: '',
    bankName: '',
    bankAccount: '',
    customInstructions: '',
  },
  shippingSettings: {
    maputoFee: 'Grátis no centro ou retirada',
    matolaFee: '150 MT',
    provincesFee: 'A combinar',
    pickupAddress: 'Maputo',
    shippingNotes: '',
  },
};
