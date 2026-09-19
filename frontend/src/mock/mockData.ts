import { KanbanColumn, ContactLead, ChatMessage, QuickReply, WhatsAppInstance, StoreSettings } from '../types';

// Default starter column for all stores (Single mandatory entry column: Novo Contacto)
export const initialColumns: KanbanColumn[] = [
  {
    id: 'col-new',
    title: 'Novo Contacto',
    color: '#38bdf8',
    order: 0,
    slaHours: 1,
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

// Default clean store settings (International, zero predefined locations)
export const initialStoreSettings: StoreSettings = {
  storeName: 'Minha Loja',
  slogan: '',
  loginName: 'admin',
  email: '',
  phone: '',
  address: '',
  city: '',
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
    maputoFee: '',
    matolaFee: '',
    provincesFee: '',
    pickupAddress: '',
    shippingNotes: '',
  },
};
