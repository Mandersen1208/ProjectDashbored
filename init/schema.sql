--
-- PostgreSQL database dump
--

\restrict SWB3XhHsUMwae0qwl8bY5pLYuPbuoCjIy0czoSkYyj1yIUIePb3d8FQG48S1tbM

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-14 09:59:23

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
-- TOC entry 228 (class 1255 OID 16487)
-- Name: create_application_for_job(); Type: FUNCTION; Schema: public; Owner: jobhunter
--

CREATE FUNCTION public.create_application_for_job() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO applications (job_id, status)
    VALUES (NEW.id, 'new');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_application_for_job() OWNER TO jobhunter;

--
-- TOC entry 229 (class 1255 OID 16489)
-- Name: track_status_change(); Type: FUNCTION; Schema: public; Owner: jobhunter
--

CREATE FUNCTION public.track_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (application_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.track_status_change() OWNER TO jobhunter;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16446)
-- Name: applications; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    job_id integer,
    status character varying(50) DEFAULT 'new'::character varying,
    date_applied date,
    resume_version character varying(100),
    cover_letter_version character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.applications OWNER TO jobhunter;

--
-- TOC entry 223 (class 1259 OID 16445)
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO jobhunter;

--
-- TOC entry 3496 (class 0 OID 0)
-- Dependencies: 223
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- TOC entry 220 (class 1259 OID 16405)
-- Name: categories; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    tag character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO jobhunter;

--
-- TOC entry 219 (class 1259 OID 16404)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO jobhunter;

--
-- TOC entry 3497 (class 0 OID 0)
-- Dependencies: 219
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 216 (class 1259 OID 16386)
-- Name: companies; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO jobhunter;

--
-- TOC entry 215 (class 1259 OID 16385)
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO jobhunter;

--
-- TOC entry 3498 (class 0 OID 0)
-- Dependencies: 215
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- TOC entry 222 (class 1259 OID 16416)
-- Name: jobs; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    external_id character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    company_id integer,
    location_id integer,
    category_id integer,
    salary_min numeric(12,2),
    salary_max numeric(12,2),
    description text,
    job_url text NOT NULL,
    source character varying(50) DEFAULT 'adzuna'::character varying,
    created_date timestamp without time zone NOT NULL,
    date_found timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    apply_by date
);


ALTER TABLE public.jobs OWNER TO jobhunter;

--
-- TOC entry 221 (class 1259 OID 16415)
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO jobhunter;

--
-- TOC entry 3499 (class 0 OID 0)
-- Dependencies: 221
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- TOC entry 218 (class 1259 OID 16396)
-- Name: locations; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    city character varying(100),
    state character varying(100),
    country character varying(2) NOT NULL,
    display_name character varying(255) NOT NULL
);


ALTER TABLE public.locations OWNER TO jobhunter;

--
-- TOC entry 217 (class 1259 OID 16395)
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO jobhunter;

--
-- TOC entry 3500 (class 0 OID 0)
-- Dependencies: 217
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- TOC entry 226 (class 1259 OID 16463)
-- Name: status_history; Type: TABLE; Schema: public; Owner: jobhunter
--

CREATE TABLE public.status_history (
    id integer NOT NULL,
    application_id integer,
    old_status character varying(50),
    new_status character varying(50) NOT NULL,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.status_history OWNER TO jobhunter;

--
-- TOC entry 225 (class 1259 OID 16462)
-- Name: status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: jobhunter
--

CREATE SEQUENCE public.status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_history_id_seq OWNER TO jobhunter;

--
-- TOC entry 3501 (class 0 OID 0)
-- Dependencies: 225
-- Name: status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobhunter
--

ALTER SEQUENCE public.status_history_id_seq OWNED BY public.status_history.id;


--
-- TOC entry 227 (class 1259 OID 16482)
-- Name: vw_jobs_full; Type: VIEW; Schema: public; Owner: jobhunter
--

CREATE VIEW public.vw_jobs_full AS
 SELECT j.id,
    j.external_id,
    j.title,
    c.name AS company_name,
    l.display_name AS location,
    cat.name AS category,
    j.salary_min,
    j.salary_max,
    j.description,
    j.job_url,
    j.date_found,
    j.apply_by,
    COALESCE(a.status, 'new'::character varying) AS status,
    a.date_applied,
    a.notes
   FROM ((((public.jobs j
     LEFT JOIN public.companies c ON ((j.company_id = c.id)))
     LEFT JOIN public.locations l ON ((j.location_id = l.id)))
     LEFT JOIN public.categories cat ON ((j.category_id = cat.id)))
     LEFT JOIN public.applications a ON ((j.id = a.job_id)));


ALTER VIEW public.vw_jobs_full OWNER TO jobhunter;

--
-- TOC entry 3305 (class 2604 OID 16449)
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- TOC entry 3301 (class 2604 OID 16408)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3298 (class 2604 OID 16389)
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- TOC entry 3302 (class 2604 OID 16419)
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- TOC entry 3300 (class 2604 OID 16399)
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- TOC entry 3309 (class 2604 OID 16466)
-- Name: status_history id; Type: DEFAULT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.status_history ALTER COLUMN id SET DEFAULT nextval('public.status_history_id_seq'::regclass);


--
-- TOC entry 3335 (class 2606 OID 16456)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- TOC entry 3320 (class 2606 OID 16412)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 3322 (class 2606 OID 16410)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3324 (class 2606 OID 16414)
-- Name: categories categories_tag_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tag_key UNIQUE (tag);


--
-- TOC entry 3312 (class 2606 OID 16394)
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- TOC entry 3314 (class 2606 OID 16392)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 3329 (class 2606 OID 16427)
-- Name: jobs jobs_external_id_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_external_id_key UNIQUE (external_id);


--
-- TOC entry 3331 (class 2606 OID 16429)
-- Name: jobs jobs_external_id_source_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_external_id_source_key UNIQUE (external_id, source);


--
-- TOC entry 3333 (class 2606 OID 16425)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3316 (class 2606 OID 16403)
-- Name: locations locations_city_state_country_key; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_city_state_country_key UNIQUE (city, state, country);


--
-- TOC entry 3318 (class 2606 OID 16401)
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 3339 (class 2606 OID 16471)
-- Name: status_history status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3336 (class 1259 OID 16480)
-- Name: idx_applications_job; Type: INDEX; Schema: public; Owner: jobhunter
--

CREATE INDEX idx_applications_job ON public.applications USING btree (job_id);


--
-- TOC entry 3337 (class 1259 OID 16481)
-- Name: idx_applications_status; Type: INDEX; Schema: public; Owner: jobhunter
--

CREATE INDEX idx_applications_status ON public.applications USING btree (status);


--
-- TOC entry 3325 (class 1259 OID 16477)
-- Name: idx_jobs_company; Type: INDEX; Schema: public; Owner: jobhunter
--

CREATE INDEX idx_jobs_company ON public.jobs USING btree (company_id);


--
-- TOC entry 3326 (class 1259 OID 16479)
-- Name: idx_jobs_date_found; Type: INDEX; Schema: public; Owner: jobhunter
--

CREATE INDEX idx_jobs_date_found ON public.jobs USING btree (date_found);


--
-- TOC entry 3327 (class 1259 OID 16478)
-- Name: idx_jobs_location; Type: INDEX; Schema: public; Owner: jobhunter
--

CREATE INDEX idx_jobs_location ON public.jobs USING btree (location_id);


--
-- TOC entry 3345 (class 2620 OID 16488)
-- Name: jobs trg_create_application; Type: TRIGGER; Schema: public; Owner: jobhunter
--

CREATE TRIGGER trg_create_application AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.create_application_for_job();


--
-- TOC entry 3346 (class 2620 OID 16490)
-- Name: applications trg_track_status; Type: TRIGGER; Schema: public; Owner: jobhunter
--

CREATE TRIGGER trg_track_status BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.track_status_change();


--
-- TOC entry 3343 (class 2606 OID 16457)
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- TOC entry 3340 (class 2606 OID 16440)
-- Name: jobs jobs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3341 (class 2606 OID 16430)
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 3342 (class 2606 OID 16435)
-- Name: jobs jobs_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- TOC entry 3344 (class 2606 OID 16472)
-- Name: status_history status_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobhunter
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


-- Completed on 2025-11-14 09:59:23

--
-- PostgreSQL database dump complete
--

\unrestrict SWB3XhHsUMwae0qwl8bY5pLYuPbuoCjIy0czoSkYyj1yIUIePb3d8FQG48S1tbM

