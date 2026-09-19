-- ============================================================
-- LOGINHA SUPABASE SCHEMA — v2.0 (SaaS Multi-Tenant Edition)
-- Otimizado para Plano Gratuito (Índices estratégicos, RLS e Realtime seletivo)
-- ============================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: STORES (Lojas / Tenants do SaaS)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slogan TEXT DEFAULT 'A tua loja, simples.',
    city TEXT DEFAULT '',
    phone TEXT,
    logo_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: STORE_SETTINGS (Configurações da Loja)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
    mpesa_number TEXT DEFAULT '',
    mpesa_name TEXT DEFAULT '',
    emola_number TEXT DEFAULT '',
    emola_name TEXT DEFAULT '',
    bank_name TEXT,
    bank_account TEXT,
    custom_instructions TEXT DEFAULT 'Envie o comprovativo por aqui para darmos andamento ao pedido!',
    maputo_fee TEXT DEFAULT '',
    matola_fee TEXT DEFAULT '',
    provinces_fee TEXT DEFAULT '',
    pickup_address TEXT DEFAULT '',
    shipping_notes TEXT,
    two_factor_whatsapp_enabled BOOLEAN DEFAULT FALSE,
    two_factor_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: KANBAN_COLUMNS (Etapas do Funil por Tenant)
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#C1F76B',
    order_index INT NOT NULL DEFAULT 0,
    sla_hours INT NOT NULL DEFAULT 24,
    default_template_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: LEADS (Clientes e Negócios por Tenant)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    column_id UUID REFERENCES public.kanban_columns(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar TEXT,
    deal_value NUMERIC(12, 2) DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    location TEXT,
    child_info TEXT,
    product_interest TEXT,
    last_message TEXT DEFAULT '',
    last_message_time TEXT DEFAULT 'Agora',
    last_message_timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    unread_count INT DEFAULT 0,
    follow_up_date TEXT,
    follow_up_notes TEXT,
    assigned_to TEXT,
    stage_history JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: MESSAGES (Mensagens do Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    from_me BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'audio' | 'location'
    text TEXT,
    media_url TEXT,
    media_caption TEXT,
    audio_duration TEXT,
    timestamp TEXT NOT NULL,
    full_date TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- 'sent' | 'delivered' | 'read'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA: QUICK_REPLIES (Respostas Rápidas)
CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'demonstracao',
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA: PRODUCTS (Catálogo de Produtos)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA: WHATSAPP_INSTANCES (Instâncias Evolution API)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'connected',
    profile_pic TEXT,
    messages_today INT DEFAULT 0,
    is_default BOOLEAN DEFAULT TRUE,
    battery_level INT,
    last_connected TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE ALTA PERFORMANCE (Evita gargalos no Free Tier)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_store_order ON public.kanban_columns(store_id, order_index);
CREATE INDEX IF NOT EXISTS idx_leads_store_column ON public.leads(store_id, column_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(store_id, phone);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON public.messages(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_store_lead ON public.messages(store_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_store ON public.quick_replies(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Columns" ON public.kanban_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Quick Replies" ON public.quick_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write WhatsApp Instances" ON public.whatsapp_instances FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- AUTOMATED SAAS TRIGGER: Configura nova loja automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_store_setup()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Cria configurações da loja
    INSERT INTO public.store_settings (store_id)
    VALUES (NEW.id)
    ON CONFLICT (store_id) DO NOTHING;

    -- 2. Cria a coluna inicial padrão do funil de vendas (Novo Contacto)
    INSERT INTO public.kanban_columns (store_id, title, color, order_index, sla_hours)
    VALUES 
      (NEW.id, 'Novo Contacto', '#38bdf8', 0, 1);

    -- 3. Cria respostas rápidas padrão para agilizar atendimento
    INSERT INTO public.quick_replies (store_id, shortcut, title, category, content)
    VALUES
      (NEW.id, 'ola', 'Boas-Vindas', 'demonstracao', 'Olá! Muito obrigado pelo contato com a nossa loja. Como posso ajudar você hoje? 😊'),
      (NEW.id, 'pagamento', 'Dados de Pagamento', 'pagamento', 'Trabalhamos com diversas formas de pagamento seguras. Por favor envie o comprovativo por aqui assim que efetuar o pagamento! 📱'),
      (NEW.id, 'frete', 'Informações de Frete', 'entrega', 'Fazemos entregas locais e envios para outras regiões via transportadora ou correios.');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_store_created ON public.stores;
CREATE TRIGGER on_store_created
    AFTER INSERT ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_store_setup();

-- ============================================================
-- SUPABASE REALTIME
-- ============================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_columns;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
