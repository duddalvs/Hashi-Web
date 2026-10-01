-- Administração do Hashi Web. Preserva autenticação e recuperação por código do aplicativo.
begin;

create function private.web_exigir_admin(p_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid := private.validar_sessao(p_token);
begin
  if not exists(select 1 from public.usuarios where id=v_id and ativo and perfil='admin') then
    raise exception 'Somente administradores podem gerenciar cadastros e usuários.' using errcode='42501';
  end if;
  return v_id;
end $$;
revoke all on function private.web_exigir_admin(text) from public,anon,authenticated,service_role;

create function public.web_criar_cadastro(p_token text,p_tipo text,p_dados jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
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
end $$;

create function public.web_listar_usuarios(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform private.web_exigir_admin(p_token);
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'nome',nome,'sobrenome',sobrenome,'login',login,'perfil',perfil,'ativo',ativo,'created_at',created_at
  ) order by nome,sobrenome,login),'[]'::jsonb) from public.usuarios);
end $$;

create function public.web_criar_usuario(p_token text,p_usuario text,p_senha text,p_perfil text,p_nome text,p_sobrenome text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  perform private.web_exigir_admin(p_token);
  v_id := public.cadastrar_usuario(p_usuario,p_senha,p_perfil,
    btrim(regexp_replace(p_nome,'[[:space:]]+',' ','g')),
    btrim(regexp_replace(p_sobrenome,'[[:space:]]+',' ','g')));
  return (select jsonb_build_object('id',id,'nome',nome,'sobrenome',sobrenome,'login',login,
    'perfil',perfil,'ativo',ativo,'created_at',created_at) from public.usuarios where id=v_id);
end $$;

create function public.web_definir_senha(p_token text,p_usuario_id uuid,p_senha text) returns void
language plpgsql security definer set search_path='' as $$
declare v_login text;
begin
  perform private.web_exigir_admin(p_token);
  select login into v_login from public.usuarios where id=p_usuario_id;
  if v_login is null then raise exception 'Usuário não encontrado.' using errcode='22023'; end if;
  -- A rotina existente grava bcrypt, revoga sessões e invalida códigos/tokens de recuperação.
  perform public.definir_senha_usuario(v_login,p_senha);
end $$;

revoke all on function public.web_criar_cadastro(text,text,jsonb),public.web_listar_usuarios(text),
  public.web_criar_usuario(text,text,text,text,text,text),public.web_definir_senha(text,uuid,text)
  from public,anon,authenticated,service_role;
grant execute on function public.web_criar_cadastro(text,text,jsonb),public.web_listar_usuarios(text),
  public.web_criar_usuario(text,text,text,text,text,text),public.web_definir_senha(text,uuid,text) to anon;

notify pgrst, 'reload schema';
commit;
