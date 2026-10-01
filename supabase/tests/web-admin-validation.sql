-- Validação transacional: nenhum cadastro, sessão ou senha de teste é mantido.
begin;
do $$
declare
  v_prefix text := 'web_check_'||substr(replace(gen_random_uuid()::text,'-',''),1,12);
  v_password text := encode(extensions.gen_random_bytes(24),'hex');
  v_new_password text := encode(extensions.gen_random_bytes(24),'hex');
  v_admin uuid; v_employee uuid; v_created uuid; v_admin_token text; v_employee_token text; v_created_token text;
  v_record jsonb; v_list jsonb; v_catalogs jsonb; v_code text; v_recovery text; v_result jsonb;
begin
  v_admin := public.cadastrar_usuario(v_prefix||'_a',v_password,'admin','Admin','Teste');
  v_employee := public.cadastrar_usuario(v_prefix||'_e',v_password,'funcionario','Pessoa','Teste');
  v_admin_token := public.autenticar_usuario(v_prefix||'_a',v_password)->>'token';
  v_employee_token := public.autenticar_usuario(v_prefix||'_e',v_password)->>'token';
  begin perform public.web_listar_usuarios(repeat('0',64)); raise exception 'Aceitou sessão inválida'; exception when sqlstate '28000' then null; end;
  begin perform public.web_criar_cadastro(null,'contratos','{"nome":"Negado"}'); raise exception 'Aceitou sessão ausente'; exception when sqlstate '28000' then null; end;
  begin perform public.web_criar_usuario(null,'negado',v_password,'admin','Teste','Negado'); raise exception 'Criou usuário sem sessão'; exception when sqlstate '28000' then null; end;
  begin perform public.web_definir_senha(null,v_admin,v_new_password); raise exception 'Alterou senha sem sessão'; exception when sqlstate '28000' then null; end;
  begin perform public.web_listar_usuarios(v_employee_token); raise exception 'Funcionário listou usuários'; exception when insufficient_privilege then null; end;
  begin perform public.web_criar_cadastro(v_employee_token,'contratos','{"nome":"Negado"}'); raise exception 'Funcionário criou cadastro'; exception when insufficient_privilege then null; end;
  begin perform public.web_criar_usuario(v_employee_token,'negado',v_password,'admin','Teste','Negado'); raise exception 'Funcionário criou admin'; exception when insufficient_privilege then null; end;
  begin perform public.web_definir_senha(v_employee_token,v_admin,v_new_password); raise exception 'Funcionário mudou senha'; exception when insufficient_privilege then null; end;

  v_record := public.web_criar_cadastro(v_admin_token,'funcionarios',jsonb_build_object('nome','  '||v_prefix||'  Motorista  ','ativo',false,'is_status',true));
  if v_record->>'nome' <> v_prefix||' Motorista' or not (v_record->>'ativo')::boolean or (v_record->>'is_status')::boolean then raise exception 'Funcionário não normalizado'; end if;
  begin perform public.web_criar_cadastro(v_admin_token,'funcionarios',jsonb_build_object('nome',upper(v_prefix)||' Motorista')); raise exception 'Duplicou funcionário'; exception when unique_violation then null; end;
  v_record := public.web_criar_cadastro(v_admin_token,'veiculos',jsonb_build_object('placa','  '||replace(v_prefix,'_','')||'  ','modelo','  Modelo   Teste ','tipo','equipamento'));
  if v_record->>'placa' <> upper(replace(v_prefix,'_','')) or v_record->>'modelo' <> 'Modelo Teste' or v_record->>'tipo' <> 'equipamento' then raise exception 'Veículo não normalizado'; end if;
  begin perform public.web_criar_cadastro(v_admin_token,'veiculos',jsonb_build_object('placa',replace(v_prefix,'_','-'),'modelo','Teste','tipo','veiculo')); raise exception 'Duplicou identificação com hífens'; exception when unique_violation then null; end;
  v_record := public.web_criar_cadastro(v_admin_token,'contratos',jsonb_build_object('nome','  '||v_prefix||'  Contrato  '));
  begin perform public.web_criar_cadastro(v_admin_token,'contratos',jsonb_build_object('nome',upper(v_prefix)||' CONTRATO')); raise exception 'Duplicou contrato'; exception when unique_violation then null; end;
  begin perform public.web_criar_cadastro(v_admin_token,'contratos','{"nome":"   "}'); raise exception 'Aceitou nome vazio'; exception when sqlstate '22023' then null; end;
  begin perform public.web_criar_cadastro(v_admin_token,'veiculos','{"placa":"***","modelo":"Teste","tipo":"veiculo"}'); raise exception 'Aceitou placa inválida'; exception when sqlstate '22023' then null; end;
  begin perform public.web_criar_cadastro(v_admin_token,'usuarios','{}'); raise exception 'Aceitou catálogo fora da lista'; exception when sqlstate '22023' then null; end;
  v_catalogs := public.listar_catalogos(v_employee_token);
  if not exists(select 1 from jsonb_array_elements(v_catalogs->'contracts') c where c->>'nome'=v_prefix||' Contrato')
    or not exists(select 1 from jsonb_array_elements(v_catalogs->'employees') c where c->>'nome'=v_prefix||' Motorista')
    or not exists(select 1 from jsonb_array_elements(v_catalogs->'vehicles') c where c->>'placa'=upper(replace(v_prefix,'_',''))) then
    raise exception 'Cadastros não aparecem na RPC do aplicativo';
  end if;

  v_record := public.web_criar_usuario(v_admin_token,upper(v_prefix)||'_n',v_password,'funcionario','Nova','Pessoa');
  v_created := (v_record->>'id')::uuid;
  if v_record->>'login' <> v_prefix||'_n' or v_record->>'perfil' <> 'funcionario' or not (v_record->>'ativo')::boolean then raise exception 'Perfil novo inválido'; end if;
  begin
    perform public.web_criar_usuario(v_admin_token,v_prefix||'_n',v_new_password,'admin','Duplicado','Teste');
    raise exception 'Duplicou usuário';
  exception when raise_exception then
    if sqlerrm not like 'Esse usuário já existe.%' then raise; end if;
  end;
  v_created_token := public.autenticar_usuario(v_prefix||'_n',v_password)->>'token';
  if v_created_token is null then raise exception 'Conta criada não autentica pelo fluxo do app'; end if;
  v_list := public.web_listar_usuarios(v_admin_token);
  if not exists(select 1 from jsonb_array_elements(v_list) u where u->>'id'=v_created::text)
    or exists(select 1 from jsonb_array_elements(v_list) u where u ?| array['senha','password','senha_hash','token']) then
    raise exception 'Listagem incorreta ou expôs credenciais';
  end if;
  begin
    perform public.web_definir_senha(v_admin_token,v_created,repeat('😀',11));
    raise exception 'Aceitou senha com menos de 12 caracteres';
  exception when raise_exception then
    if sqlerrm not like 'Use uma senha%' then raise; end if;
  end;
  begin
    perform public.web_definir_senha(v_admin_token,v_created,repeat('😀',19));
    raise exception 'Aceitou senha acima de 72 bytes';
  exception when raise_exception then
    if sqlerrm not like 'Use uma senha%' then raise; end if;
  end;
  v_code := public.gerar_codigo_recuperacao(v_prefix||'_n');
  v_recovery := public.validar_codigo_recuperacao(v_prefix||'_n',v_code)->>'token';
  perform public.web_definir_senha(v_admin_token,v_created,v_new_password);
  begin perform public.meu_perfil(v_created_token); raise exception 'Sessão antiga não foi revogada'; exception when sqlstate '28000' then null; end;
  if public.autenticar_usuario(v_prefix||'_n',v_password)->>'token' is not null then raise exception 'Senha antiga continua válida'; end if;
  if public.autenticar_usuario(v_prefix||'_n',v_new_password)->>'token' is null then raise exception 'Senha nova não autentica'; end if;
  if public.recuperar_senha(v_recovery,v_password)->>'error' is null then raise exception 'Token antigo de recuperação continua válido'; end if;
  if public.recuperar_senha(v_admin_token,v_password)->>'error' is null then raise exception 'Recuperação do app aceitou sessão comum'; end if;
  if public.validar_codigo_recuperacao(v_prefix||'_n','SEM-CODIGO')->>'token' is not null then raise exception 'App deixou de exigir código'; end if;
  v_code := public.gerar_codigo_recuperacao(v_prefix||'_n');
  v_recovery := public.validar_codigo_recuperacao(v_prefix||'_n',v_code)->>'token';
  if v_recovery is null then raise exception 'Código válido deixou de funcionar'; end if;
  v_result := public.recuperar_senha(v_recovery,v_password);
  if coalesce((v_result->>'success')::boolean,false) is not true then raise exception 'Recuperação por código falhou'; end if;

  perform public.web_definir_senha(v_admin_token,v_admin,v_new_password);
  begin perform public.web_listar_usuarios(v_admin_token); raise exception 'Admin continuou autenticado após trocar própria senha'; exception when sqlstate '28000' then null; end;
  v_admin_token := public.autenticar_usuario(v_prefix||'_a',v_new_password)->>'token';
  update public.usuarios set ativo=false where id=v_admin;
  begin perform public.web_listar_usuarios(v_admin_token); raise exception 'Admin inativo teve acesso'; exception when sqlstate '28000' then null; end;

  if has_table_privilege('anon','public.usuarios','select')
    or has_table_privilege('anon','public.veiculos','insert')
    or has_function_privilege('anon','public.cadastrar_usuario(text,text,text,text,text)','execute')
    or has_function_privilege('anon','public.definir_senha_usuario(text,text)','execute')
    or has_function_privilege('anon','private.web_exigir_admin(text)','execute')
    or not has_function_privilege('anon','public.web_listar_usuarios(text)','execute') then
    raise exception 'Permissões administrativas incorretas';
  end if;
end $$;
select 'Administração, permissões, cadastros compartilhados, senhas e recuperação por código aprovados' as result;
rollback;
