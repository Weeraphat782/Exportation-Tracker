-- Remove markdown formatting from existing example_content in document_nodes
UPDATE document_nodes
SET example_content = 
  -- Remove heading markers (##, ###)
  REGEXP_REPLACE(
    -- Remove bold markers (**)
    REGEXP_REPLACE(
      -- Remove italic markers (*)
      REGEXP_REPLACE(
        -- Remove horizontal rules (---)
        REGEXP_REPLACE(example_content, '---', '', 'g'),
        '\*([^*]+)\*', '\1', 'g'
      ),
      '\*\*([^*]+)\*\*', '\1', 'g'
    ),
    '#{1,6}\s*', '', 'g'
  )
WHERE example_content IS NOT NULL;

-- Remove markdown formatting from AI instructions in template_nodes
UPDATE template_nodes
SET ai_instructions = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(ai_instructions, '---', '', 'g'),
        '\*([^*]+)\*', '\1', 'g'
      ),
      '\*\*([^*]+)\*\*', '\1', 'g'
    ),
    '#{1,6}\s*', '', 'g'
  )
WHERE ai_instructions IS NOT NULL;

-- Remove markdown formatting from template descriptions
UPDATE templates
SET description = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(description, '---', '', 'g'),
        '\*([^*]+)\*', '\1', 'g'
      ),
      '\*\*([^*]+)\*\*', '\1', 'g'
    ),
    '#{1,6}\s*', '', 'g'
  )
WHERE description IS NOT NULL;



