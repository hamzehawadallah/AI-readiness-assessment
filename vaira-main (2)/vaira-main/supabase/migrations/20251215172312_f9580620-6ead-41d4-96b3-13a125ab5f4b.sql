-- Create dimensions table
CREATE TABLE public.dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_key text NOT NULL UNIQUE,
  title text NOT NULL,
  short_title text NOT NULL,
  description text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES public.dimensions(id) ON DELETE CASCADE,
  question_key text NOT NULL UNIQUE,
  text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dimensions
CREATE POLICY "Anyone can view dimensions"
ON public.dimensions FOR SELECT
USING (true);

CREATE POLICY "Admins can insert dimensions"
ON public.dimensions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dimensions"
ON public.dimensions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dimensions"
ON public.dimensions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Admins can insert questions"
ON public.questions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update questions"
ON public.questions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_questions_dimension_id ON public.questions(dimension_id);
CREATE INDEX idx_questions_display_order ON public.questions(display_order);
CREATE INDEX idx_dimensions_display_order ON public.dimensions(display_order);

-- Seed initial data from the existing configuration
INSERT INTO public.dimensions (dimension_key, title, short_title, description, display_order) VALUES
('strategyGovernance', 'Strategy and Governance', 'Strategy', 'How well AI is embedded in your organisational vision and leadership approach.', 1),
('useCasesValue', 'Use Cases and Value', 'Use Cases', 'Your ability to identify, prioritise, and scale AI initiatives that deliver measurable outcomes.', 2),
('peopleSkills', 'People and Skills', 'People', 'How prepared your workforce is to understand, adopt, and leverage AI capabilities.', 3),
('dataTechWaysOfWorking', 'Data, Technology and Ways of Working', 'Data & Tech', 'Your foundational readiness in data quality, tooling, and agile experimentation.', 4);

-- Insert questions for Strategy and Governance
INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'sg1', 'Our organization has a clear, documented AI vision that links directly to business and operational priorities.', 1
FROM public.dimensions d WHERE d.dimension_key = 'strategyGovernance';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'sg2', 'There is an agreed governance model for AI that covers ownership, policies, and decision rights.', 2
FROM public.dimensions d WHERE d.dimension_key = 'strategyGovernance';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'sg3', 'Leadership regularly reviews AI initiatives and their impact on performance, risk, and ROI.', 3
FROM public.dimensions d WHERE d.dimension_key = 'strategyGovernance';

-- Insert questions for Use Cases and Value
INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'uv1', 'We have identified and prioritised a portfolio of AI use cases with clear business outcomes.', 1
FROM public.dimensions d WHERE d.dimension_key = 'useCasesValue';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'uv2', 'There is a structured process to move AI ideas from concept to pilot to scaled implementation.', 2
FROM public.dimensions d WHERE d.dimension_key = 'useCasesValue';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'uv3', 'We track the value and performance of AI use cases beyond technical metrics, focusing on business KPIs.', 3
FROM public.dimensions d WHERE d.dimension_key = 'useCasesValue';

-- Insert questions for People and Skills
INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'ps1', 'Non-technical staff are aware of AI possibilities and how AI can support their day-to-day work.', 1
FROM public.dimensions d WHERE d.dimension_key = 'peopleSkills';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'ps2', 'Managers and leaders are equipped to redesign work and roles to leverage AI capabilities.', 2
FROM public.dimensions d WHERE d.dimension_key = 'peopleSkills';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'ps3', 'We have role-based AI learning paths and programmes for different levels (staff, managers, leaders).', 3
FROM public.dimensions d WHERE d.dimension_key = 'peopleSkills';

-- Insert questions for Data, Technology and Ways of Working
INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'dt1', 'Our data is accessible, reasonably clean, and usable for AI initiatives.', 1
FROM public.dimensions d WHERE d.dimension_key = 'dataTechWaysOfWorking';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'dt2', 'We have access to the tools and platforms needed to prototype and deploy AI solutions securely.', 2
FROM public.dimensions d WHERE d.dimension_key = 'dataTechWaysOfWorking';

INSERT INTO public.questions (dimension_id, question_key, text, display_order)
SELECT d.id, 'dt3', 'Teams adopt agile and experimental ways of working, allowing rapid testing and improvement of AI ideas.', 3
FROM public.dimensions d WHERE d.dimension_key = 'dataTechWaysOfWorking';

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_dimensions_updated_at
BEFORE UPDATE ON public.dimensions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();