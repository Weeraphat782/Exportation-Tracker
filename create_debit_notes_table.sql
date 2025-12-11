-- Create debit_notes table
CREATE TABLE IF NOT EXISTS public.debit_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id VARCHAR NOT NULL,
    debit_note_no VARCHAR NOT NULL,
    date_of_issue DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_debit_notes_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    
    -- Unique constraint to ensure one debit note per quotation
    CONSTRAINT unique_quotation_debit_note UNIQUE (quotation_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debit_notes_quotation_id ON public.debit_notes(quotation_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_date_of_issue ON public.debit_notes(date_of_issue);

-- Enable RLS (Row Level Security)
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_debit_notes_updated_at BEFORE UPDATE ON public.debit_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
