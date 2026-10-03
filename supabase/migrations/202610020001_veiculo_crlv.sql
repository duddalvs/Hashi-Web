-- Metadados dos PDFs privados do Hashi Web; mantém os cadastros e a autenticação do app.
begin;

create table public.veiculo_documentos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id bigint references public.veiculos(id) on delete restrict,
  placa text not null check (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  placa_anterior text,
  modelo_documento text not null check (length(modelo_documento) between 1 and 150),
  data_documento date not null,
  ano_documento smallint not null check (ano_documento between 2000 and 2100),
  exercicio smallint not null check (exercicio between 2000 and 2100),
  chassi text,
  arquivo text not null unique check (arquivo ~ '^CRLVDigital_[A-Z]{3}[0-9][A-Z0-9][0-9]{2}_[0-9]{4}\.pdf$'),
  arquivo_original text not null,
  sha256 text not null unique check (sha256 ~ '^[a-f0-9]{64}$'),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 20971520),
  criterio_vinculo text not null check (criterio_vinculo in ('placa', 'chassi_e_placa_anterior', 'sem_correspondencia')),
  created_at timestamptz not null default now(),
  check (extract(year from data_documento) = ano_documento),
  check (arquivo = 'CRLVDigital_' || placa || '_' || ano_documento || '.pdf'),
  check ((veiculo_id is null) = (criterio_vinculo = 'sem_correspondencia'))
);
create index veiculo_documentos_veiculo_idx on public.veiculo_documentos(veiculo_id, exercicio desc, data_documento desc);
alter table public.veiculo_documentos enable row level security;
revoke all on public.veiculo_documentos from public, anon, authenticated, service_role;

create function public.web_listar_crlvs(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.validar_sessao(p_token);
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id, 'placa', d.placa,
    'modelo_documento', d.modelo_documento, 'ano_documento', d.ano_documento,
    'exercicio', d.exercicio, 'data_documento', d.data_documento
  ) order by d.veiculo_id, d.exercicio desc, d.data_documento desc, d.id), '[]'::jsonb)
  from public.veiculo_documentos d join public.veiculos v on v.id = d.veiculo_id
  where v.ativo);
end $$;

create function public.web_obter_crlv(p_token text, p_veiculo_id bigint, p_documento_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.validar_sessao(p_token);
  return (select jsonb_build_object(
    'id', d.id, 'veiculo_id', d.veiculo_id, 'placa', d.placa,
    'modelo_documento', d.modelo_documento, 'ano_documento', d.ano_documento,
    'exercicio', d.exercicio, 'data_documento', d.data_documento,
    'arquivo', d.arquivo, 'sha256', d.sha256, 'tamanho_bytes', d.tamanho_bytes
  ) from public.veiculo_documentos d join public.veiculos v on v.id = d.veiculo_id
  where d.id = p_documento_id and d.veiculo_id = p_veiculo_id and v.ativo);
end $$;

revoke all on function public.web_listar_crlvs(text), public.web_obter_crlv(text,bigint,uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.web_listar_crlvs(text), public.web_obter_crlv(text,bigint,uuid) to anon;

notify pgrst, 'reload schema';
commit;
