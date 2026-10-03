-- Hashi: estrutura atual de public/private em 03/10/2026. SEM DADOS.
-- Gerado do catálogo; não é um pg_dump. Use somente em Supabase novo e vazio.
-- Consulte ../08-instalacao-clonagem-e-publicacao.md antes de executar.
-- Os schemas gerenciados auth/storage, funções auth.uid() e papéis Supabase devem existir.
BEGIN;
SET LOCAL check_function_bodies = false;
SET LOCAL search_path = public, private, extensions;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema IN ('public','private') AND table_name IN ('config_login','credenciais','recuperacoes_senha','sessoes','tentativas_login','contratos','funcionarios','manutencoes','registro_equipes','registros_frota','tipos_manutencao','usuarios','veiculo_documentos','veiculos')) THEN
  RAISE EXCEPTION 'Destino não está vazio. Este arquivo não pode ser aplicado ao banco atual.';
 END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE "private"."config_login" (
  "id" boolean DEFAULT true NOT NULL,
  "hash_ficticio" text NOT NULL
);

CREATE TABLE "private"."credenciais" (
  "usuario_id" uuid NOT NULL,
  "senha_hash" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "private"."recuperacoes_senha" (
  "usuario_id" uuid NOT NULL,
  "codigo_hash" bytea,
  "expira_em" timestamp with time zone NOT NULL,
  "tentativas" integer DEFAULT 0 NOT NULL,
  "token_hash" bytea,
  "token_expira_em" timestamp with time zone
);

CREATE TABLE "private"."sessoes" (
  "token_hash" bytea NOT NULL,
  "usuario_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."tentativas_login" (
  "bucket" integer NOT NULL,
  "falhas" integer DEFAULT 0 NOT NULL,
  "inicio" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."contratos" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nome" text NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."funcionarios" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nome" text NOT NULL,
  "is_status" boolean DEFAULT false NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."manutencoes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "data" date NOT NULL,
  "tipo_manutencao_id" bigint NOT NULL,
  "motorista_id" bigint,
  "contrato_id" bigint NOT NULL,
  "veiculo_id" bigint NOT NULL,
  "custo" numeric(12,2) NOT NULL,
  "usuario_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "versao" integer DEFAULT 1 NOT NULL,
  "observacao" text
);

CREATE TABLE "public"."registro_equipes" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "registro_frota_id" uuid NOT NULL,
  "numero_equipe" integer NOT NULL,
  "responsavel_id" bigint NOT NULL,
  "veiculo_id" bigint NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."registros_frota" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "data" date NOT NULL,
  "contrato_id" bigint NOT NULL,
  "numero_equipes" integer NOT NULL,
  "usuario_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "versao" integer DEFAULT 1 NOT NULL
);

CREATE TABLE "public"."tipos_manutencao" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nome" text NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."usuarios" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "perfil" text DEFAULT 'funcionario'::text NOT NULL,
  "ativo" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "login" text NOT NULL,
  "sobrenome" text DEFAULT ''::text NOT NULL
);

CREATE TABLE "public"."veiculo_documentos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "veiculo_id" bigint,
  "storage_path" text NOT NULL
);

CREATE TABLE "public"."veiculos" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "placa" text NOT NULL,
  "modelo" text NOT NULL,
  "tipo" text DEFAULT 'veiculo'::text NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "private"."config_login" ADD CONSTRAINT "config_login_pkey" PRIMARY KEY (id);
ALTER TABLE "private"."credenciais" ADD CONSTRAINT "credenciais_pkey" PRIMARY KEY (usuario_id);
ALTER TABLE "private"."recuperacoes_senha" ADD CONSTRAINT "recuperacoes_senha_pkey" PRIMARY KEY (usuario_id);
ALTER TABLE "private"."sessoes" ADD CONSTRAINT "sessoes_pkey" PRIMARY KEY (token_hash);
ALTER TABLE "private"."tentativas_login" ADD CONSTRAINT "tentativas_login_pkey" PRIMARY KEY (bucket);
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."registros_frota" ADD CONSTRAINT "registros_frota_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."tipos_manutencao" ADD CONSTRAINT "tipos_manutencao_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."veiculo_documentos" ADD CONSTRAINT "veiculo_documentos_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_pkey" PRIMARY KEY (id);
ALTER TABLE "private"."recuperacoes_senha" ADD CONSTRAINT "recuperacoes_senha_token_hash_key" UNIQUE (token_hash);
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_nome_key" UNIQUE (nome);
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_nome_key" UNIQUE (nome);
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_registro_frota_id_numero_equipe_key" UNIQUE (registro_frota_id, numero_equipe);
ALTER TABLE "public"."tipos_manutencao" ADD CONSTRAINT "tipos_manutencao_nome_key" UNIQUE (nome);
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_login_key" UNIQUE (login);
ALTER TABLE "public"."veiculo_documentos" ADD CONSTRAINT "veiculo_documentos_storage_path_key" UNIQUE (storage_path);
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_placa_key" UNIQUE (placa);
ALTER TABLE "private"."config_login" ADD CONSTRAINT "config_login_id_check" CHECK (id);
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_nome_check" CHECK (length(TRIM(BOTH FROM nome)) > 0);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_custo_check" CHECK (custo >= 0::numeric AND custo <= 9999999999.99);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_observacao_limite" CHECK (char_length(observacao) <= 40);
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_numero_equipe_check" CHECK (numero_equipe >= 1 AND numero_equipe <= 50);
ALTER TABLE "public"."registros_frota" ADD CONSTRAINT "registros_frota_numero_equipes_check" CHECK (numero_equipes >= 1 AND numero_equipes <= 50);
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_login_check" CHECK (login IS NULL OR login ~ '^[a-z][a-z0-9_]{2,39}$'::text);
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_perfil_check" CHECK (perfil = ANY (ARRAY['funcionario'::text, 'admin'::text]));
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_sobrenome_tamanho" CHECK (length(sobrenome) <= 100);
ALTER TABLE "public"."veiculo_documentos" ADD CONSTRAINT "veiculo_documentos_storage_path_check" CHECK (storage_path ~ '^crlv/[a-f0-9]{64}/CRLVDigital_[A-Z]{3}[0-9][A-Z0-9][0-9]{2}_20[0-9]{2}\.pdf$'::text);
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_tipo_check" CHECK (tipo = ANY (ARRAY['veiculo'::text, 'equipamento'::text]));
ALTER TABLE "private"."credenciais" ADD CONSTRAINT "credenciais_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE "private"."recuperacoes_senha" ADD CONSTRAINT "recuperacoes_senha_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE "private"."sessoes" ADD CONSTRAINT "sessoes_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_contrato_id_fkey" FOREIGN KEY (contrato_id) REFERENCES contratos(id);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_motorista_id_fkey" FOREIGN KEY (motorista_id) REFERENCES funcionarios(id);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_tipo_manutencao_id_fkey" FOREIGN KEY (tipo_manutencao_id) REFERENCES tipos_manutencao(id);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_veiculo_id_fkey" FOREIGN KEY (veiculo_id) REFERENCES veiculos(id);
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_registro_frota_id_fkey" FOREIGN KEY (registro_frota_id) REFERENCES registros_frota(id) ON DELETE CASCADE;
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_responsavel_id_fkey" FOREIGN KEY (responsavel_id) REFERENCES funcionarios(id);
ALTER TABLE "public"."registro_equipes" ADD CONSTRAINT "registro_equipes_veiculo_id_fkey" FOREIGN KEY (veiculo_id) REFERENCES veiculos(id);
ALTER TABLE "public"."registros_frota" ADD CONSTRAINT "registros_frota_contrato_id_fkey" FOREIGN KEY (contrato_id) REFERENCES contratos(id);
ALTER TABLE "public"."registros_frota" ADD CONSTRAINT "registros_frota_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE "public"."veiculo_documentos" ADD CONSTRAINT "veiculo_documentos_veiculo_id_fkey" FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE RESTRICT;
CREATE INDEX sessoes_expiracao ON private.sessoes USING btree (expires_at);
CREATE INDEX sessoes_usuario ON private.sessoes USING btree (usuario_id, created_at DESC);
CREATE INDEX manutencoes_usuario_data ON public.manutencoes USING btree (usuario_id, created_at DESC);
CREATE INDEX manutencoes_veiculo ON public.manutencoes USING btree (veiculo_id);
CREATE INDEX equipes_registro ON public.registro_equipes USING btree (registro_frota_id);
CREATE INDEX equipes_responsavel_registro ON public.registro_equipes USING btree (responsavel_id, registro_frota_id);
CREATE INDEX equipes_veiculo ON public.registro_equipes USING btree (veiculo_id);
CREATE INDEX registros_usuario_data ON public.registros_frota USING btree (usuario_id, created_at DESC);
CREATE INDEX veiculo_documentos_veiculo_idx ON public.veiculo_documentos USING btree (veiculo_id);

CREATE OR REPLACE FUNCTION private.apagar_envio(p_id uuid, p_tipo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.e_admin() then raise exception 'Somente administradores podem apagar registros.' using errcode='42501'; end if;
  if p_id is null or p_tipo is null or p_tipo not in ('registro','manutencao') then raise exception 'Registro inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  if p_tipo='registro' then
    delete from public.registros_frota where id=p_id; -- Equipes excluídas pela FK em cascata.
  else
    delete from public.manutencoes where id=p_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION private.buscar_historico(p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
 RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with historico as (
    select r.id, 'registro'::text as tipo,r.data,c.nome as contrato,
      array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at
    from public.registros_frota r join public.contratos c on c.id=r.contrato_id
    join public.registro_equipes e on e.registro_frota_id=r.id join public.veiculos v on v.id=e.veiculo_id join public.funcionarios f on f.id=e.responsavel_id
    group by r.id,c.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
  )
  select * from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato || ' ' || array_to_string(h.placas,' '))) > 0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
$function$;

CREATE OR REPLACE FUNCTION private.editar_manutencao(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_existing public.manutencoes;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id for update;
  if not found or (v_existing.usuario_id<>private.usuario_id() and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  if p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then
    raise exception 'Data ou custo inválido.';
  end if;
  if v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and (v_existing.motorista_id is not distinct from p_motorista_id)
    and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
  if p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or (p_motorista_id is not null and not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status))
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  update public.manutencoes set data=p_data,tipo_manutencao_id=p_tipo_id,motorista_id=p_motorista_id,
    contrato_id=p_contrato_id,veiculo_id=p_veiculo_id,custo=p_custo,versao=versao+1 where id=p_id;
  return p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.editar_registro(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_existing public.registros_frota; v_equipes jsonb; v_count integer;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.registros_frota where id=p_id for update;
  if not found or (v_existing.usuario_id<>private.usuario_id() and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  if p_data is null or jsonb_typeof(p_equipes) is distinct from 'array' then raise exception 'Dados inválidos.'; end if;
  v_count:=jsonb_array_length(p_equipes);
  if v_count not between 1 and 50 then raise exception 'Adicione de 1 a 50 equipes.'; end if;
  select jsonb_agg(jsonb_build_object('responsavel_id',responsavel_id,'veiculo_id',veiculo_id) order by numero_equipe)
    into v_equipes from public.registro_equipes where registro_frota_id=p_id;
  -- Repetir uma edição já concluída é seguro em caso de perda da resposta da rede.
  if v_existing.data=p_data and v_existing.contrato_id=p_contrato_id and v_equipes=p_equipes then return p_id; end if;
  if p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  if not exists(select 1 from public.contratos where id=p_contrato_id and ativo) then raise exception 'Selecione um contrato ativo.'; end if;
  if exists(select 1 from jsonb_array_elements(p_equipes) e where
    not exists(select 1 from public.funcionarios f where f.id=(e->>'responsavel_id')::bigint and f.ativo and not f.is_status)
    or not exists(select 1 from public.veiculos v where v.id=(e->>'veiculo_id')::bigint and v.ativo)) then
    raise exception 'Selecione um responsável e um veículo ativos para cada equipe.';
  end if;
  update public.registros_frota set data=p_data,contrato_id=p_contrato_id,numero_equipes=v_count,versao=versao+1 where id=p_id;
  delete from public.registro_equipes where registro_frota_id=p_id;
  insert into public.registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id)
    select p_id,ordinality,(value->>'responsavel_id')::bigint,(value->>'veiculo_id')::bigint
    from jsonb_array_elements(p_equipes) with ordinality;
  return p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.invalidar_recuperacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  delete from private.recuperacoes_senha where usuario_id=new.usuario_id;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.obter_envio(p_id uuid, p_tipo text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object('id',r.id,'date',r.data,'contractId',r.contrato_id,'version',r.versao,
    'teams',(select jsonb_agg(jsonb_build_object('responsavel_id',e.responsavel_id,'veiculo_id',e.veiculo_id) order by e.numero_equipe)
      from public.registro_equipes e where e.registro_frota_id=r.id))
  from public.registros_frota r where r.id=p_id and p_tipo='registro'
  union all
  select jsonb_build_object('id',m.id,'date',m.data,'contractId',m.contrato_id,'version',m.versao,
    'typeId',m.tipo_manutencao_id,'driverId',m.motorista_id,'vehicleId',m.veiculo_id,
    'costDigits',(m.custo*100)::bigint::text,'note',coalesce(m.observacao,''))
  from public.manutencoes m where m.id=p_id and p_tipo='manutencao';
$function$;

CREATE OR REPLACE FUNCTION private.revogar_ao_desativar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  if not new.ativo then
    delete from private.sessoes where usuario_id=new.id;
    delete from private.recuperacoes_senha where usuario_id=new.id;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.salvar_manutencao(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_existing public.manutencoes; v_uid uuid:=private.usuario_id();
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  if p_id is null or p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then raise exception 'Data ou custo inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id;
  if found then
    if v_existing.usuario_id=v_uid and v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and (v_existing.motorista_id is not distinct from p_motorista_id) and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or (p_motorista_id is not null and not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status))
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  insert into public.manutencoes(id,data,tipo_manutencao_id,motorista_id,contrato_id,veiculo_id,custo,usuario_id)
  values(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,v_uid);
  return p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.salvar_registro(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := private.usuario_id(); v_count integer; v_existing public.registros_frota; v_equipes jsonb;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  if p_id is null or p_data is null or jsonb_typeof(p_equipes) is distinct from 'array' then raise exception 'Dados inválidos.'; end if;
  v_count := jsonb_array_length(p_equipes);
  if v_count not between 1 and 50 then raise exception 'Selecione de 1 a 50 equipes.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.registros_frota where id=p_id;
  if found then
    select jsonb_agg(jsonb_build_object('responsavel_id',responsavel_id,'veiculo_id',veiculo_id) order by numero_equipe) into v_equipes from public.registro_equipes where registro_frota_id=p_id;
    if v_existing.usuario_id=v_uid and v_existing.data=p_data and v_existing.contrato_id=p_contrato_id and v_equipes=p_equipes then return p_id; end if;
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  if not exists(select 1 from public.contratos where id=p_contrato_id and ativo) then raise exception 'Selecione um contrato ativo.'; end if;
  if exists(select 1 from jsonb_array_elements(p_equipes) e where
    not exists(select 1 from public.funcionarios f where f.id=(e->>'responsavel_id')::bigint and f.ativo and not f.is_status)
    or not exists(select 1 from public.veiculos v where v.id=(e->>'veiculo_id')::bigint and v.ativo)) then
    raise exception 'Selecione um responsável e um veículo ativos para cada equipe.';
  end if;
  insert into public.registros_frota(id,data,contrato_id,numero_equipes,usuario_id) values(p_id,p_data,p_contrato_id,v_count,v_uid);
  insert into public.registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id)
  select p_id, ordinality, (value->>'responsavel_id')::bigint, (value->>'veiculo_id')::bigint from jsonb_array_elements(p_equipes) with ordinality;
  return p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.usuario_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select nullif(current_setting('hashi.usuario_id',true),'')::uuid;
$function$;

CREATE OR REPLACE FUNCTION private.validar_data_operacao(p_data date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if p_data is null then raise exception 'Escolha uma data válida.'; end if;
  if p_data > (statement_timestamp() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data não pode ser posterior a hoje.' using errcode='22007';
  end if;
end $function$;

CREATE OR REPLACE FUNCTION private.validar_sessao(p_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Sessão expirada. Entre novamente.' using errcode='28000';
  end if;
  select s.usuario_id into v_id from private.sessoes s join public.usuarios u on u.id=s.usuario_id
  where s.token_hash=extensions.digest(p_token,'sha256') and s.expires_at>now() and u.ativo;
  if v_id is null then raise exception 'Sessão expirada. Entre novamente.' using errcode='28000'; end if;
  perform set_config('hashi.usuario_id',v_id::text,true);
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.web_exigir_admin(p_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid := private.validar_sessao(p_token);
begin
  if not exists(select 1 from public.usuarios where id=v_id and ativo and perfil='admin') then
    raise exception 'Somente administradores podem gerenciar cadastros e usuários.' using errcode='42501';
  end if;
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.apagar_envio(p_token text, p_id uuid, p_tipo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  perform private.validar_sessao(p_token); perform private.apagar_envio(p_id,p_tipo); end $function$;

CREATE OR REPLACE FUNCTION public.autenticar_usuario(p_usuario text, p_senha text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_login text:=lower(btrim(coalesce(p_usuario,'')));
  v_bucket integer;
  v_limite private.tentativas_login;
  v_user public.usuarios;
  v_hash text;
  v_ok boolean;
  v_token text;
  v_expira timestamptz:=now()+interval '7 days';
begin
  if length(v_login)>40 or p_senha is null or octet_length(p_senha)>72 or length(p_senha)<1 then
    return jsonb_build_object('error','Usuário ou senha incorretos.');
  end if;
  v_bucket:=((hashtextextended(v_login,0) & 2147483647) % 1024)::integer;
  select * into v_limite from private.tentativas_login where bucket=v_bucket for update;
  if v_limite.inicio<=now()-interval '15 minutes' then
    update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
    v_limite.falhas:=0;
  end if;
  if v_limite.falhas>=10 then
    return jsonb_build_object('error','Muitas tentativas. Aguarde 15 minutos e tente novamente.');
  end if;
  select * into v_user from public.usuarios where login=v_login for share;
  select senha_hash into v_hash from private.credenciais where usuario_id=v_user.id;
  if v_hash is null then select hash_ficticio into v_hash from private.config_login; end if;
  v_ok:=extensions.crypt(p_senha,v_hash)=v_hash;
  if not coalesce(v_ok and v_user.ativo,false) then
    update private.tentativas_login set falhas=falhas+1 where bucket=v_bucket;
    -- Retorna erro como dado: uma excecao desfaria a contagem de tentativas.
    return jsonb_build_object('error','Usuário ou senha incorretos.');
  end if;
  update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
  delete from private.sessoes where expires_at<=now();
  delete from private.sessoes where token_hash in (
    select token_hash from private.sessoes where usuario_id=v_user.id order by created_at desc offset 9
  );
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private.sessoes(token_hash,usuario_id,expires_at)
  values(extensions.digest(v_token,'sha256'),v_user.id,v_expira);
  return jsonb_build_object('token',v_token,'expiresAt',v_expira,'user',jsonb_build_object('id',v_user.id),'profile',to_jsonb(v_user));
end;
$function$;

CREATE OR REPLACE FUNCTION public.buscar_historico(p_token text, p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
 RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin();
begin
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at
    from public.registros_frota r join public.contratos c on c.id=r.contrato_id
    join public.registro_equipes e on e.registro_frota_id=r.id join public.veiculos v on v.id=e.veiculo_id join public.funcionarios f on f.id=e.responsavel_id
    where r.usuario_id=v_uid or v_admin group by r.id,c.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo,'observacao',m.observacao)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where m.usuario_id=v_uid or v_admin
  ) select h.* from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato||' '||array_to_string(h.placas,' ')))>0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $function$;

CREATE OR REPLACE FUNCTION public.buscar_historico_com_autor(p_token text, p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
 RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return query
  select h.id,h.tipo,h.data,h.contrato,h.placas,h.detalhes,h.custo,h.created_at,u.nome
  from public.buscar_historico(p_token,p_busca,p_limite,p_offset,p_tipo) h
  left join public.registros_frota r on h.tipo='registro' and r.id=h.id
  left join public.manutencoes m on h.tipo='manutencao' and m.id=h.id
  join public.usuarios u on u.id=coalesce(r.usuario_id,m.usuario_id)
  order by h.created_at desc,h.id desc;
end $function$;

CREATE OR REPLACE FUNCTION public.cadastrar_usuario(p_usuario text, p_senha text, p_perfil text DEFAULT 'funcionario'::text, p_nome text DEFAULT NULL::text, p_sobrenome text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_login text:=lower(btrim(p_usuario));
  v_nome text:=btrim(p_nome);
  v_sobrenome text:=btrim(p_sobrenome);
  v_id uuid;
begin
  if v_login is null or v_login !~ '^[a-z][a-z0-9_]{2,39}$' then
    raise exception 'Usuário inválido: use de 3 a 40 letras, números ou _, começando por letra.';
  end if;
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then
    raise exception 'Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes.';
  end if;
  if p_perfil is null or p_perfil not in ('funcionario','admin') then
    raise exception 'Perfil inválido: funcionario ou admin.';
  end if;
  if v_nome is null or length(v_nome) not between 1 and 100 then
    raise exception 'Informe o nome, com até 100 caracteres.';
  end if;
  if v_sobrenome is null or length(v_sobrenome) not between 1 and 100 then
    raise exception 'Informe o sobrenome, com até 100 caracteres.';
  end if;
  if exists(select 1 from public.usuarios where login=v_login) then
    raise exception 'Esse usuário já existe. Nenhuma senha foi alterada.';
  end if;
  insert into public.usuarios(login,nome,sobrenome,perfil,ativo)
  values(v_login,v_nome,v_sobrenome,p_perfil,true) returning id into v_id;
  insert into private.credenciais(usuario_id,senha_hash)
  values(v_id,extensions.crypt(p_senha,extensions.gen_salt('bf',12)));
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.definir_senha_usuario(p_usuario text, p_senha text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_bucket integer;
begin
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then raise exception 'Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes.'; end if;
  v_bucket:=((hashtextextended(lower(btrim(p_usuario)),0) & 2147483647) % 1024)::integer;
  perform 1 from private.tentativas_login where bucket=v_bucket for update;
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) for update;
  if v_id is null then raise exception 'Usuário não encontrado.'; end if;
  insert into private.credenciais(usuario_id,senha_hash) values(v_id,extensions.crypt(p_senha,extensions.gen_salt('bf',12)))
  on conflict(usuario_id) do update set senha_hash=excluded.senha_hash,updated_at=now();
  delete from private.sessoes where usuario_id=v_id;
  update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
end;
$function$;

CREATE OR REPLACE FUNCTION public.e_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists(select 1 from public.usuarios where id=private.usuario_id() and ativo and perfil='admin');
$function$;

CREATE OR REPLACE FUNCTION public.editar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.editar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,p_versao); end $function$;

CREATE OR REPLACE FUNCTION public.editar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer, p_observacao text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_existing public.manutencoes; v_uid uuid:=private.validar_sessao(p_token);
  v_note text:=nullif(btrim(p_observacao),''); v_changed boolean;
begin
  perform private.validar_data_operacao(p_data);
  if char_length(p_observacao)>40 then
    raise exception 'A observação deve ter no máximo 40 caracteres.' using errcode='22001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id for update;
  if not found or (v_existing.usuario_id<>v_uid and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  v_changed:=v_existing.observacao is distinct from v_note;
  if v_changed and p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  perform private.editar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,p_versao);
  if v_changed then
    -- Editar apenas a observacao tambem avanca a versao; editar ambos avanca uma unica vez.
    update public.manutencoes set observacao=v_note,
      versao=case when versao=v_existing.versao then versao+1 else versao end where id=p_id;
  end if;
  return p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.editar_registro(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.editar_registro(p_id,p_data,p_contrato_id,p_equipes,p_versao); end $function$;

CREATE OR REPLACE FUNCTION public.encerrar_sessao(p_token text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  delete from private.sessoes where token_hash=extensions.digest(p_token,'sha256');
$function$;

CREATE OR REPLACE FUNCTION public.filtrar_historico(p_token text, p_tipo text DEFAULT 'registro'::text, p_periodo text DEFAULT 'week'::text, p_campo_data text DEFAULT 'created_at'::text, p_data_de date DEFAULT NULL::date, p_data_ate date DEFAULT NULL::date, p_motorista_id bigint DEFAULT NULL::bigint, p_veiculo_id bigint DEFAULT NULL::bigint, p_contrato_id bigint DEFAULT NULL::bigint, p_autor_id uuid DEFAULT NULL::uuid, p_tipo_manutencao_id bigint DEFAULT NULL::bigint, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid:=private.validar_sessao(p_token);
  v_admin boolean:=public.e_admin();
  v_de date; v_ate date; v_inicio timestamptz; v_fim timestamptz;
begin
  if p_tipo is null or p_tipo not in ('registro','manutencao')
    or p_periodo is null or p_periodo not in ('week','custom','all')
    or p_campo_data is null or p_campo_data not in ('created_at','data') then
    raise exception 'Filtro inválido.' using errcode='22023';
  end if;
  if p_periodo='week' then
    v_ate:=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
    v_de:=v_ate-6;
  elsif p_periodo='custom' then
    v_de:=p_data_de; v_ate:=p_data_ate;
    if (v_de is null and v_ate is null) or v_de>v_ate then
      raise exception 'Período inválido. Confira as datas.' using errcode='22023';
    end if;
  end if;
  v_inicio:=v_de::timestamp at time zone 'America/Sao_Paulo';
  v_fim:=(v_ate+1)::timestamp at time zone 'America/Sao_Paulo';
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,
      array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at,u.nome as autor_nome
    from public.registros_frota r
    join public.contratos c on c.id=r.contrato_id
    join public.usuarios u on u.id=r.usuario_id
    join public.registro_equipes e on e.registro_frota_id=r.id
    join public.veiculos v on v.id=e.veiculo_id
    join public.funcionarios f on f.id=e.responsavel_id
    where p_tipo='registro' and (r.usuario_id=v_uid or v_admin)
      and (p_contrato_id is null or r.contrato_id=p_contrato_id)
      and (p_autor_id is null or r.usuario_id=p_autor_id)
      and ((p_campo_data='data' and (v_de is null or r.data>=v_de) and (v_ate is null or r.data<=v_ate))
        or (p_campo_data='created_at' and (v_inicio is null or r.created_at>=v_inicio) and (v_fim is null or r.created_at<v_fim)))
      and exists(select 1 from public.registro_equipes x where x.registro_frota_id=r.id
        and (p_motorista_id is null or x.responsavel_id=p_motorista_id)
        and (p_veiculo_id is null or x.veiculo_id=p_veiculo_id))
    group by r.id,c.nome,u.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],
      jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo,'observacao',m.observacao)),m.custo,m.created_at,u.nome
    from public.manutencoes m
    join public.contratos c on c.id=m.contrato_id
    join public.usuarios u on u.id=m.usuario_id
    join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id
    join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where p_tipo='manutencao' and (m.usuario_id=v_uid or v_admin)
      and (p_contrato_id is null or m.contrato_id=p_contrato_id)
      and (p_autor_id is null or m.usuario_id=p_autor_id)
      and (p_veiculo_id is null or m.veiculo_id=p_veiculo_id)
      and (p_motorista_id is null or (p_motorista_id=0 and m.motorista_id is null) or m.motorista_id=p_motorista_id)
      and (p_tipo_manutencao_id is null or m.tipo_manutencao_id=p_tipo_manutencao_id)
      and ((p_campo_data='data' and (v_de is null or m.data>=v_de) and (v_ate is null or m.data<=v_ate))
        or (p_campo_data='created_at' and (v_inicio is null or m.created_at>=v_inicio) and (v_fim is null or m.created_at<v_fim)))
  ) select h.* from historico h order by h.created_at desc,h.id desc
  limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $function$;

CREATE OR REPLACE FUNCTION public.filtrar_historico_multiplos(p_token text, p_tipo text DEFAULT 'registro'::text, p_data_de date DEFAULT (((statement_timestamp() AT TIME ZONE 'America/Sao_Paulo'::text))::date - 6), p_data_ate date DEFAULT ((statement_timestamp() AT TIME ZONE 'America/Sao_Paulo'::text))::date, p_motorista_ids bigint[] DEFAULT '{}'::bigint[], p_veiculo_ids bigint[] DEFAULT '{}'::bigint[], p_contrato_ids bigint[] DEFAULT '{}'::bigint[], p_autor_ids uuid[] DEFAULT '{}'::uuid[], p_tipo_manutencao_ids bigint[] DEFAULT '{}'::bigint[], p_limite integer DEFAULT 21, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin();
begin
  if p_tipo is null or p_tipo not in ('registro','manutencao') or p_data_de>p_data_ate then
    raise exception 'Filtro inválido. Confira as datas e a categoria.' using errcode='22023';
  end if;
  p_motorista_ids:=coalesce(array_remove(p_motorista_ids,null),'{}');
  p_veiculo_ids:=coalesce(array_remove(p_veiculo_ids,null),'{}');
  p_contrato_ids:=coalesce(array_remove(p_contrato_ids,null),'{}');
  p_autor_ids:=coalesce(array_remove(p_autor_ids,null),'{}');
  p_tipo_manutencao_ids:=coalesce(array_remove(p_tipo_manutencao_ids,null),'{}');
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,
      array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at,u.nome as autor_nome
    from public.registros_frota r
    join public.contratos c on c.id=r.contrato_id
    join public.usuarios u on u.id=r.usuario_id
    join public.registro_equipes e on e.registro_frota_id=r.id
    join public.veiculos v on v.id=e.veiculo_id
    join public.funcionarios f on f.id=e.responsavel_id
    where p_tipo='registro' and (r.usuario_id=v_uid or v_admin)
      and (cardinality(p_contrato_ids)=0 or r.contrato_id=any(p_contrato_ids))
      and (cardinality(p_autor_ids)=0 or r.usuario_id=any(p_autor_ids))
      and (p_data_de is null or r.data>=p_data_de) and (p_data_ate is null or r.data<=p_data_ate)
      and exists(select 1 from public.registro_equipes x where x.registro_frota_id=r.id
        and (cardinality(p_motorista_ids)=0 or x.responsavel_id=any(p_motorista_ids))
        and (cardinality(p_veiculo_ids)=0 or x.veiculo_id=any(p_veiculo_ids)))
    group by r.id,c.nome,u.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],
      jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo,'observacao',m.observacao)),m.custo,m.created_at,u.nome
    from public.manutencoes m
    join public.contratos c on c.id=m.contrato_id
    join public.usuarios u on u.id=m.usuario_id
    join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id
    join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where p_tipo='manutencao' and (m.usuario_id=v_uid or v_admin)
      and (cardinality(p_contrato_ids)=0 or m.contrato_id=any(p_contrato_ids))
      and (cardinality(p_autor_ids)=0 or m.usuario_id=any(p_autor_ids))
      and (cardinality(p_veiculo_ids)=0 or m.veiculo_id=any(p_veiculo_ids))
      and (cardinality(p_motorista_ids)=0 or (0=any(p_motorista_ids) and m.motorista_id is null) or m.motorista_id=any(p_motorista_ids))
      and (cardinality(p_tipo_manutencao_ids)=0 or m.tipo_manutencao_id=any(p_tipo_manutencao_ids))
      and (p_data_de is null or m.data>=p_data_de) and (p_data_ate is null or m.data<=p_data_ate)
  ) select h.* from historico h order by h.created_at desc,h.id desc
  limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $function$;

CREATE OR REPLACE FUNCTION public.gerar_codigo_recuperacao(p_usuario text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_codigo text;
begin
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) and ativo for update;
  if v_id is null then raise exception 'Usuário ativo não encontrado.'; end if;
  v_codigo:=upper(encode(extensions.gen_random_bytes(8),'hex'));
  insert into private.recuperacoes_senha(usuario_id,codigo_hash,expira_em)
  values(v_id,extensions.digest(v_codigo,'sha256'),now()+interval '30 minutes')
  on conflict(usuario_id) do update set codigo_hash=excluded.codigo_hash,expira_em=excluded.expira_em,
    tentativas=0,token_hash=null,token_expira_em=null;
  return substr(v_codigo,1,4)||'-'||substr(v_codigo,5,4)||'-'||substr(v_codigo,9,4)||'-'||substr(v_codigo,13,4);
end $function$;

CREATE OR REPLACE FUNCTION public.listar_catalogos(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.validar_sessao(p_token);
  return jsonb_build_object(
    'employees',(select coalesce(jsonb_agg(f order by nome),'[]') from public.funcionarios f where ativo and not is_status),
    'vehicles',(select coalesce(jsonb_agg(v order by placa),'[]') from public.veiculos v where ativo),
    'contracts',(select coalesce(jsonb_agg(c order by nome),'[]') from public.contratos c where ativo),
    'maintenanceTypes',(select coalesce(jsonb_agg(t order by id),'[]') from public.tipos_manutencao t where ativo));
end;
$function$;

CREATE OR REPLACE FUNCTION public.meu_perfil(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid:=private.validar_sessao(p_token);
begin return (select to_jsonb(u) from public.usuarios u where id=v_id); end;
$function$;

CREATE OR REPLACE FUNCTION public.normalizar(p_texto text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select translate(lower(coalesce(p_texto,'')), 'áàâãäéèêëíìîïóòôõöúùûüç-', 'aaaaaeeeeiiiiooooouuuuc');
$function$;

CREATE OR REPLACE FUNCTION public.obter_envio(p_token text, p_id uuid, p_tipo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=private.validar_sessao(p_token);
begin
  if (p_tipo='registro' and exists(select 1 from public.registros_frota where id=p_id and (usuario_id=v_uid or public.e_admin())))
    or (p_tipo='manutencao' and exists(select 1 from public.manutencoes where id=p_id and (usuario_id=v_uid or public.e_admin()))) then
    return private.obter_envio(p_id,p_tipo);
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.opcoes_filtros_historico(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin(); v_result jsonb;
begin
  with r as materialized (select * from public.registros_frota where usuario_id=v_uid or v_admin),
    m as materialized (select * from public.manutencoes where usuario_id=v_uid or v_admin),
    e as materialized (select x.* from public.registro_equipes x join r on r.id=x.registro_frota_id)
  select jsonb_build_object(
    'drivers',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'nome',f.nome) order by f.nome,f.id)
      from public.funcionarios f where f.id in (select responsavel_id from e union select motorista_id from m)),'[]'::jsonb),
    'vehicles',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'placa',v.placa,'modelo',v.modelo) order by v.placa,v.id)
      from public.veiculos v where v.id in (select veiculo_id from e union select veiculo_id from m)),'[]'::jsonb),
    'contracts',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'nome',c.nome) order by c.nome,c.id)
      from public.contratos c where c.id in (select contrato_id from r union select contrato_id from m)),'[]'::jsonb),
    'authors',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'login',u.login) order by u.nome,u.id)
      from public.usuarios u where u.id in (select usuario_id from r union select usuario_id from m)),'[]'::jsonb),
    'maintenanceTypes',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'nome',t.nome) order by t.nome,t.id)
      from public.tipos_manutencao t where t.id in (select tipo_manutencao_id from m)),'[]'::jsonb)
  ) into v_result;
  return v_result;
end $function$;

CREATE OR REPLACE FUNCTION public.opcoes_filtros_historico_completas(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_opcoes jsonb:=public.opcoes_filtros_historico(p_token);
begin
  return jsonb_set(v_opcoes,'{authors}',coalesce((
    select jsonb_agg(a.value||jsonb_build_object('sobrenome',u.sobrenome) order by a.ord)
    from jsonb_array_elements(v_opcoes->'authors') with ordinality a(value,ord)
    join public.usuarios u on u.id=(a.value->>'id')::uuid
  ),'[]'::jsonb));
end $function$;

CREATE OR REPLACE FUNCTION public.proteger_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.login is distinct from old.login then
    raise exception 'O nome de usuario nao pode ser alterado. O campo nome pode ser editado.';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.recuperar_senha(p_token text, p_senha text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_login text; v_bucket integer; v_rec private.recuperacoes_senha;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  select u.id,u.login into v_id,v_login from private.recuperacoes_senha r join public.usuarios u on u.id=r.usuario_id
  where r.token_hash=extensions.digest(p_token,'sha256') and u.ativo;
  if v_id is null then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  -- Mesma ordem de locks usada por definir_senha_usuario: limite, usuario, recuperacao.
  v_bucket:=((hashtextextended(v_login,0) & 2147483647) % 1024)::integer;
  perform 1 from private.tentativas_login where bucket=v_bucket for update;
  perform 1 from public.usuarios where id=v_id and ativo for update;
  if not found then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  select * into v_rec from private.recuperacoes_senha where usuario_id=v_id for update;
  if v_rec.token_hash is null or v_rec.token_hash<>extensions.digest(p_token,'sha256') or v_rec.token_expira_em<=now() then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then
    return jsonb_build_object('error','Use uma senha com pelo menos 12 caracteres e no máximo 72 bytes.');
  end if;
  perform public.definir_senha_usuario(v_login,p_senha);
  -- A funcao redefine hash, revoga sessoes e o trigger consome a recuperacao.
  return jsonb_build_object('success',true);
end $function$;

CREATE OR REPLACE FUNCTION public.salvar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.salvar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo); end $function$;

CREATE OR REPLACE FUNCTION public.salvar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_observacao text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_existing public.manutencoes; v_exists boolean; v_note text:=nullif(btrim(p_observacao),'');
begin
  perform private.validar_sessao(p_token);
  perform private.validar_data_operacao(p_data);
  if char_length(p_observacao)>40 then
    raise exception 'A observação deve ter no máximo 40 caracteres.' using errcode='22001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id;
  v_exists:=found;
  if v_exists and v_existing.observacao is distinct from v_note then
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  perform private.salvar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo);
  if not v_exists then
    update public.manutencoes set observacao=v_note where id=p_id;
  end if;
  return p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.salvar_registro(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.salvar_registro(p_id,p_data,p_contrato_id,p_equipes); end $function$;

CREATE OR REPLACE FUNCTION public.ultimo_veiculo_motorista(p_token text, p_motorista_id bigint, p_excluir_registro uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := private.validar_sessao(p_token);
  v_admin boolean := public.e_admin();
  v_result jsonb;
begin
  select case when v.ativo then jsonb_build_object('vehicleId',v.id,'date',r.data) else null end
  into v_result
  from public.registro_equipes e
  join public.registros_frota r on r.id=e.registro_frota_id
  join public.veiculos v on v.id=e.veiculo_id
  join public.funcionarios f on f.id=e.responsavel_id
  where e.responsavel_id=p_motorista_id and f.ativo and not f.is_status
    and (p_excluir_registro is null or r.id<>p_excluir_registro)
    and (r.usuario_id=v_uid or v_admin)
  order by r.data desc,r.created_at desc,r.id desc,e.numero_equipe desc
  limit 1;
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.usuario_ativo()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists(select 1 from public.usuarios where id=private.usuario_id() and ativo);
$function$;

CREATE OR REPLACE FUNCTION public.validar_codigo_recuperacao(p_usuario text, p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_rec private.recuperacoes_senha; v_codigo text; v_token text;
begin
  if p_usuario is null or length(p_usuario)>80 or p_codigo is null or length(p_codigo)>80 then
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) and ativo for share;
  select * into v_rec from private.recuperacoes_senha where usuario_id=v_id for update;
  v_codigo:=upper(regexp_replace(p_codigo,'[-[:space:]]','','g'));
  if v_rec.usuario_id is null or v_rec.codigo_hash is null or v_rec.expira_em<=now() or v_rec.tentativas>=5 then
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  if v_rec.codigo_hash<>extensions.digest(v_codigo,'sha256') then
    update private.recuperacoes_senha set tentativas=tentativas+1 where usuario_id=v_id;
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  update private.recuperacoes_senha set codigo_hash=null,token_hash=extensions.digest(v_token,'sha256'),
    token_expira_em=now()+interval '10 minutes' where usuario_id=v_id;
  return jsonb_build_object('token',v_token);
end $function$;

CREATE OR REPLACE FUNCTION public.web_criar_cadastro(p_token text, p_tipo text, p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_nome text; v_placa text; v_modelo text; v_tipo text; v_result jsonb;
begin
  perform private.web_exigir_admin(p_token);
  if p_tipo is null or p_tipo not in ('veiculos','funcionarios','contratos')
    or jsonb_typeof(p_dados) is distinct from 'object' then
    raise exception 'Cadastro inválido.' using errcode='22023';
  end if;
  if p_tipo='veiculos' then
    v_placa := upper(btrim(regexp_replace(p_dados->>'placa','[[:space:]]+',' ','g')));
    v_modelo := btrim(regexp_replace(p_dados->>'modelo','[[:space:]]+',' ','g'));
    v_tipo := p_dados->>'tipo';
    if jsonb_typeof(p_dados->'placa') is distinct from 'string' or v_placa is null
      or length(v_placa) not between 1 and 30 or v_placa !~ '^[A-Z0-9][A-Z0-9 -]*$' then
      raise exception 'Informe uma placa ou identificação válida, com até 30 caracteres.' using errcode='22023';
    end if;
    if jsonb_typeof(p_dados->'modelo') is distinct from 'string' or v_modelo is null or length(v_modelo) not between 1 and 150 then
      raise exception 'Informe o modelo, com até 150 caracteres.' using errcode='22023';
    end if;
    if v_tipo is null or v_tipo not in ('veiculo','equipamento') then
      raise exception 'Tipo inválido: veículo ou equipamento.' using errcode='22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('hashi.web.veiculos.'||regexp_replace(v_placa,'[ -]','','g'),0));
    if exists(select 1 from public.veiculos where regexp_replace(upper(placa),'[ -]','','g')=regexp_replace(v_placa,'[ -]','','g')) then
      raise exception 'Já existe um veículo ou equipamento com essa identificação, inclusive entre os inativos.' using errcode='23505';
    end if;
    insert into public.veiculos(placa,modelo,tipo,ativo) values(v_placa,v_modelo,v_tipo,true)
      returning jsonb_build_object('id',id,'placa',placa,'modelo',modelo,'tipo',tipo,'ativo',ativo) into v_result;
  else
    v_nome := btrim(regexp_replace(p_dados->>'nome','[[:space:]]+',' ','g'));
    if jsonb_typeof(p_dados->'nome') is distinct from 'string' or v_nome is null or length(v_nome) not between 1 and 200 then
      raise exception 'Informe o nome, com até 200 caracteres.' using errcode='22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('hashi.web.'||p_tipo||'.'||lower(v_nome),0));
    if p_tipo='funcionarios' then
      if exists(select 1 from public.funcionarios where lower(btrim(regexp_replace(nome,'[[:space:]]+',' ','g')))=lower(v_nome)) then
        raise exception 'Já existe um funcionário com esse nome, inclusive entre os inativos.' using errcode='23505';
      end if;
      insert into public.funcionarios(nome,ativo,is_status) values(v_nome,true,false)
        returning jsonb_build_object('id',id,'nome',nome,'ativo',ativo,'is_status',is_status) into v_result;
    else
      if exists(select 1 from public.contratos where lower(btrim(regexp_replace(nome,'[[:space:]]+',' ','g')))=lower(v_nome)) then
        raise exception 'Já existe um contrato com esse nome, inclusive entre os inativos.' using errcode='23505';
      end if;
      insert into public.contratos(nome,ativo) values(v_nome,true)
        returning jsonb_build_object('id',id,'nome',nome,'ativo',ativo) into v_result;
    end if;
  end if;
  return v_result;
end $function$;

CREATE OR REPLACE FUNCTION public.web_criar_usuario(p_token text, p_usuario text, p_senha text, p_perfil text, p_nome text, p_sobrenome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  perform private.web_exigir_admin(p_token);
  v_id := public.cadastrar_usuario(p_usuario,p_senha,p_perfil,
    btrim(regexp_replace(p_nome,'[[:space:]]+',' ','g')),
    btrim(regexp_replace(p_sobrenome,'[[:space:]]+',' ','g')));
  return (select jsonb_build_object('id',id,'nome',nome,'sobrenome',sobrenome,'login',login,
    'perfil',perfil,'ativo',ativo,'created_at',created_at) from public.usuarios where id=v_id);
end $function$;

CREATE OR REPLACE FUNCTION public.web_definir_senha(p_token text, p_usuario_id uuid, p_senha text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_login text;
begin
  perform private.web_exigir_admin(p_token);
  select login into v_login from public.usuarios where id=p_usuario_id;
  if v_login is null then raise exception 'Usuário não encontrado.' using errcode='22023'; end if;
  -- A rotina existente grava bcrypt, revoga sessões e invalida códigos/tokens de recuperação.
  perform public.definir_senha_usuario(v_login,p_senha);
end $function$;

CREATE OR REPLACE FUNCTION public.web_listar_crlvs(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.validar_sessao(p_token);
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id,
    'placa', split_part(split_part(d.storage_path, '/', 3), '_', 2),
    'ano_documento', left(split_part(split_part(d.storage_path, '/', 3), '_', 3), 4)::integer
  ) order by d.veiculo_id, left(split_part(split_part(d.storage_path, '/', 3), '_', 3), 4) desc, d.id), '[]'::jsonb)
  from public.veiculo_documentos d join public.veiculos v on v.id=d.veiculo_id
  where v.ativo);
end $function$;

CREATE OR REPLACE FUNCTION public.web_listar_usuarios(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.web_exigir_admin(p_token);
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'nome',nome,'sobrenome',sobrenome,'login',login,'perfil',perfil,'ativo',ativo,'created_at',created_at
  ) order by nome,sobrenome,login),'[]'::jsonb) from public.usuarios);
end $function$;

CREATE OR REPLACE FUNCTION public.web_obter_crlv(p_token text, p_veiculo_id bigint, p_documento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.validar_sessao(p_token);
  return (select jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id,
    'placa', split_part(split_part(d.storage_path, '/', 3), '_', 2),
    'ano_documento', left(split_part(split_part(d.storage_path, '/', 3), '_', 3), 4)::integer,
    'arquivo', split_part(d.storage_path, '/', 3),
    'sha256', split_part(d.storage_path, '/', 2),
    'tamanho_bytes', coalesce((o.metadata->>'size')::bigint, (o.metadata->>'contentLength')::bigint),
    'storage_bucket', 'hashi-crlv', 'storage_path', d.storage_path
  ) from public.veiculo_documentos d
  join public.veiculos v on v.id=d.veiculo_id
  join storage.objects o on o.bucket_id='hashi-crlv' and o.name=d.storage_path
  where d.id=p_documento_id and d.veiculo_id=p_veiculo_id and v.ativo);
end $function$;
REVOKE ALL ON TABLE "private"."config_login" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "private"."config_login" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "private"."credenciais" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "private"."credenciais" ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER invalidar_codigo_ao_trocar_senha AFTER INSERT OR UPDATE OF senha_hash ON private.credenciais FOR EACH ROW EXECUTE FUNCTION private.invalidar_recuperacao();
REVOKE ALL ON TABLE "private"."recuperacoes_senha" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "private"."recuperacoes_senha" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "private"."sessoes" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "private"."sessoes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "private"."tentativas_login" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "private"."tentativas_login" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."contratos" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."contratos" TO "service_role";
GRANT SELECT ON TABLE "public"."contratos" TO "service_role";
GRANT UPDATE ON TABLE "public"."contratos" TO "service_role";
GRANT DELETE ON TABLE "public"."contratos" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."contratos" TO "service_role";
GRANT REFERENCES ON TABLE "public"."contratos" TO "service_role";
GRANT TRIGGER ON TABLE "public"."contratos" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."contratos" TO "service_role";
ALTER TABLE "public"."contratos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_admin" ON "public"."contratos" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT e_admin() AS e_admin)) WITH CHECK (( SELECT e_admin() AS e_admin));
CREATE POLICY "contratos_leitura" ON "public"."contratos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT usuario_ativo() AS usuario_ativo));
REVOKE ALL ON TABLE "public"."funcionarios" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."funcionarios" TO "service_role";
GRANT SELECT ON TABLE "public"."funcionarios" TO "service_role";
GRANT UPDATE ON TABLE "public"."funcionarios" TO "service_role";
GRANT DELETE ON TABLE "public"."funcionarios" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."funcionarios" TO "service_role";
GRANT REFERENCES ON TABLE "public"."funcionarios" TO "service_role";
GRANT TRIGGER ON TABLE "public"."funcionarios" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."funcionarios" TO "service_role";
ALTER TABLE "public"."funcionarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funcionarios_admin" ON "public"."funcionarios" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT e_admin() AS e_admin)) WITH CHECK (( SELECT e_admin() AS e_admin));
CREATE POLICY "funcionarios_leitura" ON "public"."funcionarios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT usuario_ativo() AS usuario_ativo));
REVOKE ALL ON TABLE "public"."manutencoes" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."manutencoes" TO "service_role";
GRANT SELECT ON TABLE "public"."manutencoes" TO "service_role";
GRANT UPDATE ON TABLE "public"."manutencoes" TO "service_role";
GRANT DELETE ON TABLE "public"."manutencoes" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."manutencoes" TO "service_role";
GRANT REFERENCES ON TABLE "public"."manutencoes" TO "service_role";
GRANT TRIGGER ON TABLE "public"."manutencoes" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."manutencoes" TO "service_role";
ALTER TABLE "public"."manutencoes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manutencoes_leitura" ON "public"."manutencoes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT usuario_ativo() AS usuario_ativo) AND ((usuario_id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin))));
REVOKE ALL ON TABLE "public"."registro_equipes" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."registro_equipes" TO "service_role";
GRANT SELECT ON TABLE "public"."registro_equipes" TO "service_role";
GRANT UPDATE ON TABLE "public"."registro_equipes" TO "service_role";
GRANT DELETE ON TABLE "public"."registro_equipes" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."registro_equipes" TO "service_role";
GRANT REFERENCES ON TABLE "public"."registro_equipes" TO "service_role";
GRANT TRIGGER ON TABLE "public"."registro_equipes" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."registro_equipes" TO "service_role";
ALTER TABLE "public"."registro_equipes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipes_leitura" ON "public"."registro_equipes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM registros_frota r
  WHERE (r.id = registro_equipes.registro_frota_id))));
REVOKE ALL ON TABLE "public"."registros_frota" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."registros_frota" TO "service_role";
GRANT SELECT ON TABLE "public"."registros_frota" TO "service_role";
GRANT UPDATE ON TABLE "public"."registros_frota" TO "service_role";
GRANT DELETE ON TABLE "public"."registros_frota" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."registros_frota" TO "service_role";
GRANT REFERENCES ON TABLE "public"."registros_frota" TO "service_role";
GRANT TRIGGER ON TABLE "public"."registros_frota" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."registros_frota" TO "service_role";
ALTER TABLE "public"."registros_frota" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registros_leitura" ON "public"."registros_frota" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT usuario_ativo() AS usuario_ativo) AND ((usuario_id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin))));
REVOKE ALL ON TABLE "public"."tipos_manutencao" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT SELECT ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT UPDATE ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT DELETE ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT REFERENCES ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT TRIGGER ON TABLE "public"."tipos_manutencao" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."tipos_manutencao" TO "service_role";
ALTER TABLE "public"."tipos_manutencao" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_admin" ON "public"."tipos_manutencao" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT e_admin() AS e_admin)) WITH CHECK (( SELECT e_admin() AS e_admin));
CREATE POLICY "tipos_leitura" ON "public"."tipos_manutencao" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT usuario_ativo() AS usuario_ativo));
REVOKE ALL ON TABLE "public"."usuarios" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."usuarios" TO "service_role";
GRANT SELECT ON TABLE "public"."usuarios" TO "service_role";
GRANT UPDATE ON TABLE "public"."usuarios" TO "service_role";
GRANT DELETE ON TABLE "public"."usuarios" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."usuarios" TO "service_role";
GRANT REFERENCES ON TABLE "public"."usuarios" TO "service_role";
GRANT TRIGGER ON TABLE "public"."usuarios" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."usuarios" TO "service_role";
ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil_proprio" ON "public"."usuarios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin)));
CREATE TRIGGER preservar_login BEFORE UPDATE OF login ON usuarios FOR EACH ROW EXECUTE FUNCTION proteger_login();
CREATE TRIGGER revogar_sessoes AFTER UPDATE OF ativo ON usuarios FOR EACH ROW EXECUTE FUNCTION private.revogar_ao_desativar();
REVOKE ALL ON TABLE "public"."veiculo_documentos" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "public"."veiculo_documentos" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."veiculo_documentos" IS 'Vínculo mínimo entre veículos e PDFs no bucket privado hashi-crlv. Um veículo pode ter vários documentos.';
COMMENT ON COLUMN "public"."veiculo_documentos"."veiculo_id" IS 'ID do veículo cadastrado. Nulo quando a placa do PDF não tem correspondência confirmada.';
COMMENT ON COLUMN "public"."veiculo_documentos"."storage_path" IS 'Caminho do PDF completo no Supabase Storage; o nome contém placa e ano.';
REVOKE ALL ON TABLE "public"."veiculos" FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE "public"."veiculos" TO "service_role";
GRANT SELECT ON TABLE "public"."veiculos" TO "service_role";
GRANT UPDATE ON TABLE "public"."veiculos" TO "service_role";
GRANT DELETE ON TABLE "public"."veiculos" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."veiculos" TO "service_role";
GRANT REFERENCES ON TABLE "public"."veiculos" TO "service_role";
GRANT TRIGGER ON TABLE "public"."veiculos" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."veiculos" TO "service_role";
ALTER TABLE "public"."veiculos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veiculos_admin" ON "public"."veiculos" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT e_admin() AS e_admin)) WITH CHECK (( SELECT e_admin() AS e_admin));
CREATE POLICY "veiculos_leitura" ON "public"."veiculos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT usuario_ativo() AS usuario_ativo));
REVOKE ALL ON FUNCTION "private"."apagar_envio"(p_id uuid, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."buscar_historico"(p_busca text, p_limite integer, p_offset integer, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."editar_manutencao"(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."editar_registro"(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."invalidar_recuperacao"() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."obter_envio"(p_id uuid, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."revogar_ao_desativar"() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."salvar_manutencao"(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."salvar_registro"(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."usuario_id"() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."validar_data_operacao"(p_data date) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."validar_sessao"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "private"."web_exigir_admin"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."apagar_envio"(p_token text, p_id uuid, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."apagar_envio"(p_token text, p_id uuid, p_tipo text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."apagar_envio"(p_token text, p_id uuid, p_tipo text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."autenticar_usuario"(p_usuario text, p_senha text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."autenticar_usuario"(p_usuario text, p_senha text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."autenticar_usuario"(p_usuario text, p_senha text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."buscar_historico"(p_token text, p_busca text, p_limite integer, p_offset integer, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."buscar_historico"(p_token text, p_busca text, p_limite integer, p_offset integer, p_tipo text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."buscar_historico"(p_token text, p_busca text, p_limite integer, p_offset integer, p_tipo text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."buscar_historico_com_autor"(p_token text, p_busca text, p_limite integer, p_offset integer, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."buscar_historico_com_autor"(p_token text, p_busca text, p_limite integer, p_offset integer, p_tipo text) TO "anon";
REVOKE ALL ON FUNCTION "public"."cadastrar_usuario"(p_usuario text, p_senha text, p_perfil text, p_nome text, p_sobrenome text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."definir_senha_usuario"(p_usuario text, p_senha text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."e_admin"() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."editar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."editar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."editar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer) TO "service_role";
REVOKE ALL ON FUNCTION "public"."editar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer, p_observacao text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."editar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer, p_observacao text) TO "anon";
REVOKE ALL ON FUNCTION "public"."editar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."editar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."editar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer) TO "service_role";
REVOKE ALL ON FUNCTION "public"."encerrar_sessao"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."encerrar_sessao"(p_token text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."encerrar_sessao"(p_token text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."filtrar_historico"(p_token text, p_tipo text, p_periodo text, p_campo_data text, p_data_de date, p_data_ate date, p_motorista_id bigint, p_veiculo_id bigint, p_contrato_id bigint, p_autor_id uuid, p_tipo_manutencao_id bigint, p_limite integer, p_offset integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."filtrar_historico"(p_token text, p_tipo text, p_periodo text, p_campo_data text, p_data_de date, p_data_ate date, p_motorista_id bigint, p_veiculo_id bigint, p_contrato_id bigint, p_autor_id uuid, p_tipo_manutencao_id bigint, p_limite integer, p_offset integer) TO "anon";
REVOKE ALL ON FUNCTION "public"."filtrar_historico_multiplos"(p_token text, p_tipo text, p_data_de date, p_data_ate date, p_motorista_ids bigint[], p_veiculo_ids bigint[], p_contrato_ids bigint[], p_autor_ids uuid[], p_tipo_manutencao_ids bigint[], p_limite integer, p_offset integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."filtrar_historico_multiplos"(p_token text, p_tipo text, p_data_de date, p_data_ate date, p_motorista_ids bigint[], p_veiculo_ids bigint[], p_contrato_ids bigint[], p_autor_ids uuid[], p_tipo_manutencao_ids bigint[], p_limite integer, p_offset integer) TO "anon";
REVOKE ALL ON FUNCTION "public"."gerar_codigo_recuperacao"(p_usuario text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."listar_catalogos"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."listar_catalogos"(p_token text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."listar_catalogos"(p_token text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."meu_perfil"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."meu_perfil"(p_token text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."meu_perfil"(p_token text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."normalizar"(p_texto text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."obter_envio"(p_token text, p_id uuid, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obter_envio"(p_token text, p_id uuid, p_tipo text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."obter_envio"(p_token text, p_id uuid, p_tipo text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."opcoes_filtros_historico"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."opcoes_filtros_historico"(p_token text) TO "anon";
REVOKE ALL ON FUNCTION "public"."opcoes_filtros_historico_completas"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."opcoes_filtros_historico_completas"(p_token text) TO "anon";
REVOKE ALL ON FUNCTION "public"."proteger_login"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."proteger_login"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."recuperar_senha"(p_token text, p_senha text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."recuperar_senha"(p_token text, p_senha text) TO "anon";
REVOKE ALL ON FUNCTION "public"."salvar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."salvar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."salvar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric) TO "service_role";
REVOKE ALL ON FUNCTION "public"."salvar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_observacao text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."salvar_manutencao"(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_observacao text) TO "anon";
REVOKE ALL ON FUNCTION "public"."salvar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."salvar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."salvar_registro"(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb) TO "service_role";
REVOKE ALL ON FUNCTION "public"."ultimo_veiculo_motorista"(p_token text, p_motorista_id bigint, p_excluir_registro uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."ultimo_veiculo_motorista"(p_token text, p_motorista_id bigint, p_excluir_registro uuid) TO "anon";
REVOKE ALL ON FUNCTION "public"."usuario_ativo"() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION "public"."validar_codigo_recuperacao"(p_usuario text, p_codigo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."validar_codigo_recuperacao"(p_usuario text, p_codigo text) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_criar_cadastro"(p_token text, p_tipo text, p_dados jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_criar_cadastro"(p_token text, p_tipo text, p_dados jsonb) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_criar_usuario"(p_token text, p_usuario text, p_senha text, p_perfil text, p_nome text, p_sobrenome text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_criar_usuario"(p_token text, p_usuario text, p_senha text, p_perfil text, p_nome text, p_sobrenome text) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_definir_senha"(p_token text, p_usuario_id uuid, p_senha text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_definir_senha"(p_token text, p_usuario_id uuid, p_senha text) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_listar_crlvs"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_listar_crlvs"(p_token text) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_listar_usuarios"(p_token text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_listar_usuarios"(p_token text) TO "anon";
REVOKE ALL ON FUNCTION "public"."web_obter_crlv"(p_token text, p_veiculo_id bigint, p_documento_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."web_obter_crlv"(p_token text, p_veiculo_id bigint, p_documento_id uuid) TO "anon";

NOTIFY pgrst, 'reload schema';
COMMIT;
