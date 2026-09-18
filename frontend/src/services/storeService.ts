import { supabase } from '../lib/supabase';
import { StoreSettings, QuickReply, WhatsAppInstance, StoreProduct } from '../types';
import { DEFAULT_STORE_ID } from './kanbanService';

export const storeService = {
  // Fetch store and settings including real products from Supabase
  async getStoreSettings(storeId: string = DEFAULT_STORE_ID): Promise<StoreSettings | null> {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (storeError) {
      console.error('Error fetching store from Supabase:', storeError);
    }

    const { data: settings, error: settingsError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching store settings from Supabase:', settingsError);
    }

    // Fetch real products belonging to this tenant
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products from Supabase:', productsError);
    }

    if (!store && !settings && !productsData) return null;

    const products: StoreProduct[] = (productsData || []).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      caption: p.caption || '',
      imageUrl: p.image_url || '',
    }));

    return {
      storeName: store?.name || '',
      slogan: store?.slogan || '',
      loginName: 'admin',
      email: '',
      phone: store?.phone || '',
      address: settings?.pickup_address || '',
      city: store?.city || '',
      logoUrl: store?.logo_url || '',
      bannerUrl: store?.banner_url || '',
      bannerPositionX: 50,
      bannerPositionY: 50,
      facebookUrl: '',
      instagramUrl: '',
      tiktokUrl: '',
      websiteUrl: '',
      twoFactorWhatsAppEnabled: settings?.two_factor_whatsapp_enabled ?? false,
      twoFactorPhone: settings?.two_factor_phone || '',
      products,
      paymentSettings: {
        mpesaNumber: settings?.mpesa_number || '',
        mpesaName: settings?.mpesa_name || '',
        emolaNumber: settings?.emola_number || '',
        emolaName: settings?.emola_name || '',
        bankName: settings?.bank_name || '',
        bankAccount: settings?.bank_account || '',
        customInstructions: settings?.custom_instructions || '',
      },
      shippingSettings: {
        maputoFee: settings?.maputo_fee || '',
        matolaFee: settings?.matola_fee || '',
        provincesFee: settings?.provinces_fee || '',
        pickupAddress: settings?.pickup_address || '',
        shippingNotes: settings?.shipping_notes || '',
      },
    };
  },

  // Save store settings & sync products
  async saveStoreSettings(settings: Partial<StoreSettings>, storeId: string = DEFAULT_STORE_ID): Promise<boolean> {
    try {
      if (settings.storeName !== undefined || settings.slogan !== undefined || settings.city !== undefined || settings.logoUrl !== undefined || settings.bannerUrl !== undefined || settings.phone !== undefined) {
        await supabase
          .from('stores')
          .upsert({
            id: storeId,
            name: settings.storeName || '',
            slogan: settings.slogan || '',
            city: settings.city || '',
            phone: settings.phone || '',
            logo_url: settings.logoUrl || '',
            banner_url: settings.bannerUrl || '',
            updated_at: new Date().toISOString(),
          });
      }

      if (settings.paymentSettings || settings.shippingSettings || settings.twoFactorWhatsAppEnabled !== undefined) {
        await supabase
          .from('store_settings')
          .upsert({
            store_id: storeId,
            mpesa_number: settings.paymentSettings?.mpesaNumber || '',
            mpesa_name: settings.paymentSettings?.mpesaName || '',
            emola_number: settings.paymentSettings?.emolaNumber || '',
            emola_name: settings.paymentSettings?.emolaName || '',
            bank_name: settings.paymentSettings?.bankName || null,
            bank_account: settings.paymentSettings?.bankAccount || null,
            custom_instructions: settings.paymentSettings?.customInstructions || '',
            maputo_fee: settings.shippingSettings?.maputoFee || '',
            matola_fee: settings.shippingSettings?.matolaFee || '',
            provinces_fee: settings.shippingSettings?.provincesFee || '',
            pickup_address: settings.shippingSettings?.pickupAddress || '',
            shipping_notes: settings.shippingSettings?.shippingNotes || null,
            two_factor_whatsapp_enabled: settings.twoFactorWhatsAppEnabled ?? false,
            two_factor_phone: settings.twoFactorPhone || null,
            updated_at: new Date().toISOString(),
          });
      }

      // If products array is included, sync with DB
      if (settings.products !== undefined) {
        await this.syncProducts(settings.products, storeId);
      }

      return true;
    } catch (err) {
      console.error('Error saving store settings:', err);
      return false;
    }
  },

  // Sync entire products list with Supabase
  async syncProducts(products: StoreProduct[], storeId: string = DEFAULT_STORE_ID): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);

      const existingIds = new Set((existing || []).map((p) => p.id));
      const newIds = new Set(products.map((p) => p.id));

      // 1. Delete removed products
      const toDelete = [...existingIds].filter((id) => !newIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('products').delete().in('id', toDelete);
      }

      // 2. Upsert current products
      if (products.length > 0) {
        const payload = products.map((p) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id);
          const item: any = {
            store_id: storeId,
            title: p.title,
            price: p.price,
            caption: p.caption,
            image_url: p.imageUrl,
            in_stock: true,
          };
          if (isUUID) item.id = p.id;
          return item;
        });

        const { error } = await supabase.from('products').upsert(payload);
        if (error) {
          console.error('Error upserting products:', error);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error syncing products:', err);
      return false;
    }
  },

  // Save single product
  async saveProduct(product: StoreProduct, storeId: string = DEFAULT_STORE_ID): Promise<StoreProduct | null> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id);
    const payload: any = {
      store_id: storeId,
      title: product.title,
      price: product.price,
      caption: product.caption,
      image_url: product.imageUrl,
      in_stock: true,
    };
    if (isUUID) {
      payload.id = product.id;
    }

    const { data, error } = await supabase
      .from('products')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error saving single product:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      price: data.price,
      caption: data.caption || '',
      imageUrl: data.image_url || '',
    };
  },

  // Delete single product
  async deleteProduct(productId: string, storeId: string = DEFAULT_STORE_ID): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return false;
    }
    return true;
  },

  // Fetch quick replies
  async getQuickReplies(storeId: string = DEFAULT_STORE_ID): Promise<QuickReply[]> {
    const { data, error } = await supabase
      .from('quick_replies')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching quick replies:', error);
      return [];
    }

    return (data || []).map((r) => ({
      id: r.id,
      shortcut: r.shortcut,
      title: r.title,
      category: r.category,
      content: r.content,
      mediaUrl: r.media_url,
      mediaType: r.media_type,
    }));
  },

  // Save quick replies
  async saveQuickReplies(replies: QuickReply[], storeId: string = DEFAULT_STORE_ID): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('quick_replies')
        .select('id')
        .eq('store_id', storeId);

      const existingIds = new Set((existing || []).map((r) => r.id));
      const newIds = new Set(replies.map((r) => r.id));

      const toDelete = [...existingIds].filter((id) => !newIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('quick_replies').delete().in('id', toDelete);
      }

      if (replies.length > 0) {
        const payload = replies.map((r) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.id);
          const item: any = {
            store_id: storeId,
            shortcut: r.shortcut,
            title: r.title,
            category: r.category,
            content: r.content,
            media_url: r.mediaUrl,
            media_type: r.mediaType,
          };
          if (isUUID) item.id = r.id;
          return item;
        });

        const { error } = await supabase.from('quick_replies').upsert(payload);
        if (error) {
          console.error('Error saving quick replies:', error);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error in saveQuickReplies:', err);
      return false;
    }
  },

  // Fetch WhatsApp instances
  async getWhatsAppInstances(storeId: string = DEFAULT_STORE_ID): Promise<WhatsAppInstance[]> {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('store_id', storeId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching WhatsApp instances:', error);
      return [];
    }

    return (data || []).map((i) => ({
      id: i.id,
      name: i.name,
      phone: i.phone,
      status: i.status,
      profilePic: i.profile_pic,
      messagesToday: i.messages_today || 0,
      isDefault: i.is_default,
      batteryLevel: i.battery_level,
      lastConnected: i.last_connected,
    }));
  },
};
