-- VCL AI Readiness Assessment — Seed Data
-- Run AFTER schema.sql to populate dimensions and questions.
-- Tags: "readiness" = structural/infrastructure questions
--       "willingness" = behavioural/attitude questions

SET FOREIGN_KEY_CHECKS = 0;

-- ─── Dimensions ──────────────────────────────────────────────────────────────
INSERT INTO dimensions (id, dimension_key, title, short_title, description, display_order) VALUES
('d1000000-0000-4000-8000-000000000001', 'strategyGovernance',     'Strategy and Governance',              'Strategy',   'How well AI is embedded in your organisational vision and leadership approach.',                          1),
('d1000000-0000-4000-8000-000000000002', 'useCasesValue',          'Use Cases and Value',                  'Use Cases',  'Your ability to identify, prioritise, and scale AI initiatives that deliver measurable outcomes.',        2),
('d1000000-0000-4000-8000-000000000003', 'peopleSkills',           'People and Skills',                    'People',     'How prepared your workforce is to understand, adopt, and leverage AI capabilities.',                    3),
('d1000000-0000-4000-8000-000000000004', 'dataTechWaysOfWorking',  'Data, Technology and Ways of Working', 'Data & Tech','Your foundational readiness in data quality, tooling, and agile experimentation.',                     4)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    short_title = VALUES(short_title),
    description = VALUES(description),
    display_order = VALUES(display_order);

-- ─── Questions ───────────────────────────────────────────────────────────────
INSERT INTO questions (id, dimension_id, question_key, text, display_order, is_active, question_type, tags) VALUES
-- Strategy & Governance
('q1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'sg1', 'Our organization has a clear, documented AI vision that links directly to business and operational priorities.', 1, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'sg2', 'There is an agreed governance model for AI that covers ownership, policies, and decision rights.', 2, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000001', 'sg3', 'Leadership regularly reviews AI initiatives and their impact on performance, risk, and ROI.', 3, 1, 'rating', '["willingness"]'),
-- Use Cases & Value
('q1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002', 'uv1', 'We have identified and prioritised a portfolio of AI use cases with clear business outcomes.', 1, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'uv2', 'There is a structured process to move AI ideas from concept to pilot to scaled implementation.', 2, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', 'uv3', 'We track the value and performance of AI use cases beyond technical metrics, focusing on business KPIs.', 3, 1, 'rating', '["willingness"]'),
-- People & Skills
('q1000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000003', 'ps1', 'Non-technical staff are aware of AI possibilities and how AI can support their day-to-day work.', 1, 1, 'rating', '["willingness"]'),
('q1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000003', 'ps2', 'Managers and leaders are equipped to redesign work and roles to leverage AI capabilities.', 2, 1, 'rating', '["willingness"]'),
('q1000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000003', 'ps3', 'We have role-based AI learning paths and programmes for different levels (staff, managers, leaders).', 3, 1, 'rating', '["readiness"]'),
-- Data, Tech & Ways of Working
('q1000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000004', 'dt1', 'Our data is accessible, reasonably clean, and usable for AI initiatives.', 1, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000011', 'd1000000-0000-4000-8000-000000000004', 'dt2', 'We have access to the tools and platforms needed to prototype and deploy AI solutions securely.', 2, 1, 'rating', '["readiness"]'),
('q1000000-0000-4000-8000-000000000012', 'd1000000-0000-4000-8000-000000000004', 'dt3', 'Teams adopt agile and experimental ways of working, allowing rapid testing and improvement of AI ideas.', 3, 1, 'rating', '["willingness"]')
ON DUPLICATE KEY UPDATE
    text = VALUES(text),
    display_order = VALUES(display_order),
    is_active = VALUES(is_active),
    question_type = VALUES(question_type),
    tags = VALUES(tags);

SET FOREIGN_KEY_CHECKS = 1;
