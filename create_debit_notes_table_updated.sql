-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS public.debit_notes CASCADE;

-- Create debit_notes table with updated structure
CREATE TABLE public.debit_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id UUID NOT NULL,
    debit_note_no VARCHAR NOT NULL,
    date_of_issue DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Foreign key constraint to quotations table
    CONSTRAINT fk_debit_notes_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    
    -- Unique constraint to ensure one debit note per quotation
    CONSTRAINT unique_quotation_debit_note UNIQUE (quotation_id)
);

-- Create indexes for better performance
CREATE INDEX idx_debit_notes_quotation_id ON public.debit_notes(quotation_id);
CREATE INDEX idx_debit_notes_date_of_issue ON public.debit_notes(date_of_issue);
CREATE INDEX idx_debit_notes_created_at ON public.debit_notes(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own debit notes" ON public.debit_notes;
DROP POLICY IF EXISTS "Users can insert their own debit notes" ON public.debit_notes;
DROP POLICY IF EXISTS "Users can update their own debit notes" ON public.debit_notes;
DROP POLICY IF EXISTS "Users can delete their own debit notes" ON public.debit_notes;

-- Create RLS policies for security
CREATE POLICY "Users can view their own debit notes" ON public.debit_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = debit_notes.quotation_id 
            AND quotations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own debit notes" ON public.debit_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = debit_notes.quotation_id 
            AND quotations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own debit notes" ON public.debit_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = debit_notes.quotation_id 
            AND quotations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own debit notes" ON public.debit_notes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = debit_notes.quotation_id 
            AND quotations.user_id = auth.uid()
        )
    );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
CREATE TRIGGER update_debit_notes_updated_at 
    BEFORE UPDATE ON public.debit_notes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debit_notes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test data (optional - remove in production)
-- INSERT INTO public.debit_notes (quotation_id, debit_note_no, remarks) 
-- VALUES ('test-quotation-id', 'DN-001', 'Test remarks for debit note');

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debit_notes' 
ORDER BY ordinal_position;
