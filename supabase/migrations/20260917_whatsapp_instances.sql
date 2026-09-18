-- ============================================================
-- MIGRATION: whatsapp_instances
-- Instâncias Evolution API por loja (WhatsApp)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instance_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'disconnected'
        CHECK (status IN ('connected', 'disconnected', 'connecting', 'paused')),
    phone TEXT,
    profile_pic TEXT,
    qr_code TEXT,
    messages_today INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT false,
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_store_id ON public.whatsapp_instances(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name ON public.whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_default ON public.whatsapp_instances(store_id, is_default);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_whatsapp_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_whatsapp_instances_updated_at ON public.whatsapp_instances;
CREATE TRIGGER trg_whatsapp_instances_updated_at
    BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_instances_updated_at();

-- RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage their instances" ON public.whatsapp_instances;
CREATE POLICY "Store owners can manage their instances" ON public.whatsapp_instances
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
    );

-- Habilita Realtime (frontend escuta mudanças de status em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;

-- Função helper para incrementar mensagens_hoje (chamada pelo webhook via service role)
CREATE OR REPLACE FUNCTION public.increment_instance_messages(p_instance_name TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.whatsapp_instances
    SET messages_today = messages_today + 1, updated_at = NOW()
    WHERE instance_name = p_instance_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MIGRATION: evolution_config
-- Configuração global da Evolution API por loja
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evolution_config (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage evolution config" ON public.evolution_config;
CREATE POLICY "Store owners can manage evolution config" ON public.evolution_config
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
    );
