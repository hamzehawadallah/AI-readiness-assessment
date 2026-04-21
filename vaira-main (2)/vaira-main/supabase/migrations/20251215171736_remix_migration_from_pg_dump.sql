CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: handle_admin_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_admin_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.email = 'admin@vcl.solutions' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: assessment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_id uuid NOT NULL,
    overall_score numeric,
    level_number integer,
    level_label text,
    scores jsonb,
    agent_result jsonb,
    answers jsonb,
    pdf_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain text NOT NULL,
    original_website text,
    email text,
    full_name text,
    consent_to_contact boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    phone_number text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assessment_results assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: assessment_results assessment_results_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: participants Admins can update participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update participants" ON public.participants FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assessment_results Admins can update results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update results" ON public.assessment_results FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: participants Admins can view all participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all participants" ON public.participants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assessment_results Admins can view all results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all results" ON public.assessment_results FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assessment_results Allow insert for recent participants only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for recent participants only" ON public.assessment_results FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.participants
  WHERE ((participants.id = assessment_results.participant_id) AND (participants.created_at > (now() - '00:30:00'::interval))))));


--
-- Name: participants Allow select for recently created participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for recently created participants" ON public.participants FOR SELECT USING ((created_at > (now() - '00:30:00'::interval)));


--
-- Name: assessment_results Allow select for recently created results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for recently created results" ON public.assessment_results FOR SELECT USING ((created_at > (now() - '00:30:00'::interval)));


--
-- Name: assessment_results Allow update for recently created results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for recently created results" ON public.assessment_results FOR UPDATE USING ((created_at > (now() - '00:30:00'::interval))) WITH CHECK ((created_at > (now() - '00:30:00'::interval)));


--
-- Name: participants Anyone can insert participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert participants" ON public.participants FOR INSERT WITH CHECK (true);


--
-- Name: assessment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


