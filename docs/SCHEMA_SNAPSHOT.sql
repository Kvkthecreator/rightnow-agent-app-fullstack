CREATE SCHEMA public;
CREATE TYPE public.basket_state AS ENUM (
    'INIT',
    'ACTIVE',
    'ARCHIVED',
    'DEPRECATED'
);
CREATE TYPE public.block_state AS ENUM (
    'PROPOSED',
    'ACCEPTED',
    'LOCKED',
    'CONSTANT',
    'SUPERSEDED',
    'REJECTED'
);
CREATE TYPE public.scope_level AS ENUM (
    'LOCAL',
    'WORKSPACE',
    'ORG',
    'GLOBAL'
);
CREATE FUNCTION public.check_block_depth() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE depth int := 0; cursor_id uuid;
BEGIN
  cursor_id := NEW.parent_block_id;
  WHILE cursor_id IS NOT NULL LOOP
    depth := depth + 1;
    IF depth > 2 THEN
      RAISE EXCEPTION 'Hierarchy depth > 2';
    END IF;
    SELECT parent_block_id INTO cursor_id FROM blocks WHERE id = cursor_id;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.create_basket_with_dump(dump_body text, file_urls jsonb, user_id uuid, workspace_id uuid) RETURNS TABLE(basket_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_basket_id uuid;
  v_dump_id uuid;
begin
  insert into baskets (workspace_id, user_id)
    values (workspace_id, user_id)
    returning id into v_basket_id;
  insert into raw_dumps (basket_id, body_md, file_refs, workspace_id)
    values (v_basket_id, dump_body, coalesce(file_urls, '[]'::jsonb), workspace_id)
    returning id into v_dump_id;
  update baskets
     set raw_dump_id = v_dump_id
   where id = v_basket_id;
  return query select v_basket_id;
end;
$$;
CREATE FUNCTION public.prevent_lock_vs_constant() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.state = 'LOCKED' THEN
    PERFORM 1 FROM blocks
      WHERE semantic_type = NEW.semantic_type
        AND scope IS NOT NULL          -- a Constant
        AND state = 'CONSTANT'
        AND basket_id = NEW.basket_id; -- same workspace implied
    IF FOUND THEN
      RAISE EXCEPTION 'LOCK_CONFLICT_CONSTANT';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.set_basket_user_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;
CREATE TABLE public.basket_deltas (
    delta_id uuid NOT NULL,
    basket_id uuid NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_at timestamp with time zone
);
CREATE TABLE public.basket_events (
    id integer NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.basket_events REPLICA IDENTITY FULL;
CREATE SEQUENCE public.basket_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.basket_events_id_seq OWNED BY public.basket_events.id;
CREATE TABLE public.baskets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    raw_dump_id uuid,
    status public.basket_state DEFAULT 'INIT'::public.basket_state NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    workspace_id uuid NOT NULL,
    origin_template text,
    tags text[] DEFAULT '{}'::text[],
    idempotency_key uuid
);
CREATE TABLE public.block_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    block_id uuid,
    document_id uuid,
    occurrences integer DEFAULT 0,
    snippets jsonb
);
CREATE TABLE public.block_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    block_id uuid,
    workspace_id uuid,
    actor_id uuid,
    summary text,
    diff_json jsonb,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    parent_block_id uuid,
    semantic_type text NOT NULL,
    content text,
    version integer DEFAULT 1 NOT NULL,
    state public.block_state DEFAULT 'PROPOSED'::public.block_state NOT NULL,
    scope public.scope_level,
    canonical_value text,
    origin_ref uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id uuid NOT NULL,
    meta_agent_notes text,
    label text,
    meta_tags text[],
    is_required boolean DEFAULT false,
    raw_dump_id uuid,
    title text,
    body_md text,
    confidence_score double precision DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    processing_agent text,
    status text DEFAULT 'proposed'::text,
    CONSTRAINT blocks_check CHECK ((((state = 'CONSTANT'::public.block_state) AND (scope IS NOT NULL)) OR (state <> 'CONSTANT'::public.block_state)))
)
WITH (autovacuum_enabled='true');
ALTER TABLE ONLY public.blocks REPLICA IDENTITY FULL;
CREATE TABLE public.context_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid NOT NULL,
    document_id uuid,
    type text NOT NULL,
    content text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    raw_dump_id uuid,
    title text,
    description text,
    confidence_score double precision DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT context_items_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);
ALTER TABLE ONLY public.context_items REPLICA IDENTITY FULL;
CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    title text NOT NULL,
    content_raw text NOT NULL,
    content_rendered text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    workspace_id uuid NOT NULL,
    document_type text DEFAULT 'general'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    block_id uuid,
    kind text,
    payload jsonb,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id uuid NOT NULL,
    origin text DEFAULT 'user'::text,
    actor_id uuid,
    agent_type text,
    CONSTRAINT events_origin_check CHECK ((origin = ANY (ARRAY['user'::text, 'agent'::text, 'daemon'::text, 'system'::text])))
);
CREATE TABLE public.idempotency_keys (
    request_id text NOT NULL,
    delta_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.narrative (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    raw_dump_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    confidence_score double precision DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.narrative REPLICA IDENTITY FULL;
CREATE TABLE public.raw_dumps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid NOT NULL,
    body_md text,
    file_refs jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id uuid NOT NULL,
    file_url text,
    document_id uuid,
    fragments jsonb DEFAULT '[]'::jsonb,
    processing_status text DEFAULT 'unprocessed'::text,
    processed_at timestamp with time zone,
    source_meta jsonb DEFAULT '{}'::jsonb,
    ingest_trace_id text,
    dump_request_id uuid
);
ALTER TABLE ONLY public.raw_dumps REPLICA IDENTITY FULL;
CREATE TABLE public.revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    actor_id uuid,
    summary text,
    diff_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.substrate_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    basket_id uuid,
    from_type text NOT NULL,
    from_id uuid NOT NULL,
    to_type text NOT NULL,
    to_id uuid NOT NULL,
    relationship_type text NOT NULL,
    description text,
    strength double precision DEFAULT 0.5,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.substrate_relationships REPLICA IDENTITY FULL;
CREATE TABLE public.workspace_memberships (
    id bigint NOT NULL,
    workspace_id uuid,
    user_id uuid,
    role text DEFAULT 'member'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.workspace_memberships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.workspace_memberships_id_seq OWNED BY public.workspace_memberships.id;
CREATE TABLE public.workspaces (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    is_demo boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.basket_events ALTER COLUMN id SET DEFAULT nextval('public.basket_events_id_seq'::regclass);
ALTER TABLE ONLY public.workspace_memberships ALTER COLUMN id SET DEFAULT nextval('public.workspace_memberships_id_seq'::regclass);
ALTER TABLE ONLY public.basket_deltas
    ADD CONSTRAINT basket_deltas_pkey PRIMARY KEY (delta_id);
ALTER TABLE ONLY public.basket_events
    ADD CONSTRAINT basket_events_pkey PRIMARY KEY (id);
ALTER TABLE public.baskets
    ADD CONSTRAINT baskets_idem_is_uuid CHECK (((idempotency_key IS NULL) OR ((idempotency_key)::text ~* '^[0-9a-f-]{36}$'::text))) NOT VALID;
ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT baskets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.block_links
    ADD CONSTRAINT block_links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.block_revisions
    ADD CONSTRAINT block_revisions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.context_items
    ADD CONSTRAINT context_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE public.raw_dumps
    ADD CONSTRAINT dumps_req_is_uuid CHECK (((dump_request_id IS NULL) OR ((dump_request_id)::text ~* '^[0-9a-f-]{36}$'::text))) NOT VALID;
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (request_id);
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.raw_dumps
    ADD CONSTRAINT raw_dumps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.substrate_relationships
    ADD CONSTRAINT substrate_relationships_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workspace_memberships
    ADD CONSTRAINT workspace_memberships_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workspace_memberships
    ADD CONSTRAINT workspace_memberships_workspace_id_user_id_key UNIQUE (workspace_id, user_id);
ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);
CREATE INDEX baskets_user_idx ON public.baskets USING btree (user_id);
CREATE INDEX blk_doc_idx ON public.block_links USING btree (block_id, document_id);
CREATE UNIQUE INDEX docs_basket_title_idx ON public.documents USING btree (basket_id, title);
CREATE INDEX idx_basket_deltas_applied_at ON public.basket_deltas USING btree (applied_at);
CREATE INDEX idx_basket_deltas_basket ON public.basket_deltas USING btree (basket_id, created_at DESC);
CREATE INDEX idx_basket_deltas_basket_id ON public.basket_deltas USING btree (basket_id);
CREATE INDEX idx_basket_deltas_created ON public.basket_deltas USING btree (created_at DESC);
CREATE INDEX idx_basket_deltas_created_at ON public.basket_deltas USING btree (created_at DESC);
CREATE INDEX idx_basket_deltas_unapplied ON public.basket_deltas USING btree (basket_id, created_at DESC) WHERE (applied_at IS NULL);
CREATE INDEX idx_basket_events_created ON public.basket_events USING btree (created_at DESC);
CREATE INDEX idx_basket_events_created_at ON public.basket_events USING btree (created_at DESC);
CREATE INDEX idx_basket_events_event_type ON public.basket_events USING btree (event_type);
CREATE INDEX idx_baskets_workspace ON public.baskets USING btree (workspace_id);
CREATE INDEX idx_blocks_basket ON public.blocks USING btree (basket_id);
CREATE INDEX idx_blocks_raw_dump ON public.blocks USING btree (raw_dump_id);
CREATE INDEX idx_blocks_workspace ON public.blocks USING btree (workspace_id);
CREATE INDEX idx_context_basket ON public.context_items USING btree (basket_id);
CREATE INDEX idx_context_doc ON public.context_items USING btree (document_id);
CREATE INDEX idx_context_items_basket ON public.context_items USING btree (basket_id);
CREATE INDEX idx_context_items_basket_id ON public.context_items USING btree (basket_id);
CREATE INDEX idx_documents_basket ON public.documents USING btree (basket_id);
CREATE INDEX idx_documents_workspace ON public.documents USING btree (workspace_id);
CREATE INDEX idx_events_agent_type ON public.events USING btree (agent_type);
CREATE INDEX idx_events_basket_kind_ts ON public.events USING btree (basket_id, kind, ts);
CREATE INDEX idx_events_origin_kind ON public.events USING btree (origin, kind);
CREATE INDEX idx_events_workspace_ts ON public.events USING btree (workspace_id, ts DESC);
CREATE INDEX idx_idem_delta_id ON public.idempotency_keys USING btree (delta_id);
CREATE INDEX idx_idempotency_delta ON public.idempotency_keys USING btree (delta_id);
CREATE INDEX idx_idempotency_keys_delta_id ON public.idempotency_keys USING btree (delta_id);
CREATE INDEX idx_narrative_basket ON public.narrative USING btree (basket_id);
CREATE INDEX idx_raw_dumps_basket ON public.raw_dumps USING btree (basket_id);
CREATE INDEX idx_raw_dumps_file_url ON public.raw_dumps USING btree (file_url);
CREATE INDEX idx_raw_dumps_source_meta_gin ON public.raw_dumps USING gin (source_meta);
CREATE INDEX idx_raw_dumps_trace ON public.raw_dumps USING btree (ingest_trace_id);
CREATE INDEX idx_rawdump_doc ON public.raw_dumps USING btree (document_id);
CREATE INDEX idx_relationships_from ON public.substrate_relationships USING btree (from_type, from_id);
CREATE INDEX idx_relationships_to ON public.substrate_relationships USING btree (to_type, to_id);
CREATE UNIQUE INDEX uq_baskets_user_idem ON public.baskets USING btree (user_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE UNIQUE INDEX uq_dumps_basket_req ON public.raw_dumps USING btree (basket_id, dump_request_id) WHERE (dump_request_id IS NOT NULL);
CREATE UNIQUE INDEX ux_raw_dumps_basket_trace ON public.raw_dumps USING btree (basket_id, ingest_trace_id) WHERE (ingest_trace_id IS NOT NULL);
CREATE TRIGGER trg_block_depth BEFORE INSERT OR UPDATE ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.check_block_depth();
CREATE TRIGGER trg_lock_constant BEFORE INSERT OR UPDATE ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.prevent_lock_vs_constant();
CREATE TRIGGER trg_set_basket_user_id BEFORE INSERT ON public.baskets FOR EACH ROW EXECUTE FUNCTION public.set_basket_user_id();
ALTER TABLE ONLY public.block_links
    ADD CONSTRAINT block_links_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.block_links
    ADD CONSTRAINT block_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.block_revisions
    ADD CONSTRAINT block_revisions_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.block_revisions
    ADD CONSTRAINT block_revisions_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.block_revisions
    ADD CONSTRAINT block_revisions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_parent_block_id_fkey FOREIGN KEY (parent_block_id) REFERENCES public.blocks(id);
ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_raw_dump_id_fkey FOREIGN KEY (raw_dump_id) REFERENCES public.raw_dumps(id);
ALTER TABLE ONLY public.context_items
    ADD CONSTRAINT context_items_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.context_items
    ADD CONSTRAINT context_items_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.context_items
    ADD CONSTRAINT context_items_raw_dump_id_fkey FOREIGN KEY (raw_dump_id) REFERENCES public.raw_dumps(id);
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id);
ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT fk_basket_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT fk_baskets_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT fk_block_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT fk_raw_dump FOREIGN KEY (raw_dump_id) REFERENCES public.raw_dumps(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY public.raw_dumps
    ADD CONSTRAINT fk_rawdump_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.raw_dumps
    ADD CONSTRAINT fk_rawdump_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id);
ALTER TABLE ONLY public.narrative
    ADD CONSTRAINT narrative_raw_dump_id_fkey FOREIGN KEY (raw_dump_id) REFERENCES public.raw_dumps(id);
ALTER TABLE ONLY public.raw_dumps
    ADD CONSTRAINT raw_dumps_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.substrate_relationships
    ADD CONSTRAINT substrate_relationships_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id);
ALTER TABLE ONLY public.workspace_memberships
    ADD CONSTRAINT workspace_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workspace_memberships
    ADD CONSTRAINT workspace_memberships_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE POLICY "Allow anon read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow anon read raw_dumps" ON public.raw_dumps FOR SELECT USING (true);
CREATE POLICY "Allow anon read revisions" ON public.revisions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to view basket events" ON public.basket_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow baskets for workspace members" ON public.baskets FOR SELECT TO authenticated USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY "Allow insert for members" ON public.workspace_memberships FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow insert for owner" ON public.workspaces FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "Allow own workspace memberships" ON public.workspace_memberships FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Allow owner to read workspace" ON public.workspaces FOR SELECT USING ((auth.uid() = owner_id));
CREATE POLICY "Allow users to see their own workspace memberships" ON public.workspace_memberships FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "Allow workspace members to read baskets" ON public.baskets FOR SELECT USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY "Anon can view events temporarily" ON public.basket_events FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can view events" ON public.basket_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.baskets TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert events for their workspaces" ON public.events FOR INSERT TO authenticated WITH CHECK ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY "Users can modify block revisions in their workspaces" ON public.block_revisions USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = block_revisions.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can modify blocks in their workspaces" ON public.blocks USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = blocks.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can modify documents in their workspaces" ON public.documents USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = documents.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can read block revisions in their workspaces" ON public.block_revisions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = block_revisions.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can read blocks in their workspaces" ON public.blocks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = blocks.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can read documents in their workspaces" ON public.documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = documents.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Users can view blocks in their workspace" ON public.blocks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.baskets
  WHERE ((baskets.id = blocks.basket_id) AND (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
CREATE POLICY "Users can view context_items in their workspace" ON public.context_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.baskets
  WHERE ((baskets.id = context_items.basket_id) AND (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
CREATE POLICY "Users can view narrative in their workspace" ON public.narrative FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.baskets
  WHERE ((baskets.id = narrative.basket_id) AND (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
CREATE POLICY "Users can view raw_dumps in their workspace" ON public.raw_dumps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.baskets
  WHERE ((baskets.id = raw_dumps.basket_id) AND (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
CREATE POLICY "Users can view relationships in their workspace" ON public.substrate_relationships FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.baskets
  WHERE ((baskets.id = substrate_relationships.basket_id) AND (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
CREATE POLICY "Workspace members can read events" ON public.events FOR SELECT USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY "Workspace members can update events" ON public.events FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = events.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "Workspace members can view events" ON public.events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = events.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY "allow agent insert" ON public.revisions FOR INSERT TO authenticated WITH CHECK (((basket_id IS NOT NULL) AND (basket_id IN ( SELECT baskets.id
   FROM public.baskets
  WHERE (baskets.workspace_id IN ( SELECT workspace_memberships.workspace_id
           FROM public.workspace_memberships
          WHERE (workspace_memberships.user_id = auth.uid())))))));
ALTER TABLE public.basket_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY basket_member_delete ON public.baskets FOR DELETE USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY basket_member_insert ON public.baskets FOR INSERT WITH CHECK ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY basket_member_read ON public.baskets FOR SELECT USING (((auth.uid() IS NOT NULL) AND (workspace_id IN ( SELECT workspaces.id
   FROM public.workspaces
  WHERE (workspaces.owner_id = auth.uid())))));
CREATE POLICY basket_member_update ON public.baskets FOR UPDATE USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
CREATE POLICY baskets_insert_members ON public.baskets FOR INSERT TO authenticated WITH CHECK ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY block_member_delete ON public.blocks FOR DELETE USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY block_member_insert ON public.blocks FOR INSERT WITH CHECK ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY block_member_read ON public.blocks FOR SELECT USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY block_member_update ON public.blocks FOR UPDATE USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
ALTER TABLE public.block_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY context_items_delete ON public.context_items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE ((b.id = context_items.basket_id) AND (wm.user_id = auth.uid())))));
CREATE POLICY context_items_insert ON public.context_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE ((b.id = context_items.basket_id) AND (wm.user_id = auth.uid())))));
CREATE POLICY context_items_select ON public.context_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE ((b.id = context_items.basket_id) AND (wm.user_id = auth.uid())))));
CREATE POLICY context_items_update ON public.context_items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE ((b.id = context_items.basket_id) AND (wm.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE ((b.id = context_items.basket_id) AND (wm.user_id = auth.uid())))));
CREATE POLICY ctx_member_delete ON public.context_items FOR DELETE USING ((basket_id IN ( SELECT b.id
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE (wm.user_id = auth.uid()))));
CREATE POLICY ctx_member_insert ON public.context_items FOR INSERT WITH CHECK ((basket_id IN ( SELECT b.id
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE (wm.user_id = auth.uid()))));
CREATE POLICY ctx_member_read ON public.context_items FOR SELECT USING ((basket_id IN ( SELECT b.id
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE (wm.user_id = auth.uid()))));
CREATE POLICY ctx_member_update ON public.context_items FOR UPDATE USING ((basket_id IN ( SELECT b.id
   FROM (public.baskets b
     JOIN public.workspace_memberships wm ON ((wm.workspace_id = b.workspace_id)))
  WHERE (wm.user_id = auth.uid()))));
CREATE POLICY "debug insert bypass" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY dump_member_read ON public.raw_dumps FOR SELECT USING ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY event_member_delete ON public.events FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = events.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY event_member_insert ON public.events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = events.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY event_member_update ON public.events FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = events.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY member_self_crud ON public.workspace_memberships USING ((user_id = auth.uid()));
CREATE POLICY member_self_insert ON public.workspace_memberships FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY raw_dumps_workspace_insert ON public.raw_dumps FOR INSERT TO authenticated WITH CHECK ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));
CREATE POLICY revision_member_delete ON public.block_revisions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = block_revisions.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY revision_member_insert ON public.block_revisions FOR INSERT WITH CHECK (true);
CREATE POLICY revision_member_read ON public.block_revisions FOR SELECT USING (true);
CREATE POLICY revision_member_update ON public.block_revisions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.workspace_memberships
  WHERE ((workspace_memberships.workspace_id = block_revisions.workspace_id) AND (workspace_memberships.user_id = auth.uid())))));
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_events ON public.events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.baskets b
  WHERE ((b.id = events.basket_id) AND (b.user_id = auth.uid())))));
CREATE POLICY select_own_raw_dumps ON public.raw_dumps FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.baskets b
  WHERE ((b.id = raw_dumps.basket_id) AND (b.user_id = auth.uid())))));
CREATE POLICY select_own_revisions ON public.revisions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.baskets b
  WHERE ((b.id = revisions.basket_id) AND (b.user_id = auth.uid())))));
CREATE POLICY "service role ALL access" ON public.raw_dumps TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role full access" ON public.baskets TO service_role USING (true);
CREATE POLICY "service role full access" ON public.raw_dumps TO service_role USING (true);
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY ws_owner_delete ON public.workspaces FOR DELETE USING ((owner_id = auth.uid()));
CREATE POLICY ws_owner_or_member_read ON public.workspaces FOR SELECT USING (((owner_id = auth.uid()) OR (id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid())))));
CREATE POLICY ws_owner_update ON public.workspaces FOR UPDATE USING ((owner_id = auth.uid()));
