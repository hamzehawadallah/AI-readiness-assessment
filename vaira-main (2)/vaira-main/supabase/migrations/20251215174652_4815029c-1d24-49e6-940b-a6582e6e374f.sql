-- Add question_type to questions table (default 'rating' for existing questions)
ALTER TABLE public.questions 
ADD COLUMN question_type text NOT NULL DEFAULT 'rating' 
CHECK (question_type IN ('rating', 'selection'));

-- Create question_options table for selection-type questions
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  grade NUMERIC NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_options
CREATE POLICY "Anyone can view question_options"
ON public.question_options
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert question_options"
ON public.question_options
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update question_options"
ON public.question_options
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete question_options"
ON public.question_options
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_question_options_updated_at
BEFORE UPDATE ON public.question_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();