-- Mantém somente o vínculo veículo -> PDF; nenhum arquivo do Storage é alterado.
begin;
lock table public.veiculo_documentos in access exclusive mode;

create temporary table hashi_crlv_before on commit drop as
select id, veiculo_id, storage_path, sha256, tamanho_bytes from public.veiculo_documentos;

do $$
begin
  if exists (
    select 1 from public.veiculo_documentos d
    left join storage.objects o on o.bucket_id='hashi-crlv' and o.name=d.storage_path
    where o.id is null or d.storage_bucket <> 'hashi-crlv'
      or d.storage_path <> 'crlv/' || d.sha256 || '/' || d.arquivo
      or coalesce((o.metadata->>'size')::bigint, (o.metadata->>'contentLength')::bigint, -1) <> d.tamanho_bytes
  ) then raise exception 'Os arquivos no Storage precisam corresponder ao inventário antes de simplificar.'; end if;
end $$;

-- DROP EXPRESSION preserva os caminhos já gravados e remove a dependência de sha256/arquivo.
alter table public.veiculo_documentos alter column storage_path drop expression;
drop index public.veiculo_documentos_veiculo_idx;
alter table public.veiculo_documentos
  drop column placa,
  drop column placa_anterior,
  drop column modelo_documento,
  drop column data_documento,
  drop column ano_documento,
  drop column exercicio,
  drop column chassi,
  drop column arquivo,
  drop column arquivo_original,
  drop column sha256,
  drop column tamanho_bytes,
  drop column criterio_vinculo,
  drop column created_at,
  drop column storage_bucket,
  alter column storage_path set not null,
  add constraint veiculo_documentos_storage_path_key unique (storage_path),
  add constraint veiculo_documentos_storage_path_check check (
    storage_path ~ '^crlv/[a-f0-9]{64}/CRLVDigital_[A-Z]{3}[0-9][A-Z0-9][0-9]{2}_20[0-9]{2}\.pdf$'
  );
create index veiculo_documentos_veiculo_idx on public.veiculo_documentos(veiculo_id);
comment on table public.veiculo_documentos is 'Vínculo mínimo entre veículos e PDFs no bucket privado hashi-crlv. Um veículo pode ter vários documentos.';
comment on column public.veiculo_documentos.veiculo_id is 'ID do veículo cadastrado. Nulo quando a placa do PDF não tem correspondência confirmada.';
comment on column public.veiculo_documentos.storage_path is 'Caminho do PDF completo no Supabase Storage; o nome contém placa e ano.';

create or replace function public.web_listar_crlvs(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.validar_sessao(p_token);
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id,
    'placa', split_part(split_part(d.storage_path, '/', 3), '_', 2),
    'ano_documento', left(split_part(split_part(d.storage_path, '/', 3), '_', 3), 4)::integer
  ) order by d.veiculo_id, left(split_part(split_part(d.storage_path, '/', 3), '_', 3), 4) desc, d.id), '[]'::jsonb)
  from public.veiculo_documentos d join public.veiculos v on v.id=d.veiculo_id
  where v.ativo);
end $$;

create or replace function public.web_obter_crlv(p_token text, p_veiculo_id bigint, p_documento_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
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
end $$;

revoke all on function public.web_listar_crlvs(text), public.web_obter_crlv(text,bigint,uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.web_listar_crlvs(text), public.web_obter_crlv(text,bigint,uuid) to anon;

do $$
begin
  if exists (
    (select id, veiculo_id, storage_path from public.veiculo_documentos except select id, veiculo_id, storage_path from pg_temp.hashi_crlv_before)
    union all
    (select id, veiculo_id, storage_path from pg_temp.hashi_crlv_before except select id, veiculo_id, storage_path from public.veiculo_documentos)
  ) then raise exception 'A simplificação não pode alterar documentos, veículos associados ou caminhos.'; end if;
end $$;
notify pgrst, 'reload schema';
commit;
