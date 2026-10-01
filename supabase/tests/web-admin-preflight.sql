select current_database() as database,
  to_regprocedure('private.validar_sessao(text)') as session_function,
  to_regprocedure('public.cadastrar_usuario(text,text,text,text,text)') as create_user_function,
  to_regprocedure('public.definir_senha_usuario(text,text)') as password_function,
  to_regprocedure('public.web_criar_cadastro(text,text,jsonb)') as web_catalog_function,
  to_regprocedure('public.web_listar_usuarios(text)') as web_users_function,
  (select count(*) from public.usuarios) as users,
  (select count(*) from public.funcionarios) as employees,
  (select count(*) from public.veiculos) as vehicles,
  (select count(*) from public.contratos) as contracts,
  (select count(*) from public.registros_frota) as registrations,
  (select count(*) from public.manutencoes) as maintenance;

select table_schema, table_name, column_name, data_type
from information_schema.columns
where (table_schema='public' and table_name in ('usuarios','funcionarios','veiculos','contratos'))
   or (table_schema='private' and table_name in ('credenciais','sessoes','recuperacoes_senha'))
order by table_schema,table_name,ordinal_position;

select p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='private' and p.proname in ('validar_sessao','invalidar_recuperacao'))
   or (n.nspname='public' and p.proname in ('cadastrar_usuario','definir_senha_usuario','validar_codigo_recuperacao','recuperar_senha'));

select version from supabase_migrations.schema_migrations where version='202609300004';
