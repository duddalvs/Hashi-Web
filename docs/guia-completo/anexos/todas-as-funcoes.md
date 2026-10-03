# Catálogo completo de funções da aplicação

47 assinaturas consultadas em 03/10/2026: 34 públicas e 13 privadas. Sobrecargas contam separadamente. O corpo integral de cada função está em [schema-aplicacao.sql](schema-aplicacao.sql). Execute somente em um destino novo após ler o guia de clonagem.

## private.apagar_envio

```sql
private.apagar_envio(p_id uuid, p_tipo text)
RETURNS void
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.buscar_historico

```sql
private.buscar_historico(p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone)
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.editar_manutencao

```sql
private.editar_manutencao(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.editar_registro

```sql
private.editar_registro(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.invalidar_recuperacao

```sql
private.invalidar_recuperacao()
RETURNS trigger
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.obter_envio

```sql
private.obter_envio(p_id uuid, p_tipo text)
RETURNS jsonb
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.revogar_ao_desativar

```sql
private.revogar_ao_desativar()
RETURNS trigger
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.salvar_manutencao

```sql
private.salvar_manutencao(p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.salvar_registro

```sql
private.salvar_registro(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.usuario_id

```sql
private.usuario_id()
RETURNS uuid
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.validar_data_operacao

```sql
private.validar_data_operacao(p_data date)
RETURNS void
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.validar_sessao

```sql
private.validar_sessao(p_token text)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## private.web_exigir_admin

```sql
private.web_exigir_admin(p_token text)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.apagar_envio

```sql
public.apagar_envio(p_token text, p_id uuid, p_tipo text)
RETURNS void
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.autenticar_usuario

```sql
public.autenticar_usuario(p_usuario text, p_senha text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.buscar_historico

```sql
public.buscar_historico(p_token text, p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone)
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.buscar_historico_com_autor

```sql
public.buscar_historico_com_autor(p_token text, p_busca text DEFAULT ''::text, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0, p_tipo text DEFAULT 'todos'::text)
RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.cadastrar_usuario

```sql
public.cadastrar_usuario(p_usuario text, p_senha text, p_perfil text DEFAULT 'funcionario'::text, p_nome text DEFAULT NULL::text, p_sobrenome text DEFAULT NULL::text)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.definir_senha_usuario

```sql
public.definir_senha_usuario(p_usuario text, p_senha text)
RETURNS void
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.e_admin

```sql
public.e_admin()
RETURNS boolean
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.editar_manutencao

```sql
public.editar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.editar_manutencao

```sql
public.editar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_versao integer, p_observacao text)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.editar_registro

```sql
public.editar_registro(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb, p_versao integer)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.encerrar_sessao

```sql
public.encerrar_sessao(p_token text)
RETURNS void
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.filtrar_historico

```sql
public.filtrar_historico(p_token text, p_tipo text DEFAULT 'registro'::text, p_periodo text DEFAULT 'week'::text, p_campo_data text DEFAULT 'created_at'::text, p_data_de date DEFAULT NULL::date, p_data_ate date DEFAULT NULL::date, p_motorista_id bigint DEFAULT NULL::bigint, p_veiculo_id bigint DEFAULT NULL::bigint, p_contrato_id bigint DEFAULT NULL::bigint, p_autor_id uuid DEFAULT NULL::uuid, p_tipo_manutencao_id bigint DEFAULT NULL::bigint, p_limite integer DEFAULT 21, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.filtrar_historico_multiplos

```sql
public.filtrar_historico_multiplos(p_token text, p_tipo text DEFAULT 'registro'::text, p_data_de date DEFAULT (((statement_timestamp() AT TIME ZONE 'America/Sao_Paulo'::text))::date - 6), p_data_ate date DEFAULT ((statement_timestamp() AT TIME ZONE 'America/Sao_Paulo'::text))::date, p_motorista_ids bigint[] DEFAULT '{}'::bigint[], p_veiculo_ids bigint[] DEFAULT '{}'::bigint[], p_contrato_ids bigint[] DEFAULT '{}'::bigint[], p_autor_ids uuid[] DEFAULT '{}'::uuid[], p_tipo_manutencao_ids bigint[] DEFAULT '{}'::bigint[], p_limite integer DEFAULT 21, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb, custo numeric, created_at timestamp with time zone, autor_nome text)
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.gerar_codigo_recuperacao

```sql
public.gerar_codigo_recuperacao(p_usuario text)
RETURNS text
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.listar_catalogos

```sql
public.listar_catalogos(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.meu_perfil

```sql
public.meu_perfil(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.normalizar

```sql
public.normalizar(p_texto text)
RETURNS text
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.obter_envio

```sql
public.obter_envio(p_token text, p_id uuid, p_tipo text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.opcoes_filtros_historico

```sql
public.opcoes_filtros_historico(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.opcoes_filtros_historico_completas

```sql
public.opcoes_filtros_historico_completas(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.proteger_login

```sql
public.proteger_login()
RETURNS trigger
```

- SECURITY DEFINER: não.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,service_role=X/postgres}`.

## public.recuperar_senha

```sql
public.recuperar_senha(p_token text, p_senha text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.salvar_manutencao

```sql
public.salvar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.salvar_manutencao

```sql
public.salvar_manutencao(p_token text, p_id uuid, p_data date, p_tipo_id bigint, p_motorista_id bigint, p_contrato_id bigint, p_veiculo_id bigint, p_custo numeric, p_observacao text)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.salvar_registro

```sql
public.salvar_registro(p_token text, p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb)
RETURNS uuid
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres,service_role=X/postgres}`.

## public.ultimo_veiculo_motorista

```sql
public.ultimo_veiculo_motorista(p_token text, p_motorista_id bigint, p_excluir_registro uuid DEFAULT NULL::uuid)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.usuario_ativo

```sql
public.usuario_ativo()
RETURNS boolean
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres}`.

## public.validar_codigo_recuperacao

```sql
public.validar_codigo_recuperacao(p_usuario text, p_codigo text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_criar_cadastro

```sql
public.web_criar_cadastro(p_token text, p_tipo text, p_dados jsonb)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_criar_usuario

```sql
public.web_criar_usuario(p_token text, p_usuario text, p_senha text, p_perfil text, p_nome text, p_sobrenome text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_definir_senha

```sql
public.web_definir_senha(p_token text, p_usuario_id uuid, p_senha text)
RETURNS void
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_listar_crlvs

```sql
public.web_listar_crlvs(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_listar_usuarios

```sql
public.web_listar_usuarios(p_token text)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.

## public.web_obter_crlv

```sql
public.web_obter_crlv(p_token text, p_veiculo_id bigint, p_documento_id uuid)
RETURNS jsonb
```

- SECURITY DEFINER: sim.
- Proprietário: `postgres`.
- Configuração: `search_path=""`.
- ACL: `{postgres=X/postgres,anon=X/postgres}`.
