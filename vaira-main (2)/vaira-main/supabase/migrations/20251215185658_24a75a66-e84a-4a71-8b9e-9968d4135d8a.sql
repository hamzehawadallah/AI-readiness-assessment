-- Add tags column to questions table
ALTER TABLE public.questions 
ADD COLUMN tags text[] DEFAULT '{}' NOT NULL;