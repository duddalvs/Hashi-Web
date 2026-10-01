select jsonb_build_object(
  'counts',jsonb_build_object(
    'users',(select count(*) from public.usuarios),
    'employees',(select count(*) from public.funcionarios),
    'vehicles',(select count(*) from public.veiculos),
    'contracts',(select count(*) from public.contratos),
    'registrations',(select count(*) from public.registros_frota),
    'maintenance',(select count(*) from public.manutencoes)),
  'legacy_functions',(select jsonb_object_agg(p.proname,md5(pg_get_functiondef(p.oid)))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('autenticar_usuario','cadastrar_usuario','definir_senha_usuario','validar_codigo_recuperacao','recuperar_senha','listar_catalogos')),
  'web_functions',(select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'security_definer',p.prosecdef,
    'anon_execute',has_function_privilege('anon',p.oid,'execute'),'settings',p.proconfig)),'[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('web_criar_cadastro','web_listar_usuarios','web_criar_usuario','web_definir_senha')),
  'migration_count',(select count(*) from supabase_migrations.schema_migrations where version='202609300004'),
  'anon_user_table_select',has_table_privilege('anon','public.usuarios','select'),
  'anon_vehicle_table_insert',has_table_privilege('anon','public.veiculos','insert'),
  'temporary_users',(select count(*) from public.usuarios where login like 'web_check_%')
) as state;
