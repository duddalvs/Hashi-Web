-- Executar dentro de uma transação revertida, depois da migration e da carga de documentos.
do $$
declare
  v_prefix text := 'crlv_check_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_password text := encode(extensions.gen_random_bytes(24), 'hex');
  v_user uuid; v_token text; v_profile text; v_doc public.veiculo_documentos; v_result jsonb;
begin
  if (select count(*) from public.veiculo_documentos) <> 149
    or (select count(*) from public.veiculo_documentos where veiculo_id is not null) <> 75
    or (select count(distinct veiculo_id) from public.veiculo_documentos) <> 73 then
    raise exception 'Quantidade de documentos/vínculos inesperada';
  end if;
  if (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
    where table_schema='public' and table_name='veiculo_documentos')
    is distinct from array['id', 'veiculo_id', 'storage_path'] then
    raise exception 'A tabela deve conter somente o vínculo mínimo de três campos';
  end if;
  -- As duas placas antigas tiveram o chassi conferido na importação; os IDs dos vínculos são preservados pela migration.
  if exists (select 1 from public.veiculo_documentos d join public.veiculos v on v.id=d.veiculo_id
      where split_part(split_part(d.storage_path,'/',3),'_',2) <> regexp_replace(upper(v.placa),'[ -]','','g')
      and not (
        (split_part(split_part(d.storage_path,'/',3),'_',2)='GIG9172' and v.placa='GIG9B72')
        or (split_part(split_part(d.storage_path,'/',3),'_',2)='KNH7151' and v.placa='KNH7B51')
      )) then
    raise exception 'Vínculo por placa incorreto';
  end if;
  begin perform public.web_listar_crlvs(null); raise exception 'Sessão ausente aceita'; exception when sqlstate '28000' then null; end;
  begin perform public.web_obter_crlv(repeat('0',64), 1, gen_random_uuid()); raise exception 'Sessão inválida aceita'; exception when sqlstate '28000' then null; end;
  select * into strict v_doc from public.veiculo_documentos where veiculo_id is not null order by veiculo_id limit 1;
  foreach v_profile in array array['admin', 'funcionario'] loop
    v_user := public.cadastrar_usuario(v_prefix || '_' || left(v_profile,1), v_password, v_profile, 'Teste', 'CRLV');
    v_token := public.autenticar_usuario(v_prefix || '_' || left(v_profile,1), v_password)->>'token';
    v_result := public.web_listar_crlvs(v_token);
    if jsonb_array_length(v_result) <> 75 or exists(select 1 from jsonb_array_elements(v_result) r
      where (select count(*) from jsonb_object_keys(r)) <> 4
        or not (r ?& array['id','veiculo_id','placa','ano_documento'])) then
      raise exception 'Listagem incompleta ou contém dados de armazenamento';
    end if;
    v_result := public.web_obter_crlv(v_token, v_doc.veiculo_id, v_doc.id);
    if v_result->>'sha256' is distinct from split_part(v_doc.storage_path,'/',2)
      or v_result->>'storage_bucket' is distinct from 'hashi-crlv'
      or v_result->>'storage_path' is distinct from v_doc.storage_path
      or v_result->>'arquivo' is distinct from split_part(v_doc.storage_path,'/',3)
      or not ((v_result->>'tamanho_bytes')::bigint between 1 and 20971520)
      then raise exception 'Arquivo retornado incorreto'; end if;
    if public.web_obter_crlv(v_token, -1, v_doc.id) is not null then raise exception 'Aceitou outro veículo'; end if;
    if public.web_obter_crlv(v_token, v_doc.veiculo_id, gen_random_uuid()) is not null then raise exception 'Aceitou documento inexistente'; end if;
    update public.veiculos set ativo=false where id=v_doc.veiculo_id;
    if public.web_obter_crlv(v_token, v_doc.veiculo_id, v_doc.id) is not null then raise exception 'Veículo inativo acessível'; end if;
    update public.veiculos set ativo=true where id=v_doc.veiculo_id;
    update public.usuarios set ativo=false where id=v_user;
    begin perform public.web_listar_crlvs(v_token); raise exception 'Usuário inativo aceito'; exception when sqlstate '28000' then null; end;
  end loop;
  if has_table_privilege('anon', 'public.veiculo_documentos', 'select')
    or has_table_privilege('authenticated', 'public.veiculo_documentos', 'select')
    or not (select relrowsecurity from pg_class where oid='public.veiculo_documentos'::regclass)
    or not has_function_privilege('anon', 'public.web_listar_crlvs(text)', 'execute') then
    raise exception 'Permissões incorretas';
  end if;
  if not exists(select 1 from storage.buckets where id='hashi-crlv' and public=false)
    or exists(select 1 from public.veiculo_documentos d where not exists (
      select 1 from storage.objects o where o.bucket_id='hashi-crlv' and o.name=d.storage_path
    ))
    or not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='hashi_crlv_apenas_servidor' and permissive='RESTRICTIVE') then
    raise exception 'Armazenamento privado ou vínculo dos arquivos incorreto';
  end if;
end $$;
select 'Documentos, vínculos, perfis e bloqueios de acesso validados' as resultado;
