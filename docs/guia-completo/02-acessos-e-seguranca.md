# Acessos e segurança

Existem três níveis diferentes: o perfil de quem usa o Hashi, as credenciais técnicas do servidor e o acesso administrativo ao projeto Supabase. Ser admin no Hashi não concede automaticamente acesso ao painel Supabase ou ao computador onde o servidor roda.

## Matriz de perfis do Hashi

| Operação                                    | Sem login                           | Funcionário ativo | Admin ativo                           |
| ------------------------------------------- | ----------------------------------- | ----------------- | ------------------------------------- |
| Entrar ou recuperar senha                   | Sim                                 | Sim               | Sim                                   |
| Consultar catálogos ativos                  | Não                                 | Sim               | Sim                                   |
| Consultar CRLV de veículo ativo com vínculo | Não                                 | Sim               | Sim                                   |
| Criar registro ou manutenção                | Não                                 | Sim               | Sim                                   |
| Ver indicadores e histórico                 | Não                                 | Próprios envios   | Todos os envios autorizados pela base |
| Editar envio                                | Não                                 | Próprios          | Próprios e de outras contas           |
| Excluir envio                               | Não                                 | Não               | Sim, com confirmação no web           |
| Criar veículo, funcionário ou contrato      | Não                                 | Não               | Sim                                   |
| Listar e criar contas                       | Não                                 | Não               | Sim                                   |
| Redefinir senha pela área administrativa    | Não                                 | Não               | Sim                                   |
| Ver senha já existente                      | Não                                 | Não               | Não                                   |
| Usar painel SQL ou Storage do Supabase      | Não é determinado pelo perfil Hashi | Acesso separado   | Acesso separado                       |

Uma conta inativa não recebe acesso. O banco confere a atividade em cada operação autenticada. A tela e a API também verificam o perfil, mas esconder um botão não é a única barreira de autorização.

## Autenticação compartilhada

O login atual usa `public.autenticar_usuario`, `public.usuarios` e `private.credenciais`. **Não usa Supabase Auth JWT, e-mail ou uma segunda base de usuários.** O schema `auth` existe como infraestrutura da plataforma e há políticas antigas que fazem referência a `auth.uid()`, mas as operações atuais passam pela autenticação própria.

1. O navegador envia usuário e senha para `POST /api/login` na mesma origem.
2. Express valida e normaliza o login e chama a RPC com a chave publicável.
3. A função valida senha bcrypt, conta ativa e limite de tentativas.
4. O banco emite um token aleatório de 32 bytes, representado por 64 caracteres hexadecimais. Guarda somente SHA-256 do token em `private.sessoes`.
5. O servidor coloca o token em cookie `hashi_session`. O JSON enviado ao navegador contém perfil, sem token.
6. Cada RPC protegida chama `private.validar_sessao`, confere expiração e usuário ativo e define `hashi.usuario_id` apenas no contexto da transação.

O cookie usa `HttpOnly`, `SameSite=Strict`, caminho `/api` e expiração retornada pelo banco. Em produção exige `Secure` e HTTPS. O token não é salvo no `localStorage`. O banco concede sete dias à sessão e, em novos logins, conserva no máximo nove sessões anteriores daquela conta antes de inserir a nova.

Logout chama `encerrar_sessao` antes de limpar o cookie. Se a revogação falhar, o erro é apresentado. Desativar uma conta e redefinir a senha invalidam as sessões e recuperações conforme as funções e triggers do banco.

## Senhas e recuperação

Novas senhas precisam de pelo menos 12 caracteres e no máximo 72 bytes UTF-8. O banco usa bcrypt com custo 12. O login tem de 3 a 40 caracteres, começa por letra e aceita letras minúsculas, números e `_`. O nome de login é imutável por trigger.

O controle de login distribui os nomes em 1.024 contadores; dez falhas bloqueiam novas tentativas naquele contador durante a janela de 15 minutos. Um hash fictício é utilizado quando não existe credencial. Por serem contadores compartilhados por hash do login, não se trata de limite dedicado por IP.

Na recuperação por código, o responsável com acesso SQL administrativo usa `gerar_codigo_recuperacao`. O código expira em 30 minutos e admite até cinco tentativas incorretas. Após validação, ele é consumido e substituído por autorização de dez minutos, guardada no cookie `hashi_recovery`. A nova senha consome a autorização e revoga as sessões. A área Usuários permite ao admin conectado redefinir senha diretamente, sem esse código.

Criar registros diretamente em `public.usuarios` sem passar pelas funções não cria uma credencial de login. Para um banco novo, siga a inicialização técnica e o procedimento de primeiro administrador do [guia de clonagem](08-instalacao-clonagem-e-publicacao.md).

## Credenciais técnicas e destinos

| Acesso                           | Onde é usado                          | Permissão e tratamento                                                                                    |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                   | Servidor Node                         | Endereço do projeto; muda numa cópia independente                                                         |
| `SUPABASE_PUBLISHABLE_KEY`       | Transporte das RPCs                   | Chave `sb_publishable_`; as RPCs protegidas ainda exigem token Hashi                                      |
| `SUPABASE_SECRET_KEY`            | Leitor de PDFs no servidor            | Chave `sb_secret_` privilegiada para Storage; não é limitada ao perfil Hashi e nunca deve ir ao navegador |
| Credencial PostgreSQL            | Backup, restore e SQL administrativo  | Obtida pelo responsável no painel Connect; não é a chave publicável nem a senha de um usuário Hashi       |
| Sessão ou token da CLI Supabase  | Administração técnica                 | Credencial do operador; não faz parte de `.env` da aplicação                                              |
| Conta do painel Supabase         | Dashboard, projeto e Storage          | Autorização própria da plataforma; os membros e papéis da organização não foram inventariados             |
| Acesso ao servidor ou hospedagem | Instalação, variáveis e processo Node | Separado dos usuários do sistema                                                                          |

Os valores reais das chaves, senhas PostgreSQL, hashes de usuários e tokens não estão neste guia. `.env` é ignorado pelo Git; use `.env.example` como lista de nomes. Não adicione prefixo `VITE_` às chaves. O servidor atual exige os prefixos modernos das chaves; JWTs legados `anon` e `service_role` não são aceitos pelos validadores de configuração do código.

## Permissões no PostgreSQL

As 14 tabelas da aplicação têm RLS habilitada. Acesso direto às tabelas por `anon` e `authenticated` é revogado no contrato atual. O schema `private` não concede acesso a esses papéis. As RPCs públicas necessárias concedem `EXECUTE` a `anon`, mas validam o token Hashi internamente. O papel SQL `anon` não significa que um visitante consegue executar operações protegidas sem sessão.

As funções usam nomes qualificados e `search_path` controlado. Funções administrativas internas como `cadastrar_usuario`, `definir_senha_usuario` e `gerar_codigo_recuperacao` são reservadas ao administrador do banco. As funções `web_*` fazem a ponte autorizada para o admin do sistema. As ACLs exatas, inclusive permissões legadas de `service_role`, estão nos [anexos](anexos/inventario-supabase.json).

Há permissões padrão amplas para futuros objetos em alguns schemas do Supabase. Ao criar nova tabela ou função, declare suas revogações e concessões explicitamente. Não suponha que a configuração de um objeto existente será herdada automaticamente.

## Proteções HTTP e de arquivos

- As mutações da API exigem `Origin` igual a `APP_ORIGIN` e conteúdo JSON. O servidor e a interface compartilham a mesma origem.
- O corpo JSON tem limite de 64 KB. A API usa `Cache-Control: no-store`.
- Helmet configura cabeçalhos; CSP é ativada em produção. O cabeçalho que identifica Express é desabilitado.
- Rotas administrativas conferem perfil ativo antes de chamar as RPCs; a verificação é repetida no banco.
- O bucket `hashi-crlv` é privado e tem política restritiva para `anon` e `authenticated`.
- O servidor autoriza veículo e documento antes de buscar o arquivo. Confere nome, caminho, tamanho, assinatura PDF e SHA-256; erros do Storage não vazam a chave.
- Vite bloqueia acesso a `.env`, arquivos de certificados, `.git`, `.tools` e `storage`. Em produção, somente `dist` é servido como conteúdo estático.

Isso descreve as proteções existentes, não uma auditoria de segurança completa. Não há MFA, SSO, CAPTCHA ou sistema de auditoria de ações implementados no web.

Fontes: [API](../../server/app.ts), [transporte RPC](../../server/rpc.ts), [leitor CRLV](../../server/crlv.ts) e [funções atuais](anexos/schema-aplicacao.sql).
