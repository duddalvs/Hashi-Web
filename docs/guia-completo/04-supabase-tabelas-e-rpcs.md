# Supabase tabelas relacionamentos e funções

O projeto consultado é `qxkhjlkexsjgkttdugqt`, compartilhado com o Hashi App. O banco usa PostgreSQL **17.6**. Este capítulo descreve a estrutura de 03/10/2026; números de registros mudam com a operação. O [inventário JSON](anexos/inventario-supabase.json) contém o horário exato da consulta e as definições integrais.

## Tabelas da aplicação

| Tabela                       | Finalidade                                                                              | Relações principais                                          |
| ---------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `public.usuarios`            | Login, nome, sobrenome, perfil e atividade                                              | Autor de registros e manutenções; chave das tabelas privadas |
| `public.funcionarios`        | Pessoas do catálogo e marcadores de status                                              | Responsável de equipe e motorista de manutenção              |
| `public.veiculos`            | Placa/identificação, modelo, tipo e atividade                                           | Equipes, manutenções e documentos                            |
| `public.contratos`           | Contratos ativos/inativos                                                               | Registros e manutenções                                      |
| `public.tipos_manutencao`    | Tipos de serviço                                                                        | Manutenções                                                  |
| `public.registros_frota`     | Data, contrato, quantidade de equipes, autor e versão                                   | Cabeçalho de `registro_equipes`                              |
| `public.registro_equipes`    | Número, responsável e veículo de cada equipe                                            | FK ao registro com exclusão em cascata                       |
| `public.manutencoes`         | Data, serviço, motorista opcional, contrato, veículo, custo, autor, versão e observação | FKs aos catálogos e usuário                                  |
| `public.veiculo_documentos`  | `id`, `veiculo_id`, `storage_path`                                                      | FK opcional ao veículo; um veículo pode ter vários PDFs      |
| `private.credenciais`        | Hash bcrypt e atualização da senha                                                      | FK ao usuário; exclusão em cascata                           |
| `private.sessoes`            | Hash de token, usuário e validade                                                       | FK ao usuário; exclusão em cascata                           |
| `private.tentativas_login`   | Contador e início da janela por bucket de login                                         | Controle de tentativas, sem FK de usuário                    |
| `private.config_login`       | Registro singleton com hash fictício                                                    | Usado ao validar um login inexistente                        |
| `private.recuperacoes_senha` | Hash/validade do código, tentativas e autorização de recuperação                        | FK ao usuário; exclusão em cascata                           |

Para cada campo, tipo, `NOT NULL`, padrão, FK, índice e política, consulte o [dicionário das tabelas](anexos/todas-as-tabelas.md). Ele é gerado a partir do catálogo PostgreSQL, não de um modelo estimado.

```text
usuarios ── credenciais, sessoes, recuperacoes_senha
   ├── registros_frota ── registro_equipes ── funcionarios
   │         │                    └───────── veiculos
   │         └── contratos
   └── manutencoes ── contratos, veiculos, funcionarios, tipos_manutencao

veiculos ── veiculo_documentos ── caminho no bucket hashi-crlv
```

## Regras estruturais relevantes

IDs de contas, envios e documentos são UUID. Catálogos e linhas de equipes usam `bigint` com identidade. Preserve esses IDs numa clonagem com dados: os vínculos dependem deles. Placa, login e nomes de alguns catálogos têm unicidade; a definição exata está no inventário.

`usuarios.perfil` aceita `admin` ou `funcionario`. `veiculos.tipo` aceita `veiculo` ou `equipamento`. `registros_frota.numero_equipes` e `registro_equipes.numero_equipe` aceitam 1 a 50. Existe unicidade por registro e número de equipe, mas não há constraint única por responsável ou veículo dentro do registro; essa restrição adicional é validada pelo web.

`manutencoes.custo` é `numeric(12,2)`, entre zero e 9.999.999.999,99. `motorista_id` pode ser nulo. A observação tem limite de 40 caracteres. Versões de registros/manutenções começam em 1 e são usadas para detectar concorrência.

`veiculo_documentos` tem apenas três campos. `storage_path` é único, obrigatório e validado pelo padrão do CRLV. `veiculo_id` pode ser nulo para documentos sem correspondência confirmada. O banco impede excluir um veículo que ainda tenha documento vinculado. Apagar uma linha dessa tabela não equivale a remover o arquivo do Storage.

Datas futuras são recusadas pelas RPCs públicas usadas pelo sistema, com limite calculado em São Paulo. Não há CHECK permanente de data futura em todas as tabelas; escrita direta privilegiada é um caminho diferente das RPCs.

## Contagens consultadas

| Item                                       | Quantidade em 03/10/2026 |
| ------------------------------------------ | -----------------------: |
| Usuários                                   |                        7 |
| Funcionários de catálogo, incluindo status |                      105 |
| Veículos e equipamentos                    |                       82 |
| Contratos                                  |                        9 |
| Tipos de manutenção                        |                        5 |
| Registros de frota                         |                       27 |
| Linhas de equipe                           |                      143 |
| Manutenções                                |                       83 |
| Registros de documentos                    |                      149 |
| Documentos com veículo associado           |                       75 |
| Veículos com ao menos um CRLV              |                       73 |

Não use essas quantidades como valores obrigatórios de uma instalação vazia. Há testes SQL de CRLV com contagens fixas correspondentes à carga inicial; eles precisam ser ajustados quando a base mudar.

## Funções e RPCs

Existem **47 assinaturas**, sendo 34 em `public` e 13 em `private`. O web chama parte delas. O restante inclui suporte interno, administração SQL, compatibilidade e funções usadas pelo aplicativo. Não exclua uma função por não encontrar chamada no web.

| Grupo         | Funções públicas usadas pelo web                                                      |
| ------------- | ------------------------------------------------------------------------------------- |
| Sessão        | `autenticar_usuario`, `meu_perfil`, `encerrar_sessao`                                 |
| Recuperação   | `validar_codigo_recuperacao`, `recuperar_senha`                                       |
| Leitura       | `listar_catalogos`, `buscar_historico`, `obter_envio`, `ultimo_veiculo_motorista`     |
| Equipes       | `salvar_registro`, `editar_registro`                                                  |
| Manutenção    | `salvar_manutencao`, `editar_manutencao`, usando as sobrecargas com observação        |
| Exclusão      | `apagar_envio`                                                                        |
| Administração | `web_criar_cadastro`, `web_listar_usuarios`, `web_criar_usuario`, `web_definir_senha` |
| Documentos    | `web_listar_crlvs`, `web_obter_crlv`                                                  |

Também estão instaladas `buscar_historico_com_autor`, `filtrar_historico`, `filtrar_historico_multiplos`, `opcoes_filtros_historico` e `opcoes_filtros_historico_completas`. O web atual continua chamando `buscar_historico` e filtrando localmente; portanto não apresenta automaticamente filtros de autor só porque existem funções novas no banco.

O [catálogo completo](anexos/todas-as-funcoes.md) registra argumentos, padrões, retornos, privilégios e `security definer`. Os corpos integrais estão no [SQL estrutural](anexos/schema-aplicacao.sql). As regras de sessão usam `private.validar_sessao` e `private.usuario_id`; a administração web usa `private.web_exigir_admin`.

## Triggers e RLS

Os triggers relevantes protegem a imutabilidade do login, revogam acesso ao desativar usuário e invalidam recuperação ao trocar senha. As tabelas têm RLS ativada e privilégios diretos restritos. Algumas políticas antigas usam `authenticated` e `auth.uid()`. Elas foram inventariadas e não representam o mecanismo de autenticação usado pelo web atual.

O bucket privado tem a política `hashi_crlv_apenas_servidor`, restritiva para `anon` e `authenticated`. O backend consulta Storage com chave secreta apenas depois de autorizar a sessão Hashi e o vínculo. Consulte [Acessos](02-acessos-e-seguranca.md).

## Schemas e tabelas gerenciadas

Os schemas observados são `auth`, `extensions`, `graphql`, `graphql_public`, `private`, `public`, `realtime`, `storage`, `supabase_migrations` e `vault`. O dicionário inclui todas as 54 tabelas fora dos schemas internos PostgreSQL, inclusive as 40 de infraestrutura.

- `auth`: estrutura de autenticação da plataforma, independente das contas próprias do Hashi.
- `storage`: buckets, objetos, uploads e estruturas internas. O sistema usa `storage.objects` na RPC de leitura para obter tamanho do arquivo.
- `realtime`: infraestrutura da plataforma; o web não abre assinaturas Realtime.
- `supabase_migrations`: histórico de migrações; não contém os arquivos PDF.
- `vault`: estrutura gerenciada de segredos; o conteúdo não foi lido nem exportado.
- `extensions`, `graphql`, `graphql_public`: namespaces de recursos do Supabase, mesmo quando não têm tabelas neste inventário.

Essas tabelas gerenciadas devem ser provisionadas pelo Supabase do destino, não copiadas manualmente como tabelas comuns. As extensões registradas são `pgcrypto` 1.3, `uuid-ossp` 1.1, `pg_stat_statements` 1.11, `supabase_vault` 0.3.1 e `plpgsql` 1.0. A presença de uma extensão não comprova seu uso pelo web. Não foram encontradas views ou enums próprios em `public`/`private`.

## Migrações registradas

| Versão       | Nome                  | Arquivo neste repositório web |
| ------------ | --------------------- | ----------------------------- |
| 202609100001 | schema                | Não                           |
| 202609100002 | cadastros             | Não                           |
| 202609150001 | edicao_usuarios       | Não                           |
| 202609150002 | login_sem_email       | Não                           |
| 202609150003 | acesso_por_usuario    | Não                           |
| 202609160001 | recuperar_senha       | Não                           |
| 202609160002 | nome_sobrenome        | Não                           |
| 202609250001 | manutencao_observacao | Não                           |
| 202609300001 | historico_autor       | Não                           |
| 202609300002 | filtros_historico     | Não                           |
| 202609300003 | historico_multiplos   | Não                           |
| 202609300004 | web_admin             | Sim                           |
| 202610020001 | veiculo_crlv          | Sim                           |
| 202610020002 | crlv_storage          | Sim                           |
| 202610020003 | crlv_vinculo_minimo   | Sim                           |

Os quatro arquivos locais são incrementos sobre uma base existente, não um instalador completo. Não os reaplique sobre o projeto atual. Para copiar o estado final, restaure um backup consistente ou use o snapshot estrutural em um Supabase novo, conforme o [capítulo de clonagem](08-instalacao-clonagem-e-publicacao.md).
