-- ============================================================
-- LOGINHA SUPABASE MIGRATION: KANBAN_COLUMNS (Previsão de Retorno)
-- Adiciona a coluna include_in_pipeline_total para controle oficial
-- de contabilização de valor esperado no funil de vendas.
-- ============================================================

ALTER TABLE public.kanban_columns 
ADD COLUMN IF NOT EXISTS include_in_pipeline_total BOOLEAN NOT NULL DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.kanban_columns.include_in_pipeline_total IS 'Controla se o valor dos leads nesta coluna entra no cálculo de previsão total do funil (true = sim, false = ignorado).';
