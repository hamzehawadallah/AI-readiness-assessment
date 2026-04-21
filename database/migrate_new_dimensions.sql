-- VCL AI Readiness Assessment -- Migration: replace dimensions/questions/options
-- Generated from vcl-assessment-export-2026-04-21 (1).json
-- Run this on the live Hostinger MySQL database.

SET FOREIGN_KEY_CHECKS = 0;

-- Wipe existing data (options/questions cascade from dimensions)
DELETE FROM question_options;
DELETE FROM questions;
DELETE FROM dimensions;

-- Dimensions
INSERT INTO dimensions (id, dimension_key, title, short_title, description, display_order) VALUES
('d20000001-0000-4000-8000-000000000001', 'DigitalDimension', 'Digital Dimension', 'Digital', 'Understanding how AI systems behave, their limitations, and the readiness to apply this understanding in real work.', 1),
('d20000002-0000-4000-8000-000000000001', 'BehaviouralDimension', 'Behavioural Dimension', 'Behavioural', 'Comfort, accountability, and willingness to integrate AI visibly and responsibly into decisions and work.', 2),
('d20000003-0000-4000-8000-000000000001', 'FunctionalDimension', 'Functional Dimension', 'Functional', 'Readiness to adapt roles, workflows, and performance expectations, and willingness to act on that understanding.', 3),
('d20000004-0000-4000-8000-000000000001', 'CreativeDimension', 'Creative Dimension', 'Creative', 'Using AI to enhance thinking, judgment, and problem framing, and the willingness to rely on it responsibly in complex situations.', 4);

-- Questions
INSERT INTO questions (id, dimension_id, question_key, text, display_order, is_active, question_type, tags) VALUES
('q20010001-0000-4000-8000-000000000001', 'd20000001-0000-4000-8000-000000000001', 'sg1', 'How do you expect AI systems to change how work is designed and executed in your organisation over the next 2--3 years?', 1, 1, 'selection', '["readiness"]'),
('q20010002-0000-4000-8000-000000000001', 'd20000001-0000-4000-8000-000000000001', 'sg2', 'When AI provides an output that appears confident but raises doubts, which best reflects how you typically respond?', 2, 1, 'selection', '["willingness"]'),
('q20010003-0000-4000-8000-000000000001', 'd20000001-0000-4000-8000-000000000001', 'sg3', 'When AI-assisted work needs to be explained to management, clients, or regulators, which statement best reflects you?', 3, 1, 'selection', '["willingness"]'),
('q20020001-0000-4000-8000-000000000001', 'd20000002-0000-4000-8000-000000000001', 'uv1', 'Which statement best reflects how AI currently shows up in your work?', 1, 1, 'selection', '["willingness"]'),
('q20020002-0000-4000-8000-000000000001', 'd20000002-0000-4000-8000-000000000001', 'uv2', 'When an AI-supported decision leads to an undesirable outcome, what best reflects your response?', 2, 1, 'selection', '["willingness"]'),
('q20020003-0000-4000-8000-000000000001', 'd20000002-0000-4000-8000-000000000001', 'uv3', 'Which statement best reflects how AI use is treated in your environment?', 3, 1, 'selection', '["readiness"]'),
('q20030001-0000-4000-8000-000000000001', 'd20000003-0000-4000-8000-000000000001', 'ps1', 'How do you expect AI to affect roles and responsibilities in your function?', 1, 1, 'selection', '["readiness"]'),
('q20030002-0000-4000-8000-000000000001', 'd20000003-0000-4000-8000-000000000001', 'ps2', 'If AI significantly reduces the time required for part of your work, what is the most likely outcome?', 2, 1, 'selection', '["willingness"]'),
('q20030003-0000-4000-8000-000000000001', 'd20000003-0000-4000-8000-000000000001', 'ps3', 'How is the value of AI most commonly discussed or demonstrated in your area?', 3, 1, 'selection', '["willingness"]'),
('q20040001-0000-4000-8000-000000000001', 'd20000004-0000-4000-8000-000000000001', 'dt1', 'When AI provides a clear recommendation, how do you typically engage with it?', 1, 1, 'selection', '["willingness"]'),
('q20040002-0000-4000-8000-000000000001', 'd20000004-0000-4000-8000-000000000001', 'dt2', 'For complex problems with no clear right answer, how do you use AI?', 2, 1, 'selection', '["willingness"]'),
('q20040003-0000-4000-8000-000000000001', 'd20000004-0000-4000-8000-000000000001', 'dt3', 'Which statement best reflects how you approach decisions involving AI?', 3, 1, 'selection', '["readiness"]');

-- Question Options
INSERT INTO question_options (id, question_id, label, grade, display_order) VALUES
('o0000001-0000-4000-8000-000000000001', 'q20010001-0000-4000-8000-000000000001', 'AI will fundamentally change how work is designed and executed', 4, 1),
('o0000002-0000-4000-8000-000000000001', 'q20010001-0000-4000-8000-000000000001', 'AI will significantly change some processes while improving efficiency in others', 3, 2),
('o0000003-0000-4000-8000-000000000001', 'q20010001-0000-4000-8000-000000000001', 'AI will mainly accelerate existing processes', 2, 3),
('o0000004-0000-4000-8000-000000000001', 'q20010001-0000-4000-8000-000000000001', 'AI will provide limited efficiency improvements', 1, 4),
('o0000005-0000-4000-8000-000000000001', 'q20010001-0000-4000-8000-000000000001', 'AI will have minimal impact on how work is done', 1, 5),
('o0000006-0000-4000-8000-000000000001', 'q20010002-0000-4000-8000-000000000001', 'I verify assumptions, data, and context before using the output', 4, 1),
('o0000007-0000-4000-8000-000000000001', 'q20010002-0000-4000-8000-000000000001', 'I refine the output and apply professional judgment', 3, 2),
('o0000008-0000-4000-8000-000000000001', 'q20010002-0000-4000-8000-000000000001', 'I use it as general guidance only', 2, 3),
('o0000009-0000-4000-8000-000000000001', 'q20010002-0000-4000-8000-000000000001', 'I rely on it if it appears reasonable', 1, 4),
('o0000010-0000-4000-8000-000000000001', 'q20010002-0000-4000-8000-000000000001', 'I avoid using AI in such situations', 1, 5),
('o0000011-0000-4000-8000-000000000001', 'q20010003-0000-4000-8000-000000000001', 'I can clearly explain how AI was used and what I validated myself', 4, 1),
('o0000012-0000-4000-8000-000000000001', 'q20010003-0000-4000-8000-000000000001', 'I can explain the outcome but not always the AI’s contribution', 3, 2),
('o0000013-0000-4000-8000-000000000001', 'q20010003-0000-4000-8000-000000000001', 'I prefer to minimise discussion of AI involvement', 2, 3),
('o0000014-0000-4000-8000-000000000001', 'q20010003-0000-4000-8000-000000000001', 'I feel uncomfortable explaining AI-assisted work', 1, 4),
('o0000015-0000-4000-8000-000000000001', 'q20010003-0000-4000-8000-000000000001', 'I avoid AI use where explanation is required', 1, 5),
('o0000016-0000-4000-8000-000000000001', 'q20020001-0000-4000-8000-000000000001', 'I use AI openly and am comfortable presenting AI-assisted work', 4, 1),
('o0000017-0000-4000-8000-000000000001', 'q20020001-0000-4000-8000-000000000001', 'I use AI but prefer to keep its involvement low-profile', 2, 2),
('o0000018-0000-4000-8000-000000000001', 'q20020001-0000-4000-8000-000000000001', 'I use AI occasionally for personal efficiency', 2, 3),
('o0000019-0000-4000-8000-000000000001', 'q20020001-0000-4000-8000-000000000001', 'I experiment with AI but avoid using it in formal outputs', 1, 4),
('o0000020-0000-4000-8000-000000000001', 'q20020001-0000-4000-8000-000000000001', 'I rarely or never use AI at work', 1, 5),
('o0000021-0000-4000-8000-000000000001', 'q20020002-0000-4000-8000-000000000001', 'I take ownership and review both human and AI factors', 4, 1),
('o0000022-0000-4000-8000-000000000001', 'q20020002-0000-4000-8000-000000000001', 'I review the data and assumptions behind the AI output', 3, 2),
('o0000023-0000-4000-8000-000000000001', 'q20020002-0000-4000-8000-000000000001', 'I escalate the issue for further review', 2, 3),
('o0000024-0000-4000-8000-000000000001', 'q20020002-0000-4000-8000-000000000001', 'I attribute the issue mainly to the AI system', 1, 4),
('o0000025-0000-4000-8000-000000000001', 'q20020002-0000-4000-8000-000000000001', 'I avoid AI involvement in critical decisions', 1, 5),
('o0000026-0000-4000-8000-000000000001', 'q20020003-0000-4000-8000-000000000001', 'AI use is encouraged with clear guidance and accountability', 4, 1),
('o0000027-0000-4000-8000-000000000001', 'q20020003-0000-4000-8000-000000000001', 'AI use is allowed but not formally structured', 3, 2),
('o0000028-0000-4000-8000-000000000001', 'q20020003-0000-4000-8000-000000000001', 'AI use happens informally at individual level', 2, 3),
('o0000029-0000-4000-8000-000000000001', 'q20020003-0000-4000-8000-000000000001', 'AI use is discouraged due to risk or uncertainty', 1, 4),
('o0000030-0000-4000-8000-000000000001', 'q20020003-0000-4000-8000-000000000001', 'AI use is largely absent', 1, 5),
('o0000031-0000-4000-8000-000000000001', 'q20030001-0000-4000-8000-000000000001', 'Most roles will need to be redefined', 4, 1),
('o0000032-0000-4000-8000-000000000001', 'q20030001-0000-4000-8000-000000000001', 'Several roles will change meaningfully', 3, 2),
('o0000033-0000-4000-8000-000000000001', 'q20030001-0000-4000-8000-000000000001', 'Roles will largely remain the same with productivity gains', 2, 3),
('o0000034-0000-4000-8000-000000000001', 'q20030001-0000-4000-8000-000000000001', 'Roles will experience minor efficiency improvements', 1, 4),
('o0000035-0000-4000-8000-000000000001', 'q20030001-0000-4000-8000-000000000001', 'Roles will not be materially affected', 1, 5),
('o0000036-0000-4000-8000-000000000001', 'q20030002-0000-4000-8000-000000000001', 'Outputs and expectations are redesigned', 4, 1),
('o0000037-0000-4000-8000-000000000001', 'q20030002-0000-4000-8000-000000000001', 'Additional responsibilities are taken on informally', 3, 2),
('o0000038-0000-4000-8000-000000000001', 'q20030002-0000-4000-8000-000000000001', 'Time savings are used when needed', 2, 3),
('o0000039-0000-4000-8000-000000000001', 'q20030002-0000-4000-8000-000000000001', 'The change is kept informal to avoid disruption', 1, 4),
('o0000040-0000-4000-8000-000000000001', 'q20030002-0000-4000-8000-000000000001', 'This situation has not occurred', 1, 5),
('o0000041-0000-4000-8000-000000000001', 'q20030003-0000-4000-8000-000000000001', 'Linked directly to business or customer outcomes', 4, 1),
('o0000042-0000-4000-8000-000000000001', 'q20030003-0000-4000-8000-000000000001', 'Measured through productivity or efficiency metrics', 3, 2),
('o0000043-0000-4000-8000-000000000001', 'q20030003-0000-4000-8000-000000000001', 'Described through examples and use cases', 2, 3),
('o0000044-0000-4000-8000-000000000001', 'q20030003-0000-4000-8000-000000000001', 'Focused on tools and technical features', 1, 4),
('o0000045-0000-4000-8000-000000000001', 'q20030003-0000-4000-8000-000000000001', 'Rarely discussed due to lack of clarity', 1, 5),
('o0000046-0000-4000-8000-000000000001', 'q20040001-0000-4000-8000-000000000001', 'I challenge the framing and explore alternative approaches', 4, 1),
('o0000047-0000-4000-8000-000000000001', 'q20040001-0000-4000-8000-000000000001', 'I ask the AI to refine or extend the analysis', 3, 2),
('o0000048-0000-4000-8000-000000000001', 'q20040001-0000-4000-8000-000000000001', 'I use it as a starting point for my own thinking', 2, 3),
('o0000049-0000-4000-8000-000000000001', 'q20040001-0000-4000-8000-000000000001', 'I accept it if it appears sound', 1, 4),
('o0000050-0000-4000-8000-000000000001', 'q20040001-0000-4000-8000-000000000001', 'I prefer not to rely on AI for this', 1, 5),
('o0000051-0000-4000-8000-000000000001', 'q20040002-0000-4000-8000-000000000001', 'To explore scenarios, assumptions, and trade-offs', 4, 1),
('o0000052-0000-4000-8000-000000000001', 'q20040002-0000-4000-8000-000000000001', 'To generate options and ideas', 3, 2),
('o0000053-0000-4000-8000-000000000001', 'q20040002-0000-4000-8000-000000000001', 'To validate an existing viewpoint', 2, 3),
('o0000054-0000-4000-8000-000000000001', 'q20040002-0000-4000-8000-000000000001', 'To obtain a single recommended solution', 1, 4),
('o0000055-0000-4000-8000-000000000001', 'q20040002-0000-4000-8000-000000000001', 'I do not use AI in such situations', 1, 5),
('o0000056-0000-4000-8000-000000000001', 'q20040003-0000-4000-8000-000000000001', 'Human judgment remains essential regardless of AI capability', 4, 1),
('o0000057-0000-4000-8000-000000000001', 'q20040003-0000-4000-8000-000000000001', 'Decisions should be shared between humans and AI', 3, 2),
('o0000058-0000-4000-8000-000000000001', 'q20040003-0000-4000-8000-000000000001', 'AI should handle most decisions where possible', 2, 3),
('o0000059-0000-4000-8000-000000000001', 'q20040003-0000-4000-8000-000000000001', 'AI is mainly a support tool', 2, 4),
('o0000060-0000-4000-8000-000000000001', 'q20040003-0000-4000-8000-000000000001', 'AI should be used with extreme caution', 1, 5);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify counts
SELECT 'Dimensions' AS check_name, COUNT(*) AS count FROM dimensions
UNION ALL SELECT 'Questions', COUNT(*) FROM questions
UNION ALL SELECT 'Options', COUNT(*) FROM question_options;
