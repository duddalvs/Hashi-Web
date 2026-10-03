-- Os objetos devem ser enviados e conferidos pela Storage API antes de aplicar esta migration.
begin;
alter table public.veiculo_documentos
  add column storage_bucket text not null default 'hashi-crlv' check (storage_bucket = 'hashi-crlv'),
  add column storage_path text generated always as ('crlv/' || sha256 || '/' || arquivo) stored;

-- Mantém o bucket privado mesmo se outras políticas de Storage forem adicionadas no projeto.
create policy hashi_crlv_apenas_servidor on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'hashi-crlv') with check (bucket_id <> 'hashi-crlv');

do $$
begin
  if not exists(select 1 from storage.buckets where id='hashi-crlv' and public=false) then
    raise exception 'O bucket privado de CRLVs precisa ser criado pela Storage API.';
  end if;
  if exists(select 1 from public.veiculo_documentos d where not exists (
    select 1 from storage.objects o where o.bucket_id=d.storage_bucket and o.name=d.storage_path
  )) then raise exception 'Há CRLVs ainda não enviados ao Storage.'; end if;
end $$;

create or replace function public.web_obter_crlv(p_token text, p_veiculo_id bigint, p_documento_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.validar_sessao(p_token);
  return (select jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id, 'placa', d.placa,
    'modelo_documento', d.modelo_documento, 'ano_documento', d.ano_documento,
    'exercicio', d.exercicio, 'data_documento', d.data_documento,
    'arquivo', d.arquivo, 'sha256', d.sha256, 'tamanho_bytes', d.tamanho_bytes,
    'storage_bucket', d.storage_bucket, 'storage_path', d.storage_path
  ) from public.veiculo_documentos d join public.veiculos v on v.id = d.veiculo_id
  where d.id = p_documento_id and d.veiculo_id = p_veiculo_id and v.ativo);
end $$;
revoke all on function public.web_obter_crlv(text,bigint,uuid) from public, anon, authenticated, service_role;
grant execute on function public.web_obter_crlv(text,bigint,uuid) to anon;
notify pgrst, 'reload schema';
commit;
