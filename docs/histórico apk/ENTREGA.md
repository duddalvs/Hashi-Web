# Hashimoto Frota — situação atualizada em 17/09/2026

## Revisão posterior ao APK — datas e manutenção

Datas futuras bloqueadas em Registro/Manutenção e suas edições, pelo calendário, entrada web, validação do formulário e RPCs. Removido o atalho de relógio do cabeçalho; Histórico permanece na tela inicial e no menu. Após ajuste solicitado pelo usuário, Manutenção segue Data, Contrato, Placa, Motorista, Tipo de manutenção e Valor. Modelo continua derivado da placa.

“Motorista não identificado” preenche visualmente o campo e grava `NULL` na coluna existente, com suporte a edição e Histórico. Migração `202609170001_manutencao_datas.sql` aplicada no Supabase, incluindo a opção Outros, ausente no catálogo remoto que continha Mecânica, Hidráulica, Pneus e Lanternagem. Envios existentes não foram alterados pela migração.

Passaram TypeScript, 36 testes locais, cinco fluxos web em demonstração, um fluxo com API simulada e o teste SQL real `maintenance-dates-validation.sql`, com rollback das contas/envios temporários. A validação remota cobriu datas, motorista nulo, idempotência, edição, Histórico e permissões. **Nenhum novo APK foi gerado; o arquivo descrito abaixo não inclui esta revisão de interface. Android físico não foi testado nesta mudança.**

O ajuste posterior que colocou Contrato abaixo de Data passou em TypeScript e Prettier. Os testes de navegador e a captura de manutenção não foram repetidos após essa troca de posição.

## APK gerado — 17/09/2026

Aplicadas otimizações Android de release (R8, redução de recursos e arquiteturas ARM 32/64 bits) e correções compatíveis do Expo SDK 57. Conta Expo e ambiente `preview` conferidos. TypeScript, 33 testes locais, 21 verificações Expo Doctor e exportação Android com Hermes passaram. Pacote de fontes inspecionado localmente: 51 arquivos, 866.966 bytes sem compressão; caches, cópias, documentos e credenciais locais excluídos.

Após autorização explícita do usuário para enviar as fontes ao Expo, o build `4e277b8f-a9fd-4c92-90bc-d97a4cc75d54` foi concluído com sucesso em 17/09/2026 às 14:07:30 UTC (perfil `preview`, Android 1.0.0/1, pacote `com.hashimoto.frota`). O Expo gerou a chave de assinatura e recebeu o pacote comprimido de fontes de 466 KB. Logs remotos confirmam Expo Doctor 21/21, bundle e build Gradle de release com R8.

APK: [download](https://expo.dev/artifacts/eas/YR9noa5v26RDpK2FdTabQWJ6rgJIVsKtt93CiWybGb4.apk), com cópia em `entrega/Hashi-App-1.0.0.apk`. Tamanho **49.211.807 bytes (49,2 MB)**; SHA-256 `e11dc0e1b98e28e81b1a866b93e52048d9b301039aca8ddc14edbb9eeedc16d3`. Verificados ZIP/CRC, manifesto, bibliotecas ARM 32/64 bits, bundle e configuração pública do Supabase. Android mínimo API 24, alvo 36; sem atributo debuggable. Bloco de assinatura v2 identificado; verificação criptográfica com apksigner não realizada. Nenhum arquivo de senha, `.env` ou script administrativo encontrado no pacote. Relatório em `entrega/verificacao-apk.json`.

**Instalação e uso em Android físico permanecem pendentes.** Veja [o guia de instalação](INSTALAR-ANDROID.md). As referências a APK pendente nas revisões antigas abaixo são históricas; build e download estão concluídos nesta revisão.

## Nome, sobrenome e Histórico — 16/09/2026

Migração `202609160002_nome_sobrenome.sql` aplicada no Supabase. Cadastro por SQL exige nome e sobrenome separados, aceita nomes compostos e mantém usuário/senha sem e-mail. Perfis existentes atualizados para Lucas Melgaço (`user_admin`, admin) e Maria Eduarda Alves (`user_pessoa1`, funcionária); IDs, logins, senhas e autoria preservados. Conferência antes/depois: dois registros do administrador e uma manutenção da funcionária.

Saudação usa o nome; menu mostra nome e sobrenome. Histórico organizado somente em Registros e Manutenções, busca por categoria, dados com rótulos e paginação direta. Ao salvar ou voltar da edição, seleciona o tipo correspondente.

Passaram TypeScript, 32 testes locais, três fluxos web em demonstração, três fluxos com API simulada e validação transacional do cadastro/login/permissões no Supabase real, com rollback. Captura de Histórico conferida. Saudações e menu conferidos com dados simulados das duas pessoas, incluindo largura de 320 px. Senhas reais não foram usadas em teste nesta revisão; APK e Android físico permanecem pendentes.

## Atualização de 16/09/2026

Login com olho para mostrar/ocultar a senha e **Esqueceu sua senha?**. Recuperação sem e-mail por código temporário emitido pelo administrador; depois da validação, dois campos para nova senha e confirmação. Migração `202609160001_recuperar_senha.sql` aplicada, com códigos de uso único, expiração, limite de tentativas e revogação de sessões após troca. Instruções em [ACESSOS.md](ACESSOS.md).

Passaram TypeScript, 32 testes locais, um fluxo de interface com API controlada e validação no PostgreSQL real com conta temporária e rollback. Nenhuma senha existente foi alterada. Não houve teste Android físico nesta revisão.

## Contas e histórico — 15/09/2026

**Revisão final — sem e-mail em nenhum acesso:** instalada `202609150003_acesso_por_usuario.sql`. Autenticação própria por usuário/senha no PostgreSQL; `Authentication → Users` ficou vazio. Credenciais e sessões privadas com hashes; nenhuma chave administrativa no Vault. Preservados os dois usuários, as senhas atuais, IDs e os três envios existentes nesta revisão. `cadastrar_usuario` e `definir_senha_usuario` já estão disponíveis no SQL Editor para o administrador do banco. Instruções em [ACESSOS.md](ACESSOS.md).

Passaram 31 testes locais, TypeScript, três fluxos web em demonstração, logins/edição/exclusão na API e navegador reais e criação/redefinição de contas temporárias no banco com rollback. Sessão persiste após recarregar e é revogada por logout, expiração, desativação e redefinição. Inventário final: zero contas Auth, zero colunas email nas tabelas public/private, duas credenciais protegidas e três envios. O fluxo anterior com Auth e a pendência de Vault foram substituídos; as notas abaixo são históricas.

Revisão de login: removida a coluna `email` de `public.usuarios` no banco hospedado; login no aplicativo aceita somente nome de usuário e senha. Migração aplicada: `202609150002_login_sem_email.sql`. Supabase Auth guarda as senhas como hash e mantém internamente os identificadores técnicos `@hashimoto.invalid`. Contas e envios preservados. Passaram TypeScript, 24 testes locais e nova validação API/navegador dos dois logins, edição e exclusão com permissões.

**Pendente:** cadastro completo pelo SQL Editor preparado em `supabase/pending/202609150003_cadastro_auth.sql`, ainda não instalado. A revisão automática bloqueou a configuração da chave administrativa no Vault por exigir autorização específica para acesso persistente do banco ao Auth. O script bloqueado não executou. Após aprovação, ainda será necessário configurar, implantar e testar a criação de uma conta temporária. O cadastro atual pelo painel Auth e ativação por login está documentado no README.

Revisão posterior: **Apagar** agora fica visível também para funcionários. Ao tocar, recebem “Acesso negado” e “Somente administradores podem fazer esse tipo de ação.”, com botão **Entendi**. A exclusão permanece restrita a administradores no aplicativo e no banco.

TypeScript e teste web de equipes em demonstração passaram nesta revisão, conferindo o aviso e a preservação/edição do registro. Não houve nova alteração ou validação remota do banco para essa mudança de interface.

- Criados e testados no Supabase real: **user_admin**, administrador, e **user_pessoa1**, funcionário. Login por nome de usuário e senha; consultar os acessos em `VER-ACESSOS.cmd`, na pasta original do projeto. Senhas ficam protegidas pelo Windows, fora do aplicativo e desta documentação.
- Removida do Auth a conta `dev.hashimoto.ltda@gmail.com`, conforme solicitado. Seus **3 registros e 2 manutenções** foram preservados e transferidos para `user_admin`. `user_pessoa1` inicia sem envios.
- Histórico agora permite editar o formulário já enviado, salvar alterações e cancelar edição. Funcionários editam os próprios envios; administradores editam todos. A edição mantém ID, autor e data de criação, usa transação e detecta alterações concorrentes por versão.
- Administradores também podem **Apagar**, com confirmação e exclusão efetiva no banco. Equipes vinculadas são removidas em cascata. A permissão é validada no Supabase e se aplica a qualquer perfil administrativo, independentemente do nome.
- Aplicada a migração `202609150001_edicao_usuarios.sql`, com login, versão e RPCs de consulta para edição, atualização e exclusão. As duas migrações iniciais não foram reaplicadas.
- Passaram: TypeScript, **22 testes locais**, **3 fluxos de interface em demonstração** e validação pela **API e navegador com login real das duas contas**. Conferidos editar/salvar/cancelar, isolamento do funcionário, bloqueio de exclusão e promoção de perfil, exclusão administrativa com confirmação/cancelamento e cascata. Todos os envios temporários do teste foram removidos; consulta final confirmou os cinco envios antigos preservados.
- Validação reproduzível: `scripts/verificar-edicao-remota.ps1`, com servidor web conectado ao Supabase na porta 8085 e Chrome instalado. Não houve teste Android físico ou build de APK nesta alteração.

## Registro anterior — 10/09/2026

As informações abaixo preservam a entrega inicial. Para contas, histórico e testes atuais, vale a atualização acima.

Atualização de interface em 15/09/2026: tela principal com saudação e pergunta mais curtas, cards compactos de bordas suaves e textos alinhados à esquerda. TypeScript e três fluxos de interface em demonstração passaram; captura da tela principal atualizada e conferida. As pendências de validação física e APK abaixo permanecem.

O aplicativo está implementado e conectado ao Supabase hospedado. As tabelas e os cadastros foram instalados, e as gravações e permissões foram validadas no banco real. O primeiro administrador está ativo, com login e leitura dos cadastros testados pela API. O usuário informou que já abriu as telas pelo Expo. A entrega operacional ainda exige testar o envio pelo celular e instalar o APK.

## Serviços conectados

- Supabase: [Hashimoto Frota](https://supabase.com/dashboard/project/qxkhjlkexsjgkttdugqt), referência `qxkhjlkexsjgkttdugqt`, região São Paulo (`sa-east-1`), organização Hashimoto Soluções em Energia.
- Migrações aplicadas: `202609100001_schema.sql` e `202609100002_cadastros.sql`.
- Expo EAS: [@duddalvs/hashimoto-frota](https://expo.dev/accounts/duddalvs/projects/hashimoto-frota), ID `15fd53c4-415d-4545-aa0e-9d13cabf71fa`.
- URL e chave publishable configuradas em `.env` e nos ambientes EAS `preview` e `production`. Nenhuma chave privada foi colocada no aplicativo.
- Cadastro público desabilitado no Auth hospedado; login por e-mail habilitado.
- Administrador `dev.hashimoto.ltda@gmail.com` criado e ativo. A senha gerada pode ser consultada com `VER-ACESSO-ADMIN.cmd`; o armazenamento local usa criptografia do Windows.

## Banco instalado

| Tabela             | Conteúdo inicial                                              |
| ------------------ | ------------------------------------------------------------- |
| `usuarios`         | 1 administrador ativo                                         |
| `funcionarios`     | 102 pessoas ativas e 1 status inativo, Parado na Base         |
| `veiculos`         | 82 cadastros, incluindo 2 equipamentos e 12 modelos pendentes |
| `contratos`        | 9 contratos                                                   |
| `tipos_manutencao` | 8 tipos                                                       |
| `registros_frota`  | Pronta para receber registros                                 |
| `registro_equipes` | Pronta para receber equipes relacionadas aos registros        |
| `manutencoes`      | Pronta para receber serviços e custos                         |

RLS habilitada nas oito tabelas. Funcionários ativos consultam os próprios envios; administradores ativos consultam todos. As funções `salvar_registro` e `salvar_manutencao` validam os dados e impedem duplicação ao repetir um envio com o mesmo ID. `buscar_historico` consulta as tabelas reais.

## Verificações

| Verificação                                                           | Resultado                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| TypeScript                                                            | Passou                                                                |
| Testes locais de regras e banco                                       | 14 passaram                                                           |
| Expo Doctor                                                           | 21/21 passaram                                                        |
| Interface em Chrome com viewport Pixel 7                              | 3 fluxos passaram, sem erros de console                               |
| Exportação web e Android com bytecode Hermes                          | Passaram; não é APK assinado                                          |
| Instalação remota das migrações e contagem dos cadastros              | Confirmadas                                                           |
| RLS habilitada nas oito tabelas hospedadas                            | Confirmada                                                            |
| Gravação, moeda, idempotência e busca no Supabase real                | Passaram                                                              |
| Isolamento entre usuários e bloqueio de usuário inativo no banco real | Passaram                                                              |
| Conexão HTTP pública, Auth e cadastro público fechado                 | Passaram                                                              |
| Acesso anônimo às oito tabelas e ao histórico pela API                | Bloqueado como esperado                                               |
| Login do administrador e leitura dos quatro catálogos pela API        | Passaram                                                              |
| Expo Go em aparelho do usuário                                        | Abertura das telas informada pelo usuário                             |
| Login e envio real pelo celular                                       | Pendente de validação no aparelho                                     |
| Build EAS e download do APK                                           | Concluídos em 17/09/2026; instalação e abertura no aparelho pendentes |

Os testes remotos usaram duas contas e registros temporários dentro de uma transação desfeita por `rollback`; não deixaram dados fictícios no banco. O script está em `supabase/tests/remote-validation.sql`. A verificação HTTP está em `scripts/verificar-conexao.mjs`.

## Próximos passos operacionais

1. Consultar os dados de acesso com `VER-ACESSO-ADMIN.cmd`.
2. Reiniciar o Expo para carregar o `.env` atualizado e testar um envio de registro e manutenção com consulta no histórico.
3. Instalar o APK gerado em 17/09/2026 e validar abertura e fluxos no Android. Para versões seguintes, gerar novamente com `npm.cmd run build:apk`.

## Implementação e limites

- Entrada, login, sessão, tela principal, Registro, Manutenção e Histórico implementados.
- Cabeçalho com histórico/menu e rodapé fixo com somente Registro e Manutenção.
- Dropdowns pesquisáveis exigem seleção; placa preenche modelo somente leitura.
- Equipes dinâmicas de 1 a 50, data por seletor nativo e custo em moeda brasileira.
- Histórico com pesquisa por placa/contrato, filtros, detalhes e paginação.
- Modelos pendentes e equipamentos foram preservados conforme os dados fornecidos.
- Parado na Base está marcado como status inativo e não é oferecido como pessoa.
- Rascunhos permanecem durante a navegação, mas não após fechar o aplicativo ou sair. O envio exige conexão.
- A administração dos perfis e dos cadastros ocorre no painel/SQL do Supabase nesta versão.
- A compilação usa Expo SDK 57 e exige Expo Go compatível.

O passo a passo de uso e cadastro de acessos está em `../README.md`. Capturas das telas estão em `screenshots/`. Os caches do npm, EAS, Supabase CLI e React Native DevTools já foram preparados.
