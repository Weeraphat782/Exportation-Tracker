-- Create table for tracking Telegram chat contexts
CREATE TABLE IF NOT EXISTS telegram_chats (
    chat_id BIGINT PRIMARY KEY,
    current_quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add required document types to quotations
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS required_doc_types TEXT[] 
DEFAULT ARRAY['commercial-invoice', 'packing-list'];

-- Create RLS policies for telegram_chats
ALTER TABLE telegram_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own telegram chats"
ON telegram_chats FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_telegram_chats_user ON telegram_chats(user_id);
