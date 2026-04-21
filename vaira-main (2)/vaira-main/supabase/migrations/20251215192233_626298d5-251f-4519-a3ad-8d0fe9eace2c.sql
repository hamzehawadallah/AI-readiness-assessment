-- Create settings table for storing app configuration
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for assessment flow)
CREATE POLICY "Anyone can view settings" 
ON public.settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings" 
ON public.settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings" 
ON public.settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default webhook values
INSERT INTO public.settings (key, value, description) VALUES
('WEBHOOK_URL', 'https://n8n.dopes.me/webhook/2be1ba9f-f1a4-48f2-979f-ca153aa43f4a', 'Webhook for results calculation'),
('DELIVERY_WEBHOOK_URL', 'https://n8n.dopes.me/webhook/244fbae0-d506-40a6-900d-576bbcfaf89f', 'Webhook for email/WhatsApp report delivery');