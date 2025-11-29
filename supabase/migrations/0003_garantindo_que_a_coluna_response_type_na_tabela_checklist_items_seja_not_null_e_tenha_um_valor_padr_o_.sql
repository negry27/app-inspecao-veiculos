ALTER TABLE public.checklist_items
ALTER COLUMN response_type SET NOT NULL,
ALTER COLUMN response_type SET DEFAULT 'options'::text;