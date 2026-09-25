-- ============================================================
-- LOGINHA SUPABASE MIGRATION: STORE_MEMBERS (Equipe & Permissões)
-- Permite adicionar membros da equipe com permissões por módulo
-- e restrição de acesso por colunas do Kanban.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.store_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'vendedor', -- 'admin' | 'gerente' | 'vendedor'
    permissions TEXT[] NOT NULL DEFAULT '{"cockpit"}',
    allowed_column_ids TEXT[] DEFAULT NULL, -- NULL = todas as colunas, ou array de UUIDs de colunas
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(store_id, email)
);

-- Garantir que a coluna password_hash exista caso a tabela já tenha sido criada antes
ALTER TABLE public.store_members ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.store_members ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{"cockpit"}';
ALTER TABLE public.store_members ADD COLUMN IF NOT EXISTS allowed_column_ids TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON public.store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON public.store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_email ON public.store_members(email);

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Store Members" ON public.store_members FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_members;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
