-- Insert sample document nodes
INSERT INTO document_nodes (name, description, example_content) VALUES
  ('Executive Summary', 'High-level overview of the document', 'This section should contain a brief summary of the key points, objectives, and conclusions.'),
  ('Introduction', 'Opening section that sets context', 'Introduce the topic, provide background information, and state the purpose of the document.'),
  ('Methodology', 'Explanation of approach and methods used', 'Describe the research methods, data collection techniques, and analytical approaches employed.'),
  ('Findings', 'Main results and discoveries', 'Present the key findings, data, and observations from the research or analysis.'),
  ('Conclusion', 'Final thoughts and recommendations', 'Summarize the main points and provide actionable recommendations or next steps.');

-- Insert sample template
INSERT INTO templates (name, description) VALUES
  ('Standard Research Report', 'A comprehensive template for reviewing research reports and academic papers.');

-- Link nodes to template with AI instructions
INSERT INTO template_nodes (template_id, node_id, sequence_order, ai_instructions)
SELECT 
  t.id,
  n.id,
  CASE n.name
    WHEN 'Executive Summary' THEN 1
    WHEN 'Introduction' THEN 2
    WHEN 'Methodology' THEN 3
    WHEN 'Findings' THEN 4
    WHEN 'Conclusion' THEN 5
  END,
  CASE n.name
    WHEN 'Executive Summary' THEN 'Review the executive summary for clarity, completeness, and alignment with the document body. Check if key findings and recommendations are clearly stated.'
    WHEN 'Introduction' THEN 'Evaluate the introduction for proper context setting, clear objectives, and logical flow. Ensure background information is relevant and sufficient.'
    WHEN 'Methodology' THEN 'Assess the methodology section for rigor, clarity, and reproducibility. Check if methods are appropriate for the research questions.'
    WHEN 'Findings' THEN 'Review findings for clarity, proper data presentation, and logical organization. Verify that results are well-supported and clearly explained.'
    WHEN 'Conclusion' THEN 'Evaluate conclusions for logical consistency with findings, actionable recommendations, and clear next steps.'
  END
FROM templates t
CROSS JOIN document_nodes n
WHERE t.name = 'Standard Research Report';
