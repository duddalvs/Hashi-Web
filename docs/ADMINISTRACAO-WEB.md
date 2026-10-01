# Administração pelo Hashi Web

Implementação de 30/09/2026. Os catálogos e as contas continuam no mesmo Supabase usado pelo Hashi App.

## Uso

Reinicie o servidor pelo `INICIAR.cmd` após atualizar o código e entre com uma conta de perfil **Administrador**. Mantenha a janela do iniciador aberta.

- **Veículos → Novo veículo:** placa/identificação, tipo (veículo ou equipamento) e modelo.
- **Funcionários → Novo funcionário:** nome completo. Esse cadastro identifica responsáveis e motoristas; não cria uma conta de acesso.
- **Contratos → Novo contrato:** nome do contrato.
- **Usuários → Novo usuário:** nome, sobrenome, login, perfil e senha inicial.
- **Usuários → Alterar senha:** nova senha e confirmação. O administrador conectado não precisa informar senha anterior ou código de recuperação.

Os cadastros são criados ativos. Nomes recebem remoção de espaços excedentes; placas/identificações são gravadas em maiúsculas. Duplicidades de nomes ignoram diferenças de maiúsculas e espaços; identificações de veículos também desconsideram espaços e hífens. Cadastros inativos existentes continuam impedindo duplicidade.

Novos cadastros aparecem imediatamente no web e na próxima atualização dos catálogos do aplicativo. Novas contas usam o login e a senha definidos nos dois sistemas. A lista de usuários inclui nome, login, perfil e situação, com pesquisa. Funcionários não veem as ações administrativas e suas requisições diretas também são rejeitadas.

## Senhas

O banco guarda hashes bcrypt, sem uma senha original legível para consultar. O botão de olho mostra somente a nova senha digitada. Senhas não são incluídas na listagem, nas respostas de criação, no armazenamento local do navegador ou em arquivos de exportação.

As regras existentes foram preservadas: pelo menos 12 caracteres e até 72 bytes em UTF-8. Caracteres acentuados e emojis podem ocupar mais de um byte. Uma troca encerra as sessões da conta afetada e invalida códigos/tokens de recuperação anteriores. Ao alterar a própria senha, o administrador volta à tela de login.

As funções do aplicativo `validar_codigo_recuperacao` e `recuperar_senha` permanecem no fluxo por código. A nova ação administrativa do web usa outra RPC, autenticada pela sessão de administrador, e não altera esse fluxo do aplicativo.

Na demonstração, catálogos e usuários são isolados por sessão, temporários e não criam contas reais.

## Implementação

| API do web | RPC do Supabase |
| --- | --- |
| `POST /api/admin/catalogs/:kind` | `web_criar_cadastro(p_token,p_tipo,p_dados)` |
| `GET /api/admin/users` | `web_listar_usuarios(p_token)` |
| `POST /api/admin/users` | `web_criar_usuario(p_token,p_usuario,p_senha,p_perfil,p_nome,p_sobrenome)` |
| `POST /api/admin/users/:id/password` | `web_definir_senha(p_token,p_usuario_id,p_senha)` |

Todos os endpoints administrativos conferem perfil ativo de administrador, além do cookie de sessão e da origem nas escritas. As RPCs repetem a verificação por `private.web_exigir_admin`. O token vem do cookie HttpOnly; um perfil enviado pelo navegador não concede permissão. As respostas usam schemas que enumeram os campos permitidos, sem hashes ou senhas.

A migração [202609300004_web_admin.sql](../supabase/migrations/202609300004_web_admin.sql) é aditiva e usa as funções administrativas existentes de criação e troca de senha. Ela não concede SELECT/INSERT direto nas tabelas a clientes anônimos nem disponibiliza as funções administrativas antigas sem validação de sessão.

Aplicada e registrada no Supabase em 30/09/2026. A conferência antes/depois manteve 7 usuários, 105 funcionários, 82 veículos, 9 contratos, 21 alocações e 50 manutenções, sem usuários temporários remanescentes. As definições de login, criação de usuário, definição de senha, catálogos e recuperação por código permaneceram idênticas. As quatro novas RPCs foram reconhecidas pela API e rejeitaram sessões inválidas. O código da migração é mantido neste projeto web; o aplicativo não recebeu alterações de interface nem um novo APK.

## Verificação

- `npm.cmd test`: 24 testes de regras e API, incluindo bloqueio de funcionário/inativo, ausência de sessão, validação Unicode de senhas, filtragem de credenciais nas respostas, revogação da própria sessão e isolamento da demonstração.
- Playwright: sete fluxos existentes e três novos de administração, incluindo cadastro selecionável em um envio, criação/redefinição de usuário, visibilidade da senha digitada, troca da própria senha, restrição de funcionários e layout em 375 px.
- `npm.cmd run build`: TypeScript e compilação de produção.
- [web-admin-validation.sql](../supabase/tests/web-admin-validation.sql): testes transacionais de permissões, dados compartilhados, criação/login, troca de senha, revogação de sessões e compatibilidade da recuperação por código. Executados localmente e no Supabase com reversão dos dados temporários.
- `npm.cmd run check:remote`: assinaturas das RPCs, rejeição de sessão deliberadamente inválida e ausência de leitura anônima nas tabelas; não usa senhas de pessoas nem cria dados reais.

A validação SQL cobre as mesmas funções de autenticação usadas pelo aplicativo. Não foi realizado teste em Android físico nem login com senha pessoal de um usuário existente.
