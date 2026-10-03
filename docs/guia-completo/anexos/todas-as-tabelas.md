# Dicionário de todas as tabelas do Supabase

Estrutura consultada em 03/10/2026. Não contém linhas de usuários, credenciais, sessões ou dados operacionais. Os 54 objetos abaixo são tabelas dos schemas não internos do PostgreSQL. Tabelas `pg_catalog` e `information_schema` pertencem ao motor e não são tabelas do projeto. As 14 tabelas `public` e `private` pertencem à aplicação; as demais 40 são gerenciadas pela plataforma.

## Schema auth

### auth.audit_log_entries

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo         | Tipo                       | Aceita nulo | Padrão ou identidade  |
| ------------- | -------------------------- | ----------- | --------------------- |
| `instance_id` | `uuid`                     | Sim         | —                     |
| `id`          | `uuid`                     | Não         | —                     |
| `payload`     | `json`                     | Sim         | —                     |
| `created_at`  | `timestamp with time zone` | Sim         | —                     |
| `ip_address`  | `character varying(64)`    | Não         | ''::character varying |

Restrições:

- `audit_log_entries_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)`.

ACL registrada: `{supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.custom_oauth_providers

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo                     | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------------- | -------------------------- | ----------- | -------------------- |
| `id`                      | `uuid`                     | Não         | gen_random_uuid()    |
| `provider_type`           | `text`                     | Não         | —                    |
| `identifier`              | `text`                     | Não         | —                    |
| `name`                    | `text`                     | Não         | —                    |
| `client_id`               | `text`                     | Não         | —                    |
| `client_secret`           | `text`                     | Não         | —                    |
| `acceptable_client_ids`   | `text[]`                   | Não         | '{}'::text[]         |
| `scopes`                  | `text[]`                   | Não         | '{}'::text[]         |
| `pkce_enabled`            | `boolean`                  | Não         | true                 |
| `attribute_mapping`       | `jsonb`                    | Não         | '{}'::jsonb          |
| `authorization_params`    | `jsonb`                    | Não         | '{}'::jsonb          |
| `enabled`                 | `boolean`                  | Não         | true                 |
| `email_optional`          | `boolean`                  | Não         | false                |
| `issuer`                  | `text`                     | Sim         | —                    |
| `discovery_url`           | `text`                     | Sim         | —                    |
| `skip_nonce_check`        | `boolean`                  | Não         | false                |
| `cached_discovery`        | `jsonb`                    | Sim         | —                    |
| `discovery_cached_at`     | `timestamp with time zone` | Sim         | —                    |
| `authorization_url`       | `text`                     | Sim         | —                    |
| `token_url`               | `text`                     | Sim         | —                    |
| `userinfo_url`            | `text`                     | Sim         | —                    |
| `jwks_uri`                | `text`                     | Sim         | —                    |
| `created_at`              | `timestamp with time zone` | Não         | now()                |
| `updated_at`              | `timestamp with time zone` | Não         | now()                |
| `custom_claims_allowlist` | `text[]`                   | Não         | '{}'::text[]         |

Restrições:

- `custom_oauth_providers_authorization_url_https`: `CHECK (authorization_url IS NULL OR authorization_url ~~ 'https://%'::text)`.
- `custom_oauth_providers_authorization_url_length`: `CHECK (authorization_url IS NULL OR char_length(authorization_url) <= 2048)`.
- `custom_oauth_providers_client_id_length`: `CHECK (char_length(client_id) >= 1 AND char_length(client_id) <= 512)`.
- `custom_oauth_providers_discovery_url_length`: `CHECK (discovery_url IS NULL OR char_length(discovery_url) <= 2048)`.
- `custom_oauth_providers_identifier_format`: `CHECK (identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)`.
- `custom_oauth_providers_identifier_key`: `UNIQUE (identifier)`.
- `custom_oauth_providers_issuer_length`: `CHECK (issuer IS NULL OR char_length(issuer) >= 1 AND char_length(issuer) <= 2048)`.
- `custom_oauth_providers_jwks_uri_https`: `CHECK (jwks_uri IS NULL OR jwks_uri ~~ 'https://%'::text)`.
- `custom_oauth_providers_jwks_uri_length`: `CHECK (jwks_uri IS NULL OR char_length(jwks_uri) <= 2048)`.
- `custom_oauth_providers_name_length`: `CHECK (char_length(name) >= 1 AND char_length(name) <= 100)`.
- `custom_oauth_providers_oauth2_requires_endpoints`: `CHECK (provider_type <> 'oauth2'::text OR authorization_url IS NOT NULL AND token_url IS NOT NULL AND userinfo_url IS NOT NULL)`.
- `custom_oauth_providers_oidc_discovery_url_https`: `CHECK (provider_type <> 'oidc'::text OR discovery_url IS NULL OR discovery_url ~~ 'https://%'::text)`.
- `custom_oauth_providers_oidc_issuer_https`: `CHECK (provider_type <> 'oidc'::text OR issuer IS NULL OR issuer ~~ 'https://%'::text)`.
- `custom_oauth_providers_oidc_requires_issuer`: `CHECK (provider_type <> 'oidc'::text OR issuer IS NOT NULL)`.
- `custom_oauth_providers_pkey`: `PRIMARY KEY (id)`.
- `custom_oauth_providers_provider_type_check`: `CHECK (provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))`.
- `custom_oauth_providers_token_url_https`: `CHECK (token_url IS NULL OR token_url ~~ 'https://%'::text)`.
- `custom_oauth_providers_token_url_length`: `CHECK (token_url IS NULL OR char_length(token_url) <= 2048)`.
- `custom_oauth_providers_userinfo_url_https`: `CHECK (userinfo_url IS NULL OR userinfo_url ~~ 'https://%'::text)`.
- `custom_oauth_providers_userinfo_url_length`: `CHECK (userinfo_url IS NULL OR char_length(userinfo_url) <= 2048)`.

Índices adicionais:

- `CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at)`.
- `CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled)`.
- `CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier)`.
- `CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.flow_state

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                    | Tipo                         | Aceita nulo | Padrão ou identidade |
| ------------------------ | ---------------------------- | ----------- | -------------------- |
| `id`                     | `uuid`                       | Não         | —                    |
| `user_id`                | `uuid`                       | Sim         | —                    |
| `auth_code`              | `text`                       | Sim         | —                    |
| `code_challenge_method`  | `auth.code_challenge_method` | Sim         | —                    |
| `code_challenge`         | `text`                       | Sim         | —                    |
| `provider_type`          | `text`                       | Não         | —                    |
| `provider_access_token`  | `text`                       | Sim         | —                    |
| `provider_refresh_token` | `text`                       | Sim         | —                    |
| `created_at`             | `timestamp with time zone`   | Sim         | —                    |
| `updated_at`             | `timestamp with time zone`   | Sim         | —                    |
| `authentication_method`  | `text`                       | Não         | —                    |
| `auth_code_issued_at`    | `timestamp with time zone`   | Sim         | —                    |
| `invite_token`           | `text`                       | Sim         | —                    |
| `referrer`               | `text`                       | Sim         | —                    |
| `oauth_client_state_id`  | `uuid`                       | Sim         | —                    |
| `linking_target_id`      | `uuid`                       | Sim         | —                    |
| `email_optional`         | `boolean`                    | Não         | false                |

Restrições:

- `flow_state_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)`.
- `CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)`.
- `CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.identities

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade                     |
| ----------------- | -------------------------- | ----------- | ---------------------------------------- |
| `provider_id`     | `text`                     | Não         | —                                        |
| `user_id`         | `uuid`                     | Não         | —                                        |
| `identity_data`   | `jsonb`                    | Não         | —                                        |
| `provider`        | `text`                     | Não         | —                                        |
| `last_sign_in_at` | `timestamp with time zone` | Sim         | —                                        |
| `created_at`      | `timestamp with time zone` | Sim         | —                                        |
| `updated_at`      | `timestamp with time zone` | Sim         | —                                        |
| `email`           | `text`                     | Sim         | lower((identity_data ->> 'email'::text)) |
| `id`              | `uuid`                     | Não         | gen_random_uuid()                        |

Restrições:

- `identities_pkey`: `PRIMARY KEY (id)`.
- `identities_provider_id_provider_unique`: `UNIQUE (provider_id, provider)`.
- `identities_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)`.
- `CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.instances

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------- | -------------------------- | ----------- | -------------------- |
| `id`              | `uuid`                     | Não         | —                    |
| `uuid`            | `uuid`                     | Sim         | —                    |
| `raw_base_config` | `text`                     | Sim         | —                    |
| `created_at`      | `timestamp with time zone` | Sim         | —                    |
| `updated_at`      | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `instances_pkey`: `PRIMARY KEY (id)`.

ACL registrada: `{supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.mfa_amr_claims

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                   | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------------- | -------------------------- | ----------- | -------------------- |
| `session_id`            | `uuid`                     | Não         | —                    |
| `created_at`            | `timestamp with time zone` | Não         | —                    |
| `updated_at`            | `timestamp with time zone` | Não         | —                    |
| `authentication_method` | `text`                     | Não         | —                    |
| `id`                    | `uuid`                     | Não         | —                    |

Restrições:

- `amr_id_pk`: `PRIMARY KEY (id)`.
- `mfa_amr_claims_session_id_authentication_method_pkey`: `UNIQUE (session_id, authentication_method)`.
- `mfa_amr_claims_session_id_fkey`: `FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.mfa_challenges

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                    | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------------ | -------------------------- | ----------- | -------------------- |
| `id`                     | `uuid`                     | Não         | —                    |
| `factor_id`              | `uuid`                     | Não         | —                    |
| `created_at`             | `timestamp with time zone` | Não         | —                    |
| `verified_at`            | `timestamp with time zone` | Sim         | —                    |
| `ip_address`             | `inet`                     | Não         | —                    |
| `otp_code`               | `text`                     | Sim         | —                    |
| `web_authn_session_data` | `jsonb`                    | Sim         | —                    |

Restrições:

- `mfa_challenges_auth_factor_id_fkey`: `FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE`.
- `mfa_challenges_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.mfa_factors

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                          | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------------------ | -------------------------- | ----------- | -------------------- |
| `id`                           | `uuid`                     | Não         | —                    |
| `user_id`                      | `uuid`                     | Não         | —                    |
| `friendly_name`                | `text`                     | Sim         | —                    |
| `factor_type`                  | `auth.factor_type`         | Não         | —                    |
| `status`                       | `auth.factor_status`       | Não         | —                    |
| `created_at`                   | `timestamp with time zone` | Não         | —                    |
| `updated_at`                   | `timestamp with time zone` | Não         | —                    |
| `secret`                       | `text`                     | Sim         | —                    |
| `phone`                        | `text`                     | Sim         | —                    |
| `last_challenged_at`           | `timestamp with time zone` | Sim         | —                    |
| `web_authn_credential`         | `jsonb`                    | Sim         | —                    |
| `web_authn_aaguid`             | `uuid`                     | Sim         | —                    |
| `last_webauthn_challenge_data` | `jsonb`                    | Sim         | —                    |

Restrições:

- `mfa_factors_last_challenged_at_key`: `UNIQUE (last_challenged_at)`.
- `mfa_factors_pkey`: `PRIMARY KEY (id)`.
- `mfa_factors_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)`.
- `CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)`.
- `CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)`.
- `CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.mfa_recovery_code_sets

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo                       | Tipo                       | Aceita nulo | Padrão ou identidade |
| --------------------------- | -------------------------- | ----------- | -------------------- |
| `id`                        | `uuid`                     | Não         | —                    |
| `user_id`                   | `uuid`                     | Não         | —                    |
| `mfa_factor_id`             | `uuid`                     | Não         | —                    |
| `failed_verification_count` | `integer`                  | Não         | 0                    |
| `verification_locked_until` | `timestamp with time zone` | Sim         | —                    |
| `created_at`                | `timestamp with time zone` | Não         | now()                |
| `updated_at`                | `timestamp with time zone` | Não         | now()                |

Restrições:

- `mfa_recovery_code_sets_failed_verification_count_check`: `CHECK (failed_verification_count >= 0)`.
- `mfa_recovery_code_sets_mfa_factor_id_fkey`: `FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE`.
- `mfa_recovery_code_sets_mfa_factor_id_key`: `UNIQUE (mfa_factor_id)`.
- `mfa_recovery_code_sets_pkey`: `PRIMARY KEY (id)`.
- `mfa_recovery_code_sets_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.
- `mfa_recovery_code_sets_user_id_key`: `UNIQUE (user_id)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.mfa_recovery_codes

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo                      | Tipo                       | Aceita nulo | Padrão ou identidade |
| -------------------------- | -------------------------- | ----------- | -------------------- |
| `id`                       | `uuid`                     | Não         | —                    |
| `mfa_recovery_code_set_id` | `uuid`                     | Não         | —                    |
| `code_hash`                | `text`                     | Não         | —                    |
| `consumed_at`              | `timestamp with time zone` | Sim         | —                    |
| `created_at`               | `timestamp with time zone` | Não         | now()                |

Restrições:

- `mfa_recovery_codes_mfa_recovery_code_set_id_fkey`: `FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE`.
- `mfa_recovery_codes_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.oauth_authorizations

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo                   | Tipo                              | Aceita nulo | Padrão ou identidade                       |
| ----------------------- | --------------------------------- | ----------- | ------------------------------------------ |
| `id`                    | `uuid`                            | Não         | —                                          |
| `authorization_id`      | `text`                            | Não         | —                                          |
| `client_id`             | `uuid`                            | Não         | —                                          |
| `user_id`               | `uuid`                            | Sim         | —                                          |
| `redirect_uri`          | `text`                            | Não         | —                                          |
| `scope`                 | `text`                            | Não         | —                                          |
| `state`                 | `text`                            | Sim         | —                                          |
| `resource`              | `text`                            | Sim         | —                                          |
| `code_challenge`        | `text`                            | Sim         | —                                          |
| `code_challenge_method` | `auth.code_challenge_method`      | Sim         | —                                          |
| `response_type`         | `auth.oauth_response_type`        | Não         | 'code'::auth.oauth_response_type           |
| `status`                | `auth.oauth_authorization_status` | Não         | 'pending'::auth.oauth_authorization_status |
| `authorization_code`    | `text`                            | Sim         | —                                          |
| `created_at`            | `timestamp with time zone`        | Não         | now()                                      |
| `expires_at`            | `timestamp with time zone`        | Não         | (now() + '00:03:00'::interval)             |
| `approved_at`           | `timestamp with time zone`        | Sim         | —                                          |
| `nonce`                 | `text`                            | Sim         | —                                          |

Restrições:

- `oauth_authorizations_authorization_code_key`: `UNIQUE (authorization_code)`.
- `oauth_authorizations_authorization_code_length`: `CHECK (char_length(authorization_code) <= 255)`.
- `oauth_authorizations_authorization_id_key`: `UNIQUE (authorization_id)`.
- `oauth_authorizations_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE`.
- `oauth_authorizations_code_challenge_length`: `CHECK (char_length(code_challenge) <= 128)`.
- `oauth_authorizations_expires_at_future`: `CHECK (expires_at > created_at)`.
- `oauth_authorizations_nonce_length`: `CHECK (char_length(nonce) <= 255)`.
- `oauth_authorizations_pkey`: `PRIMARY KEY (id)`.
- `oauth_authorizations_redirect_uri_length`: `CHECK (char_length(redirect_uri) <= 2048)`.
- `oauth_authorizations_resource_length`: `CHECK (char_length(resource) <= 2048)`.
- `oauth_authorizations_scope_length`: `CHECK (char_length(scope) <= 4096)`.
- `oauth_authorizations_state_length`: `CHECK (char_length(state) <= 4096)`.
- `oauth_authorizations_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.oauth_client_states

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo           | Tipo                       | Aceita nulo | Padrão ou identidade |
| --------------- | -------------------------- | ----------- | -------------------- |
| `id`            | `uuid`                     | Não         | —                    |
| `provider_type` | `text`                     | Não         | —                    |
| `code_verifier` | `text`                     | Sim         | —                    |
| `created_at`    | `timestamp with time zone` | Não         | —                    |

Restrições:

- `oauth_client_states_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.oauth_clients

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo                        | Tipo                           | Aceita nulo | Padrão ou identidade                   |
| ---------------------------- | ------------------------------ | ----------- | -------------------------------------- |
| `id`                         | `uuid`                         | Não         | —                                      |
| `client_secret_hash`         | `text`                         | Sim         | —                                      |
| `registration_type`          | `auth.oauth_registration_type` | Não         | —                                      |
| `redirect_uris`              | `text`                         | Não         | —                                      |
| `grant_types`                | `text`                         | Não         | —                                      |
| `client_name`                | `text`                         | Sim         | —                                      |
| `client_uri`                 | `text`                         | Sim         | —                                      |
| `logo_uri`                   | `text`                         | Sim         | —                                      |
| `created_at`                 | `timestamp with time zone`     | Não         | now()                                  |
| `updated_at`                 | `timestamp with time zone`     | Não         | now()                                  |
| `deleted_at`                 | `timestamp with time zone`     | Sim         | —                                      |
| `client_type`                | `auth.oauth_client_type`       | Não         | 'confidential'::auth.oauth_client_type |
| `token_endpoint_auth_method` | `text`                         | Não         | —                                      |

Restrições:

- `oauth_clients_client_name_length`: `CHECK (char_length(client_name) <= 1024)`.
- `oauth_clients_client_uri_length`: `CHECK (char_length(client_uri) <= 2048)`.
- `oauth_clients_logo_uri_length`: `CHECK (char_length(logo_uri) <= 2048)`.
- `oauth_clients_pkey`: `PRIMARY KEY (id)`.
- `oauth_clients_token_endpoint_auth_method_check`: `CHECK (token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text]))`.

Índices adicionais:

- `CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.oauth_consents

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------ | -------------------------- | ----------- | -------------------- |
| `id`         | `uuid`                     | Não         | —                    |
| `user_id`    | `uuid`                     | Não         | —                    |
| `client_id`  | `uuid`                     | Não         | —                    |
| `scopes`     | `text`                     | Não         | —                    |
| `granted_at` | `timestamp with time zone` | Não         | now()                |
| `revoked_at` | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `oauth_consents_client_id_fkey`: `FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE`.
- `oauth_consents_pkey`: `PRIMARY KEY (id)`.
- `oauth_consents_revoked_after_granted`: `CHECK (revoked_at IS NULL OR revoked_at >= granted_at)`.
- `oauth_consents_scopes_length`: `CHECK (char_length(scopes) <= 2048)`.
- `oauth_consents_scopes_not_empty`: `CHECK (char_length(TRIM(BOTH FROM scopes)) > 0)`.
- `oauth_consents_user_client_unique`: `UNIQUE (user_id, client_id)`.
- `oauth_consents_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL)`.
- `CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL)`.
- `CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.one_time_tokens

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo        | Tipo                          | Aceita nulo | Padrão ou identidade |
| ------------ | ----------------------------- | ----------- | -------------------- |
| `id`         | `uuid`                        | Não         | —                    |
| `user_id`    | `uuid`                        | Não         | —                    |
| `token_type` | `auth.one_time_token_type`    | Não         | —                    |
| `token_hash` | `text`                        | Não         | —                    |
| `relates_to` | `text`                        | Não         | —                    |
| `created_at` | `timestamp without time zone` | Não         | now()                |
| `updated_at` | `timestamp without time zone` | Não         | now()                |
| `expires_at` | `timestamp with time zone`    | Sim         | —                    |

Restrições:

- `one_time_tokens_pkey`: `PRIMARY KEY (id)`.
- `one_time_tokens_token_hash_check`: `CHECK (char_length(token_hash) > 0)`.
- `one_time_tokens_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)`.
- `CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)`.
- `CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.refresh_tokens

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo         | Tipo                       | Aceita nulo | Padrão ou identidade                            |
| ------------- | -------------------------- | ----------- | ----------------------------------------------- |
| `instance_id` | `uuid`                     | Sim         | —                                               |
| `id`          | `bigint`                   | Não         | nextval('auth.refresh_tokens_id_seq'::regclass) |
| `token`       | `character varying(255)`   | Sim         | —                                               |
| `user_id`     | `character varying(255)`   | Sim         | —                                               |
| `revoked`     | `boolean`                  | Sim         | —                                               |
| `created_at`  | `timestamp with time zone` | Sim         | —                                               |
| `updated_at`  | `timestamp with time zone` | Sim         | —                                               |
| `parent`      | `character varying(255)`   | Sim         | —                                               |
| `session_id`  | `uuid`                     | Sim         | —                                               |

Restrições:

- `refresh_tokens_pkey`: `PRIMARY KEY (id)`.
- `refresh_tokens_session_id_fkey`: `FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE`.
- `refresh_tokens_token_unique`: `UNIQUE (token)`.

Índices adicionais:

- `CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)`.
- `CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)`.
- `CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)`.
- `CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)`.
- `CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)`.

ACL registrada: `{supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.saml_providers

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo               | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------- | -------------------------- | ----------- | -------------------- |
| `id`                | `uuid`                     | Não         | —                    |
| `sso_provider_id`   | `uuid`                     | Não         | —                    |
| `entity_id`         | `text`                     | Não         | —                    |
| `metadata_xml`      | `text`                     | Não         | —                    |
| `metadata_url`      | `text`                     | Sim         | —                    |
| `attribute_mapping` | `jsonb`                    | Sim         | —                    |
| `created_at`        | `timestamp with time zone` | Sim         | —                    |
| `updated_at`        | `timestamp with time zone` | Sim         | —                    |
| `name_id_format`    | `text`                     | Sim         | —                    |

Restrições:

- `entity_id not empty`: `CHECK (char_length(entity_id) > 0)`.
- `metadata_url not empty`: `CHECK (metadata_url = NULL::text OR char_length(metadata_url) > 0)`.
- `metadata_xml not empty`: `CHECK (char_length(metadata_xml) > 0)`.
- `saml_providers_entity_id_key`: `UNIQUE (entity_id)`.
- `saml_providers_pkey`: `PRIMARY KEY (id)`.
- `saml_providers_sso_provider_id_fkey`: `FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.saml_relay_states

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------- | -------------------------- | ----------- | -------------------- |
| `id`              | `uuid`                     | Não         | —                    |
| `sso_provider_id` | `uuid`                     | Não         | —                    |
| `request_id`      | `text`                     | Não         | —                    |
| `for_email`       | `text`                     | Sim         | —                    |
| `redirect_to`     | `text`                     | Sim         | —                    |
| `created_at`      | `timestamp with time zone` | Sim         | —                    |
| `updated_at`      | `timestamp with time zone` | Sim         | —                    |
| `flow_state_id`   | `uuid`                     | Sim         | —                    |

Restrições:

- `request_id not empty`: `CHECK (char_length(request_id) > 0)`.
- `saml_relay_states_flow_state_id_fkey`: `FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE`.
- `saml_relay_states_pkey`: `PRIMARY KEY (id)`.
- `saml_relay_states_sso_provider_id_fkey`: `FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)`.
- `CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)`.
- `CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.schema_migrations

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo     | Tipo                     | Aceita nulo | Padrão ou identidade |
| --------- | ------------------------ | ----------- | -------------------- |
| `version` | `character varying(255)` | Não         | —                    |

Restrições:

- `schema_migrations_pkey`: `PRIMARY KEY (version)`.

ACL registrada: `{supabase_auth_admin=arwdDxtm/supabase_auth_admin,postgres=r*/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.scim_tokens

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------- | -------------------------- | ----------- | -------------------- |
| `id`              | `uuid`                     | Não         | —                    |
| `sso_provider_id` | `uuid`                     | Não         | —                    |
| `token_hash`      | `text`                     | Não         | —                    |
| `prefix`          | `text`                     | Não         | —                    |
| `created_at`      | `timestamp with time zone` | Não         | now()                |
| `expires_at`      | `timestamp with time zone` | Sim         | —                    |
| `revoked_at`      | `timestamp with time zone` | Sim         | —                    |
| `last_used_at`    | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `scim_tokens_expires_at_future`: `CHECK (expires_at IS NULL OR expires_at > created_at)`.
- `scim_tokens_pkey`: `PRIMARY KEY (id)`.
- `scim_tokens_revoked_after_created`: `CHECK (revoked_at IS NULL OR revoked_at >= created_at)`.
- `scim_tokens_sso_provider_id_fkey`: `FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE`.
- `scim_tokens_token_hash_check`: `CHECK (token_hash ~ '^[0-9a-f]{64}$'::text)`.

Índices adicionais:

- `CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at)`.
- `CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at)`.
- `CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id)`.
- `CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.scim_users

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade                                     |
| ----------------- | -------------------------- | ----------- | -------------------------------------------------------- |
| `id`              | `uuid`                     | Não         | —                                                        |
| `sso_provider_id` | `uuid`                     | Não         | —                                                        |
| `user_id`         | `uuid`                     | Sim         | —                                                        |
| `resource`        | `jsonb`                    | Não         | —                                                        |
| `user_name`       | `text`                     | Não         | lower((resource ->> 'userName'::text))                   |
| `external_id`     | `text`                     | Sim         | (resource ->> 'externalId'::text)                        |
| `active`          | `boolean`                  | Não         | COALESCE(((resource ->> 'active'::text))::boolean, true) |
| `created_at`      | `timestamp with time zone` | Não         | now()                                                    |
| `updated_at`      | `timestamp with time zone` | Não         | now()                                                    |
| `deleted_at`      | `timestamp with time zone` | Sim         | —                                                        |

Restrições:

- `scim_users_pkey`: `PRIMARY KEY (id)`.
- `scim_users_sso_provider_id_fkey`: `FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE`.
- `scim_users_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL`.

Índices adicionais:

- `CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL)`.
- `CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at)`.
- `CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL))`.
- `CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL)`.
- `CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id)`.
- `CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL)`.
- `CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id)`.
- `CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL)`.
- `CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.sessions

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                    | Tipo                          | Aceita nulo | Padrão ou identidade |
| ------------------------ | ----------------------------- | ----------- | -------------------- |
| `id`                     | `uuid`                        | Não         | —                    |
| `user_id`                | `uuid`                        | Não         | —                    |
| `created_at`             | `timestamp with time zone`    | Sim         | —                    |
| `updated_at`             | `timestamp with time zone`    | Sim         | —                    |
| `factor_id`              | `uuid`                        | Sim         | —                    |
| `aal`                    | `auth.aal_level`              | Sim         | —                    |
| `not_after`              | `timestamp with time zone`    | Sim         | —                    |
| `refreshed_at`           | `timestamp without time zone` | Sim         | —                    |
| `user_agent`             | `text`                        | Sim         | —                    |
| `ip`                     | `inet`                        | Sim         | —                    |
| `tag`                    | `text`                        | Sim         | —                    |
| `oauth_client_id`        | `uuid`                        | Sim         | —                    |
| `refresh_token_hmac_key` | `text`                        | Sim         | —                    |
| `refresh_token_counter`  | `bigint`                      | Sim         | —                    |
| `scopes`                 | `text`                        | Sim         | —                    |

Restrições:

- `sessions_oauth_client_id_fkey`: `FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE`.
- `sessions_pkey`: `PRIMARY KEY (id)`.
- `sessions_scopes_length`: `CHECK (char_length(scopes) <= 4096)`.
- `sessions_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)`.
- `CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id)`.
- `CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)`.
- `CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.sso_domains

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------- | -------------------------- | ----------- | -------------------- |
| `id`              | `uuid`                     | Não         | —                    |
| `sso_provider_id` | `uuid`                     | Não         | —                    |
| `domain`          | `text`                     | Não         | —                    |
| `created_at`      | `timestamp with time zone` | Sim         | —                    |
| `updated_at`      | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `domain not empty`: `CHECK (char_length(domain) > 0)`.
- `sso_domains_pkey`: `PRIMARY KEY (id)`.
- `sso_domains_sso_provider_id_fkey`: `FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))`.
- `CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.sso_providers

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo         | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------- | -------------------------- | ----------- | -------------------- |
| `id`          | `uuid`                     | Não         | —                    |
| `resource_id` | `text`                     | Sim         | —                    |
| `created_at`  | `timestamp with time zone` | Sim         | —                    |
| `updated_at`  | `timestamp with time zone` | Sim         | —                    |
| `disabled`    | `boolean`                  | Sim         | —                    |

Restrições:

- `resource_id not empty`: `CHECK (resource_id = NULL::text OR char_length(resource_id) > 0)`.
- `sso_providers_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))`.
- `CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)`.

ACL registrada: `{postgres=ar*wdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.users

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_auth_admin`.

| Campo                         | Tipo                       | Aceita nulo | Padrão ou identidade                          |
| ----------------------------- | -------------------------- | ----------- | --------------------------------------------- |
| `instance_id`                 | `uuid`                     | Sim         | —                                             |
| `id`                          | `uuid`                     | Não         | —                                             |
| `aud`                         | `character varying(255)`   | Sim         | —                                             |
| `role`                        | `character varying(255)`   | Sim         | —                                             |
| `email`                       | `character varying(255)`   | Sim         | —                                             |
| `encrypted_password`          | `character varying(255)`   | Sim         | —                                             |
| `email_confirmed_at`          | `timestamp with time zone` | Sim         | —                                             |
| `invited_at`                  | `timestamp with time zone` | Sim         | —                                             |
| `confirmation_token`          | `character varying(255)`   | Sim         | —                                             |
| `confirmation_sent_at`        | `timestamp with time zone` | Sim         | —                                             |
| `recovery_token`              | `character varying(255)`   | Sim         | —                                             |
| `recovery_sent_at`            | `timestamp with time zone` | Sim         | —                                             |
| `email_change_token_new`      | `character varying(255)`   | Sim         | —                                             |
| `email_change`                | `character varying(255)`   | Sim         | —                                             |
| `email_change_sent_at`        | `timestamp with time zone` | Sim         | —                                             |
| `last_sign_in_at`             | `timestamp with time zone` | Sim         | —                                             |
| `raw_app_meta_data`           | `jsonb`                    | Sim         | —                                             |
| `raw_user_meta_data`          | `jsonb`                    | Sim         | —                                             |
| `is_super_admin`              | `boolean`                  | Sim         | —                                             |
| `created_at`                  | `timestamp with time zone` | Sim         | —                                             |
| `updated_at`                  | `timestamp with time zone` | Sim         | —                                             |
| `phone`                       | `text`                     | Sim         | NULL::character varying                       |
| `phone_confirmed_at`          | `timestamp with time zone` | Sim         | —                                             |
| `phone_change`                | `text`                     | Sim         | ''::character varying                         |
| `phone_change_token`          | `character varying(255)`   | Sim         | ''::character varying                         |
| `phone_change_sent_at`        | `timestamp with time zone` | Sim         | —                                             |
| `confirmed_at`                | `timestamp with time zone` | Sim         | LEAST(email_confirmed_at, phone_confirmed_at) |
| `email_change_token_current`  | `character varying(255)`   | Sim         | ''::character varying                         |
| `email_change_confirm_status` | `smallint`                 | Sim         | 0                                             |
| `banned_until`                | `timestamp with time zone` | Sim         | —                                             |
| `reauthentication_token`      | `character varying(255)`   | Sim         | ''::character varying                         |
| `reauthentication_sent_at`    | `timestamp with time zone` | Sim         | —                                             |
| `is_sso_user`                 | `boolean`                  | Não         | false                                         |
| `deleted_at`                  | `timestamp with time zone` | Sim         | —                                             |
| `is_anonymous`                | `boolean`                  | Não         | false                                         |

Restrições:

- `users_email_change_confirm_status_check`: `CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2)`.
- `users_phone_key`: `UNIQUE (phone)`.
- `users_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)`.
- `CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)`.
- `CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)`.
- `CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC)`.
- `CREATE INDEX idx_users_email ON auth.users USING btree (email)`.
- `CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC)`.
- `CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL)`.
- `CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)`.
- `CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)`.
- `CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)`.
- `CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))`.
- `CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)`.
- `CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)`.

ACL registrada: `{supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin,postgres=ar*wdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.webauthn_challenges

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo            | Tipo                       | Aceita nulo | Padrão ou identidade |
| ---------------- | -------------------------- | ----------- | -------------------- |
| `id`             | `uuid`                     | Não         | gen_random_uuid()    |
| `user_id`        | `uuid`                     | Sim         | —                    |
| `challenge_type` | `text`                     | Não         | —                    |
| `session_data`   | `jsonb`                    | Não         | —                    |
| `created_at`     | `timestamp with time zone` | Não         | now()                |
| `expires_at`     | `timestamp with time zone` | Não         | —                    |

Restrições:

- `webauthn_challenges_challenge_type_check`: `CHECK (challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text]))`.
- `webauthn_challenges_pkey`: `PRIMARY KEY (id)`.
- `webauthn_challenges_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at)`.
- `CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

### auth.webauthn_credentials

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_auth_admin`.

| Campo              | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------ | -------------------------- | ----------- | -------------------- |
| `id`               | `uuid`                     | Não         | gen_random_uuid()    |
| `user_id`          | `uuid`                     | Não         | —                    |
| `credential_id`    | `bytea`                    | Não         | —                    |
| `public_key`       | `bytea`                    | Não         | —                    |
| `attestation_type` | `text`                     | Não         | ''::text             |
| `aaguid`           | `uuid`                     | Sim         | —                    |
| `sign_count`       | `bigint`                   | Não         | 0                    |
| `transports`       | `jsonb`                    | Não         | '[]'::jsonb          |
| `backup_eligible`  | `boolean`                  | Não         | false                |
| `backed_up`        | `boolean`                  | Não         | false                |
| `friendly_name`    | `text`                     | Não         | ''::text             |
| `created_at`       | `timestamp with time zone` | Não         | now()                |
| `updated_at`       | `timestamp with time zone` | Não         | now()                |
| `last_used_at`     | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `webauthn_credentials_pkey`: `PRIMARY KEY (id)`.
- `webauthn_credentials_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id)`.
- `CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id)`.

ACL registrada: `{postgres=arwdDxtm/supabase_auth_admin,supabase_auth_admin=arwdDxtm/supabase_auth_admin,dashboard_user=arwdDxtm/supabase_auth_admin}`. As permissões reais dependem também do schema e de RLS.

## Schema private

### private.config_login

Hash fictício usado para login inexistente.

RLS: **ativada**. Proprietário: `postgres`.

| Campo           | Tipo      | Aceita nulo | Padrão ou identidade |
| --------------- | --------- | ----------- | -------------------- |
| `id`            | `boolean` | Não         | true                 |
| `hash_ficticio` | `text`    | Não         | —                    |

Restrições:

- `config_login_id_check`: `CHECK (id)`.
- `config_login_pkey`: `PRIMARY KEY (id)`.

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### private.credenciais

Hashes de senha bcrypt, sem senhas em texto.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------ | -------------------------- | ----------- | -------------------- |
| `usuario_id` | `uuid`                     | Não         | —                    |
| `senha_hash` | `text`                     | Não         | —                    |
| `updated_at` | `timestamp with time zone` | Não         | now()                |

Restrições:

- `credenciais_pkey`: `PRIMARY KEY (usuario_id)`.
- `credenciais_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`.

Triggers:

- `CREATE TRIGGER invalidar_codigo_ao_trocar_senha AFTER INSERT OR UPDATE OF senha_hash ON private.credenciais FOR EACH ROW EXECUTE FUNCTION private.invalidar_recuperacao()` (estado `O`).

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### private.recuperacoes_senha

Hashes e expiração de códigos e autorizações de recuperação.

RLS: **ativada**. Proprietário: `postgres`.

| Campo             | Tipo                       | Aceita nulo | Padrão ou identidade |
| ----------------- | -------------------------- | ----------- | -------------------- |
| `usuario_id`      | `uuid`                     | Não         | —                    |
| `codigo_hash`     | `bytea`                    | Sim         | —                    |
| `expira_em`       | `timestamp with time zone` | Não         | —                    |
| `tentativas`      | `integer`                  | Não         | 0                    |
| `token_hash`      | `bytea`                    | Sim         | —                    |
| `token_expira_em` | `timestamp with time zone` | Sim         | —                    |

Restrições:

- `recuperacoes_senha_pkey`: `PRIMARY KEY (usuario_id)`.
- `recuperacoes_senha_token_hash_key`: `UNIQUE (token_hash)`.
- `recuperacoes_senha_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`.

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### private.sessoes

Hashes de tokens de sessão e expiração.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------ | -------------------------- | ----------- | -------------------- |
| `token_hash` | `bytea`                    | Não         | —                    |
| `usuario_id` | `uuid`                     | Não         | —                    |
| `created_at` | `timestamp with time zone` | Não         | now()                |
| `expires_at` | `timestamp with time zone` | Não         | —                    |

Restrições:

- `sessoes_pkey`: `PRIMARY KEY (token_hash)`.
- `sessoes_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`.

Índices adicionais:

- `CREATE INDEX sessoes_expiracao ON private.sessoes USING btree (expires_at)`.
- `CREATE INDEX sessoes_usuario ON private.sessoes USING btree (usuario_id, created_at DESC)`.

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### private.tentativas_login

Contadores de bloqueio de login.

RLS: **ativada**. Proprietário: `postgres`.

| Campo    | Tipo                       | Aceita nulo | Padrão ou identidade |
| -------- | -------------------------- | ----------- | -------------------- |
| `bucket` | `integer`                  | Não         | —                    |
| `falhas` | `integer`                  | Não         | 0                    |
| `inicio` | `timestamp with time zone` | Não         | now()                |

Restrições:

- `tentativas_login_pkey`: `PRIMARY KEY (bucket)`.

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

## Schema public

### public.contratos

Contratos usados em registros e manutenções.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------ | -------------------------- | ----------- | ---------------------------- |
| `id`         | `bigint`                   | Não         | GENERATED ALWAYS AS IDENTITY |
| `nome`       | `text`                     | Não         | —                            |
| `ativo`      | `boolean`                  | Não         | true                         |
| `created_at` | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `contratos_nome_key`: `UNIQUE (nome)`.
- `contratos_pkey`: `PRIMARY KEY (id)`.

Políticas RLS:

| Nome              | Papéis        | Operação | Modo       | USING                                      | WITH CHECK                     |
| ----------------- | ------------- | -------- | ---------- | ------------------------------------------ | ------------------------------ |
| contratos_admin   | authenticated | ALL      | PERMISSIVE | ( SELECT e_admin() AS e_admin)             | ( SELECT e_admin() AS e_admin) |
| contratos_leitura | authenticated | SELECT   | PERMISSIVE | ( SELECT usuario_ativo() AS usuario_ativo) | —                              |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.funcionarios

Catálogo de pessoas; não cria login.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------ | -------------------------- | ----------- | ---------------------------- |
| `id`         | `bigint`                   | Não         | GENERATED ALWAYS AS IDENTITY |
| `nome`       | `text`                     | Não         | —                            |
| `is_status`  | `boolean`                  | Não         | false                        |
| `ativo`      | `boolean`                  | Não         | true                         |
| `created_at` | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `funcionarios_nome_check`: `CHECK (length(TRIM(BOTH FROM nome)) > 0)`.
- `funcionarios_nome_key`: `UNIQUE (nome)`.
- `funcionarios_pkey`: `PRIMARY KEY (id)`.

Políticas RLS:

| Nome                 | Papéis        | Operação | Modo       | USING                                      | WITH CHECK                     |
| -------------------- | ------------- | -------- | ---------- | ------------------------------------------ | ------------------------------ |
| funcionarios_admin   | authenticated | ALL      | PERMISSIVE | ( SELECT e_admin() AS e_admin)             | ( SELECT e_admin() AS e_admin) |
| funcionarios_leitura | authenticated | SELECT   | PERMISSIVE | ( SELECT usuario_ativo() AS usuario_ativo) | —                              |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.manutencoes

Serviços, veículo, motorista, custo, observação e autoria.

RLS: **ativada**. Proprietário: `postgres`.

| Campo                | Tipo                       | Aceita nulo | Padrão ou identidade |
| -------------------- | -------------------------- | ----------- | -------------------- |
| `id`                 | `uuid`                     | Não         | gen_random_uuid()    |
| `data`               | `date`                     | Não         | —                    |
| `tipo_manutencao_id` | `bigint`                   | Não         | —                    |
| `motorista_id`       | `bigint`                   | Sim         | —                    |
| `contrato_id`        | `bigint`                   | Não         | —                    |
| `veiculo_id`         | `bigint`                   | Não         | —                    |
| `custo`              | `numeric(12,2)`            | Não         | —                    |
| `usuario_id`         | `uuid`                     | Não         | —                    |
| `created_at`         | `timestamp with time zone` | Não         | now()                |
| `versao`             | `integer`                  | Não         | 1                    |
| `observacao`         | `text`                     | Sim         | —                    |

Restrições:

- `manutencoes_contrato_id_fkey`: `FOREIGN KEY (contrato_id) REFERENCES contratos(id)`.
- `manutencoes_custo_check`: `CHECK (custo >= 0::numeric AND custo <= 9999999999.99)`.
- `manutencoes_motorista_id_fkey`: `FOREIGN KEY (motorista_id) REFERENCES funcionarios(id)`.
- `manutencoes_observacao_limite`: `CHECK (char_length(observacao) <= 40)`.
- `manutencoes_pkey`: `PRIMARY KEY (id)`.
- `manutencoes_tipo_manutencao_id_fkey`: `FOREIGN KEY (tipo_manutencao_id) REFERENCES tipos_manutencao(id)`.
- `manutencoes_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id)`.
- `manutencoes_veiculo_id_fkey`: `FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)`.

Índices adicionais:

- `CREATE INDEX manutencoes_usuario_data ON public.manutencoes USING btree (usuario_id, created_at DESC)`.
- `CREATE INDEX manutencoes_veiculo ON public.manutencoes USING btree (veiculo_id)`.

Políticas RLS:

| Nome                | Papéis        | Operação | Modo       | USING                                                                                                                           | WITH CHECK |
| ------------------- | ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| manutencoes_leitura | authenticated | SELECT   | PERMISSIVE | (( SELECT usuario_ativo() AS usuario_ativo) AND ((usuario_id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin))) | —          |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.registro_equipes

Responsável e veículo de cada equipe.

RLS: **ativada**. Proprietário: `postgres`.

| Campo               | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------------- | -------------------------- | ----------- | ---------------------------- |
| `id`                | `bigint`                   | Não         | GENERATED ALWAYS AS IDENTITY |
| `registro_frota_id` | `uuid`                     | Não         | —                            |
| `numero_equipe`     | `integer`                  | Não         | —                            |
| `responsavel_id`    | `bigint`                   | Não         | —                            |
| `veiculo_id`        | `bigint`                   | Não         | —                            |
| `created_at`        | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `registro_equipes_numero_equipe_check`: `CHECK (numero_equipe >= 1 AND numero_equipe <= 50)`.
- `registro_equipes_pkey`: `PRIMARY KEY (id)`.
- `registro_equipes_registro_frota_id_fkey`: `FOREIGN KEY (registro_frota_id) REFERENCES registros_frota(id) ON DELETE CASCADE`.
- `registro_equipes_registro_frota_id_numero_equipe_key`: `UNIQUE (registro_frota_id, numero_equipe)`.
- `registro_equipes_responsavel_id_fkey`: `FOREIGN KEY (responsavel_id) REFERENCES funcionarios(id)`.
- `registro_equipes_veiculo_id_fkey`: `FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)`.

Índices adicionais:

- `CREATE INDEX equipes_registro ON public.registro_equipes USING btree (registro_frota_id)`.
- `CREATE INDEX equipes_responsavel_registro ON public.registro_equipes USING btree (responsavel_id, registro_frota_id)`.
- `CREATE INDEX equipes_veiculo ON public.registro_equipes USING btree (veiculo_id)`.

Políticas RLS:

| Nome            | Papéis        | Operação | Modo       | USING                                                                                                 | WITH CHECK |
| --------------- | ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| equipes_leitura | authenticated | SELECT   | PERMISSIVE | (EXISTS ( SELECT 1<br> FROM registros_frota r<br> WHERE (r.id = registro_equipes.registro_frota_id))) | —          |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.registros_frota

Cabeçalhos de envios de equipes e autoria.

RLS: **ativada**. Proprietário: `postgres`.

| Campo            | Tipo                       | Aceita nulo | Padrão ou identidade |
| ---------------- | -------------------------- | ----------- | -------------------- |
| `id`             | `uuid`                     | Não         | gen_random_uuid()    |
| `data`           | `date`                     | Não         | —                    |
| `contrato_id`    | `bigint`                   | Não         | —                    |
| `numero_equipes` | `integer`                  | Não         | —                    |
| `usuario_id`     | `uuid`                     | Não         | —                    |
| `created_at`     | `timestamp with time zone` | Não         | now()                |
| `versao`         | `integer`                  | Não         | 1                    |

Restrições:

- `registros_frota_contrato_id_fkey`: `FOREIGN KEY (contrato_id) REFERENCES contratos(id)`.
- `registros_frota_numero_equipes_check`: `CHECK (numero_equipes >= 1 AND numero_equipes <= 50)`.
- `registros_frota_pkey`: `PRIMARY KEY (id)`.
- `registros_frota_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id)`.

Índices adicionais:

- `CREATE INDEX registros_usuario_data ON public.registros_frota USING btree (usuario_id, created_at DESC)`.

Políticas RLS:

| Nome              | Papéis        | Operação | Modo       | USING                                                                                                                           | WITH CHECK |
| ----------------- | ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| registros_leitura | authenticated | SELECT   | PERMISSIVE | (( SELECT usuario_ativo() AS usuario_ativo) AND ((usuario_id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin))) | —          |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.tipos_manutencao

Catálogo de serviços de manutenção.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------ | -------------------------- | ----------- | ---------------------------- |
| `id`         | `bigint`                   | Não         | GENERATED ALWAYS AS IDENTITY |
| `nome`       | `text`                     | Não         | —                            |
| `ativo`      | `boolean`                  | Não         | true                         |
| `created_at` | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `tipos_manutencao_nome_key`: `UNIQUE (nome)`.
- `tipos_manutencao_pkey`: `PRIMARY KEY (id)`.

Políticas RLS:

| Nome          | Papéis        | Operação | Modo       | USING                                      | WITH CHECK                     |
| ------------- | ------------- | -------- | ---------- | ------------------------------------------ | ------------------------------ |
| tipos_admin   | authenticated | ALL      | PERMISSIVE | ( SELECT e_admin() AS e_admin)             | ( SELECT e_admin() AS e_admin) |
| tipos_leitura | authenticated | SELECT   | PERMISSIVE | ( SELECT usuario_ativo() AS usuario_ativo) | —                              |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.usuarios

Contas e perfis compartilhados com o aplicativo.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------ | -------------------------- | ----------- | -------------------- |
| `id`         | `uuid`                     | Não         | gen_random_uuid()    |
| `nome`       | `text`                     | Não         | —                    |
| `perfil`     | `text`                     | Não         | 'funcionario'::text  |
| `ativo`      | `boolean`                  | Não         | false                |
| `created_at` | `timestamp with time zone` | Não         | now()                |
| `login`      | `text`                     | Não         | —                    |
| `sobrenome`  | `text`                     | Não         | ''::text             |

Restrições:

- `usuarios_login_check`: `CHECK (login IS NULL OR login ~ '^[a-z][a-z0-9_]{2,39}$'::text)`.
- `usuarios_login_key`: `UNIQUE (login)`.
- `usuarios_perfil_check`: `CHECK (perfil = ANY (ARRAY['funcionario'::text, 'admin'::text]))`.
- `usuarios_pkey`: `PRIMARY KEY (id)`.
- `usuarios_sobrenome_tamanho`: `CHECK (length(sobrenome) <= 100)`.

Triggers:

- `CREATE TRIGGER preservar_login BEFORE UPDATE OF login ON usuarios FOR EACH ROW EXECUTE FUNCTION proteger_login()` (estado `O`).
- `CREATE TRIGGER revogar_sessoes AFTER UPDATE OF ativo ON usuarios FOR EACH ROW EXECUTE FUNCTION private.revogar_ao_desativar()` (estado `O`).

Políticas RLS:

| Nome           | Papéis        | Operação | Modo       | USING                                                                  | WITH CHECK |
| -------------- | ------------- | -------- | ---------- | ---------------------------------------------------------------------- | ---------- |
| perfil_proprio | authenticated | SELECT   | PERMISSIVE | ((id = ( SELECT auth.uid() AS uid)) OR ( SELECT e_admin() AS e_admin)) | —          |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.veiculo_documentos

Vínculo mínimo entre o veículo e o PDF no Storage.

RLS: **ativada**. Proprietário: `postgres`.

| Campo          | Tipo     | Aceita nulo | Padrão ou identidade |
| -------------- | -------- | ----------- | -------------------- |
| `id`           | `uuid`   | Não         | gen_random_uuid()    |
| `veiculo_id`   | `bigint` | Sim         | —                    |
| `storage_path` | `text`   | Não         | —                    |

Restrições:

- `veiculo_documentos_pkey`: `PRIMARY KEY (id)`.
- `veiculo_documentos_storage_path_check`: `CHECK (storage_path ~ '^crlv/[a-f0-9]{64}/CRLVDigital_[A-Z]{3}[0-9][A-Z0-9][0-9]{2}_20[0-9]{2}\.pdf$'::text)`.
- `veiculo_documentos_storage_path_key`: `UNIQUE (storage_path)`.
- `veiculo_documentos_veiculo_id_fkey`: `FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE RESTRICT`.

Índices adicionais:

- `CREATE INDEX veiculo_documentos_veiculo_idx ON public.veiculo_documentos USING btree (veiculo_id)`.

ACL registrada: `{postgres=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

### public.veiculos

Catálogo compartilhado de veículos e equipamentos.

RLS: **ativada**. Proprietário: `postgres`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------ | -------------------------- | ----------- | ---------------------------- |
| `id`         | `bigint`                   | Não         | GENERATED ALWAYS AS IDENTITY |
| `placa`      | `text`                     | Não         | —                            |
| `modelo`     | `text`                     | Não         | —                            |
| `tipo`       | `text`                     | Não         | 'veiculo'::text              |
| `ativo`      | `boolean`                  | Não         | true                         |
| `created_at` | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `veiculos_pkey`: `PRIMARY KEY (id)`.
- `veiculos_placa_key`: `UNIQUE (placa)`.
- `veiculos_tipo_check`: `CHECK (tipo = ANY (ARRAY['veiculo'::text, 'equipamento'::text]))`.

Políticas RLS:

| Nome             | Papéis        | Operação | Modo       | USING                                      | WITH CHECK                     |
| ---------------- | ------------- | -------- | ---------- | ------------------------------------------ | ------------------------------ |
| veiculos_admin   | authenticated | ALL      | PERMISSIVE | ( SELECT e_admin() AS e_admin)             | ( SELECT e_admin() AS e_admin) |
| veiculos_leitura | authenticated | SELECT   | PERMISSIVE | ( SELECT usuario_ativo() AS usuario_ativo) | —                              |

ACL registrada: `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`. As permissões reais dependem também do schema e de RLS.

## Schema realtime

### realtime.messages

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_realtime_admin`.

| Campo            | Tipo                          | Aceita nulo | Padrão ou identidade |
| ---------------- | ----------------------------- | ----------- | -------------------- |
| `topic`          | `text`                        | Não         | —                    |
| `extension`      | `text`                        | Não         | —                    |
| `payload`        | `jsonb`                       | Sim         | —                    |
| `event`          | `text`                        | Sim         | —                    |
| `private`        | `boolean`                     | Sim         | false                |
| `updated_at`     | `timestamp without time zone` | Não         | now()                |
| `inserted_at`    | `timestamp without time zone` | Não         | now()                |
| `id`             | `uuid`                        | Não         | gen_random_uuid()    |
| `binary_payload` | `bytea`                       | Sim         | —                    |
| `skip_broadcast` | `boolean`                     | Não         | false                |

Restrições:

- `messages_payload_exclusive`: `CHECK (payload IS NULL OR binary_payload IS NULL) NOT VALID`.
- `messages_pkey`: `PRIMARY KEY (id, inserted_at)`.

Índices adicionais:

- `CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))`.

ACL registrada: `{supabase_realtime_admin=arwdDxtm/supabase_realtime_admin,postgres=a*r*wdDxtm/supabase_realtime_admin,dashboard_user=arwdDxtm/supabase_realtime_admin,anon=arw/supabase_realtime_admin,authenticated=arw/supabase_realtime_admin,service_role=arw/supabase_realtime_admin}`. As permissões reais dependem também do schema e de RLS.

### realtime.schema_migrations

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_admin`.

| Campo         | Tipo                             | Aceita nulo | Padrão ou identidade |
| ------------- | -------------------------------- | ----------- | -------------------- |
| `version`     | `bigint`                         | Não         | —                    |
| `inserted_at` | `timestamp(0) without time zone` | Sim         | now()                |

Restrições:

- `schema_migrations_pkey`: `PRIMARY KEY (version)`.

ACL registrada: `{supabase_admin=arwdDxtm/supabase_admin,postgres=arwdDxtm/supabase_admin,dashboard_user=arwdDxtm/supabase_admin}`. As permissões reais dependem também do schema e de RLS.

### realtime.subscription

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_realtime_admin`.

| Campo              | Tipo                             | Aceita nulo | Padrão ou identidade                           |
| ------------------ | -------------------------------- | ----------- | ---------------------------------------------- |
| `id`               | `bigint`                         | Não         | GENERATED ALWAYS AS IDENTITY                   |
| `subscription_id`  | `uuid`                           | Não         | —                                              |
| `entity`           | `regclass`                       | Não         | —                                              |
| `filters`          | `realtime.user_defined_filter[]` | Não         | '{}'::realtime.user_defined_filter[]           |
| `claims`           | `jsonb`                          | Não         | —                                              |
| `claims_role`      | `regrole`                        | Não         | realtime.to_regrole((claims ->> 'role'::text)) |
| `created_at`       | `timestamp without time zone`    | Não         | timezone('utc'::text, now())                   |
| `action_filter`    | `text`                           | Sim         | '*'::text                                      |
| `selected_columns` | `text[]`                         | Sim         | —                                              |

Restrições:

- `pk_subscription`: `PRIMARY KEY (id)`.
- `subscription_action_filter_check`: `CHECK (action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))`.

Índices adicionais:

- `CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)`.
- `CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]))`.

Triggers:

- `CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()` (estado `O`).

ACL registrada: `{supabase_realtime_admin=arwdDxtm/supabase_realtime_admin,postgres=arwdDxtm/supabase_realtime_admin,dashboard_user=arwdDxtm/supabase_realtime_admin,anon=r/supabase_realtime_admin,authenticated=r/supabase_realtime_admin,service_role=r/supabase_realtime_admin}`. As permissões reais dependem também do schema e de RLS.

## Schema storage

### storage.buckets

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo                                | Tipo                       | Aceita nulo | Padrão ou identidade           |
| ------------------------------------ | -------------------------- | ----------- | ------------------------------ |
| `id`                                 | `text`                     | Não         | —                              |
| `name`                               | `text`                     | Não         | —                              |
| `owner`                              | `uuid`                     | Sim         | —                              |
| `created_at`                         | `timestamp with time zone` | Sim         | now()                          |
| `updated_at`                         | `timestamp with time zone` | Sim         | now()                          |
| `public`                             | `boolean`                  | Sim         | false                          |
| `avif_autodetection`                 | `boolean`                  | Sim         | false                          |
| `file_size_limit`                    | `bigint`                   | Sim         | —                              |
| `allowed_mime_types`                 | `text[]`                   | Sim         | —                              |
| `owner_id`                           | `text`                     | Sim         | —                              |
| `type`                               | `storage.buckettype`       | Não         | 'STANDARD'::storage.buckettype |
| `versioning_status`                  | `text`                     | Não         | 'DISABLED'::text               |
| `lifecycle_configuration`            | `jsonb`                    | Sim         | —                              |
| `lifecycle_configuration_generation` | `uuid`                     | Sim         | —                              |

Restrições:

- `buckets_lifecycle_configuration_pair_check`: `CHECK ((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL))`.
- `buckets_lifecycle_configuration_shape_check`: `CHECK (lifecycle_configuration IS NULL OR jsonb_typeof(lifecycle_configuration) = 'object'::text AND lifecycle_configuration ? 'rules'::text AND
CASE
WHEN jsonb_typeof(lifecycle_configuration -> 'rules'::text) = 'array'::text THEN jsonb_array_length(lifecycle_configuration -> 'rules'::text) >= 1 AND jsonb_array_length(lifecycle_configuration -> 'rules'::text) <= 1000
ELSE false
END)`.
- `buckets_lifecycle_configuration_standard_only_check`: `CHECK (type = 'STANDARD'::storage.buckettype OR lifecycle_configuration IS NULL AND lifecycle_configuration_generation IS NULL)`.
- `buckets_pkey`: `PRIMARY KEY (id)`.
- `buckets_versioning_dark_check`: `CHECK (versioning_status = 'DISABLED'::text)`.
- `buckets_versioning_standard_only_check`: `CHECK (type = 'STANDARD'::storage.buckettype OR versioning_status = 'DISABLED'::text)`.
- `buckets_versioning_status_check`: `CHECK (versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text]))`.

Índices adicionais:

- `CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)`.

Triggers:

- `CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()` (estado `O`).
- `CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role')` (estado `O`).
- `CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns()` (estado `O`).
- `CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role')` (estado `O`).
- `CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()` (estado `O`).

ACL registrada: `{supabase_storage_admin=a*r*w*d*D*x*t*m*/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin,postgres=a*r*w*d*D*x*t*m*/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.buckets_analytics

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade            |
| ------------ | -------------------------- | ----------- | ------------------------------- |
| `name`       | `text`                     | Não         | —                               |
| `type`       | `storage.buckettype`       | Não         | 'ANALYTICS'::storage.buckettype |
| `format`     | `text`                     | Não         | 'ICEBERG'::text                 |
| `created_at` | `timestamp with time zone` | Não         | now()                           |
| `updated_at` | `timestamp with time zone` | Não         | now()                           |
| `id`         | `uuid`                     | Não         | gen_random_uuid()               |
| `deleted_at` | `timestamp with time zone` | Sim         | —                               |

Restrições:

- `buckets_analytics_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL)`.

ACL registrada: `{supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.buckets_vectors

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo        | Tipo                       | Aceita nulo | Padrão ou identidade         |
| ------------ | -------------------------- | ----------- | ---------------------------- |
| `id`         | `text`                     | Não         | —                            |
| `type`       | `storage.buckettype`       | Não         | 'VECTOR'::storage.buckettype |
| `created_at` | `timestamp with time zone` | Não         | now()                        |
| `updated_at` | `timestamp with time zone` | Não         | now()                        |

Restrições:

- `buckets_vectors_pkey`: `PRIMARY KEY (id)`.

ACL registrada: `{supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=r/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.migrations

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo         | Tipo                          | Aceita nulo | Padrão ou identidade |
| ------------- | ----------------------------- | ----------- | -------------------- |
| `id`          | `integer`                     | Não         | —                    |
| `name`        | `character varying(100)`      | Não         | —                    |
| `hash`        | `character varying(40)`       | Não         | —                    |
| `executed_at` | `timestamp without time zone` | Sim         | CURRENT_TIMESTAMP    |

Restrições:

- `migrations_name_key`: `UNIQUE (name)`.
- `migrations_pkey`: `PRIMARY KEY (id)`.

ACL registrada: `NULL (padrão PostgreSQL)`. As permissões reais dependem também do schema e de RLS.

### storage.objects

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo              | Tipo                       | Aceita nulo | Padrão ou identidade             |
| ------------------ | -------------------------- | ----------- | -------------------------------- |
| `id`               | `uuid`                     | Não         | gen_random_uuid()                |
| `bucket_id`        | `text`                     | Sim         | —                                |
| `name`             | `text`                     | Sim         | —                                |
| `owner`            | `uuid`                     | Sim         | —                                |
| `created_at`       | `timestamp with time zone` | Sim         | now()                            |
| `updated_at`       | `timestamp with time zone` | Sim         | now()                            |
| `last_accessed_at` | `timestamp with time zone` | Sim         | now()                            |
| `metadata`         | `jsonb`                    | Sim         | —                                |
| `path_tokens`      | `text[]`                   | Sim         | string_to_array(name, '/'::text) |
| `version`          | `text`                     | Sim         | —                                |
| `owner_id`         | `text`                     | Sim         | —                                |
| `user_metadata`    | `jsonb`                    | Sim         | —                                |
| `archived_at`      | `timestamp with time zone` | Sim         | —                                |
| `is_delete_marker` | `boolean`                  | Não         | false                            |
| `is_versioned`     | `boolean`                  | Não         | false                            |

Restrições:

- `objects_bucketId_fkey`: `FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)`.
- `objects_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")`.
- `CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C")`.
- `CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL)`.
- `CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker`.
- `CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned)`.
- `CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)`.
- `CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT`.

Triggers:

- `CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()` (estado `O`).
- `CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()` (estado `O`).

Políticas RLS:

| Nome                       | Papéis              | Operação | Modo        | USING                             | WITH CHECK                        |
| -------------------------- | ------------------- | -------- | ----------- | --------------------------------- | --------------------------------- |
| hashi_crlv_apenas_servidor | anon, authenticated | ALL      | RESTRICTIVE | (bucket_id <> 'hashi-crlv'::text) | (bucket_id <> 'hashi-crlv'::text) |

ACL registrada: `{supabase_storage_admin=a*r*w*d*D*x*t*m*/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=arwdDxtm/supabase_storage_admin,anon=arwdDxtm/supabase_storage_admin,postgres=a*r*w*d*D*x*t*m*/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.s3_multipart_uploads

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo              | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------ | -------------------------- | ----------- | -------------------- |
| `id`               | `text`                     | Não         | —                    |
| `in_progress_size` | `bigint`                   | Não         | 0                    |
| `upload_signature` | `text`                     | Não         | —                    |
| `bucket_id`        | `text`                     | Não         | —                    |
| `key`              | `text`                     | Não         | —                    |
| `version`          | `text`                     | Não         | —                    |
| `owner_id`         | `text`                     | Sim         | —                    |
| `created_at`       | `timestamp with time zone` | Não         | now()                |
| `user_metadata`    | `jsonb`                    | Sim         | —                    |
| `metadata`         | `jsonb`                    | Sim         | —                    |

Restrições:

- `s3_multipart_uploads_bucket_id_fkey`: `FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)`.
- `s3_multipart_uploads_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)`.

ACL registrada: `{supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.s3_multipart_uploads_parts

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo         | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------- | -------------------------- | ----------- | -------------------- |
| `id`          | `uuid`                     | Não         | gen_random_uuid()    |
| `upload_id`   | `text`                     | Não         | —                    |
| `size`        | `bigint`                   | Não         | 0                    |
| `part_number` | `integer`                  | Não         | —                    |
| `bucket_id`   | `text`                     | Não         | —                    |
| `key`         | `text`                     | Não         | —                    |
| `etag`        | `text`                     | Não         | —                    |
| `owner_id`    | `text`                     | Sim         | —                    |
| `version`     | `text`                     | Não         | —                    |
| `created_at`  | `timestamp with time zone` | Não         | now()                |

Restrições:

- `s3_multipart_uploads_parts_bucket_id_fkey`: `FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)`.
- `s3_multipart_uploads_parts_pkey`: `PRIMARY KEY (id)`.
- `s3_multipart_uploads_parts_upload_id_fkey`: `FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE`.

ACL registrada: `{supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=arwdDxtm/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

### storage.vector_indexes

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **ativada**. Proprietário: `supabase_storage_admin`.

| Campo                    | Tipo                       | Aceita nulo | Padrão ou identidade |
| ------------------------ | -------------------------- | ----------- | -------------------- |
| `id`                     | `text`                     | Não         | gen_random_uuid()    |
| `name`                   | `text`                     | Não         | —                    |
| `bucket_id`              | `text`                     | Não         | —                    |
| `data_type`              | `text`                     | Não         | —                    |
| `dimension`              | `integer`                  | Não         | —                    |
| `distance_metric`        | `text`                     | Não         | —                    |
| `metadata_configuration` | `jsonb`                    | Sim         | —                    |
| `created_at`             | `timestamp with time zone` | Não         | now()                |
| `updated_at`             | `timestamp with time zone` | Não         | now()                |

Restrições:

- `vector_indexes_bucket_id_fkey`: `FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id)`.
- `vector_indexes_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id)`.

ACL registrada: `{supabase_storage_admin=arwdDxtm/supabase_storage_admin,service_role=r/supabase_storage_admin,authenticated=r/supabase_storage_admin,anon=r/supabase_storage_admin}`. As permissões reais dependem também do schema e de RLS.

## Schema supabase_migrations

### supabase_migrations.schema_migrations

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `postgres`.

| Campo        | Tipo     | Aceita nulo | Padrão ou identidade |
| ------------ | -------- | ----------- | -------------------- |
| `version`    | `text`   | Não         | —                    |
| `statements` | `text[]` | Sim         | —                    |
| `name`       | `text`   | Sim         | —                    |

Restrições:

- `schema_migrations_pkey`: `PRIMARY KEY (version)`.

ACL registrada: `NULL (padrão PostgreSQL)`. As permissões reais dependem também do schema e de RLS.

## Schema vault

### vault.secrets

Tabela gerenciada pelo Supabase. Sua estrutura foi inventariada; o código web não a consulta diretamente.

RLS: **desativada**. Proprietário: `supabase_admin`.

| Campo         | Tipo                       | Aceita nulo | Padrão ou identidade              |
| ------------- | -------------------------- | ----------- | --------------------------------- |
| `id`          | `uuid`                     | Não         | gen_random_uuid()                 |
| `name`        | `text`                     | Sim         | —                                 |
| `description` | `text`                     | Não         | ''::text                          |
| `secret`      | `text`                     | Não         | —                                 |
| `key_id`      | `uuid`                     | Sim         | —                                 |
| `nonce`       | `bytea`                    | Sim         | vault._crypto_aead_det_noncegen() |
| `created_at`  | `timestamp with time zone` | Não         | CURRENT_TIMESTAMP                 |
| `updated_at`  | `timestamp with time zone` | Não         | CURRENT_TIMESTAMP                 |

Restrições:

- `secrets_pkey`: `PRIMARY KEY (id)`.

Índices adicionais:

- `CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL)`.

ACL registrada: `{supabase_admin=arwdDxtm/supabase_admin,postgres=r*d*D*x*/supabase_admin,service_role=rd/supabase_admin}`. As permissões reais dependem também do schema e de RLS.
