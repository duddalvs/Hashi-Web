# hashi

Sistema web de gestão de frota integrado ao mesmo Supabase do Hashi App. React, TypeScript e Vite na interface; Express na camada de servidor. Identidade em laranja `#ff6200` e azul `#0b2c44`, com marca em texto, painel escuro e opção de tema claro.

**Documentação completa:** [guia do Hashi Web](docs/guia-completo/README.md), com funcionalidades, acessos, arquitetura, todas as tabelas do Supabase, API, design, CRLVs e instruções de clonagem e publicação. Inventário atualizado em 03/10/2026.

## Executar

Requer Node 22.12 ou superior. Ambiente usado na entrega: Node 24.12.

```powershell
npm.cmd ci
Copy-Item .env.example .env # somente se .env ainda não existir
npm.cmd run dev
```

Abra **http://localhost:3000**. Para abrir com dois cliques, use **`INICIAR.cmd`**: ele inicia o servidor, aguarda ficar disponível e abre o navegador. **Mantenha a janela do iniciador aberta enquanto usar o sistema; pode minimizá-la.** Fechar essa janela ou pressionar `Ctrl+C` encerra o servidor. O iniciador acompanha o processo e mostra erros na própria janela; os logs também ficam em `.tools/hashi-server.log`. Se o hashi já estiver rodando, reutiliza o servidor existente: mantenha aberta a janela que o iniciou. Nenhum serviço ou tarefa de inicialização automática é instalado: depois de reiniciar o computador, abra `INICIAR.cmd` novamente. Nesta máquina, o `.env` já está configurado com a URL e a chave publicável fornecidas em `docs/ACESSO-BANCO-VISUALIZACOES.md`.

Se aparecer `ERR_CONNECTION_REFUSED`, abra `INICIAR.cmd` diretamente na pasta extraída e aguarde a mensagem **Servidor pronto** antes de atualizar o navegador. Se a janela mostrar um erro, ela ficará aberta para leitura. Um servidor iniciado por uma ferramenta temporária de desenvolvimento pode encerrar quando essa ferramenta termina; abra o iniciador pelo Explorador de Arquivos para acompanhar a execução.

**Não abra o `index.html` como um arquivo local.** Ele é a entrada do código React/TypeScript, que depende do servidor para carregar as telas e a API. Ao abrir o HTML diretamente, aparece uma orientação com um botão para o endereço local. Para acompanhar o servidor pelo terminal, continua disponível `npm.cmd run dev`.

Use **o mesmo usuário e senha do Hashi App**. O sistema chama `autenticar_usuario` e preserva os perfis existentes. As operações realizadas com uma conta real consultam e alteram o banco compartilhado com o aplicativo.

Em desenvolvimento, **Explorar demonstração** abre exemplos isolados, em memória, identificados por uma faixa. Não faz chamadas ao Supabase. Os exemplos são descartados ao sair, reiniciar o servidor ou expirar a sessão de uma hora. A demonstração é desabilitada em produção.

## Funcionalidades

- Visão geral com indicadores, equipes dos últimos sete dias, distribuição por contrato e últimos envios. Indicadores respeitam a visibilidade da conta.
- Registro de equipes com duas abas: **Visão por dia**, com dias expansíveis, agrupamento por contrato e detalhes ao clicar; **Consulta com filtros**, com tabela, ordenação e paginação.
- Filtros combináveis por data operacional, contrato, responsável/motorista, placa, modelo, tipo de veículo, serviço, motorista não identificado, faixa de custo, quantidade de equipes, data de envio, observação, categoria e busca por texto/ID, conforme os campos de cada operação.
- Criação e edição de registros com 1 a 50 equipes, sem repetir responsáveis ou veículos no mesmo envio; seleção explícita do último veículo como sugestão.
- Manutenção com valor em centavos, zero permitido, observação opcional de 40 caracteres Unicode e motorista não identificado gravado como `NULL`.
- Datas futuras bloqueadas no seletor, na validação compartilhada do navegador/servidor e pelas RPCs existentes. A data limite considera `America/Sao_Paulo`.
- Detalhes, edição com versão, aviso de conflito e exclusão definitiva com confirmação para administradores.
- Histórico, relatório de custos por contrato e CSV dos resultados filtrados, com proteção contra fórmulas de planilha.
- Consulta dos catálogos de veículos, funcionários e contratos; administradores também criam novos cadastros nas respectivas abas. Equipamentos aceitam identificação própria. Novos itens ficam disponíveis nos formulários e no Hashi App.
- Nos cards de veículos, **Visualizar** abre o CRLV em outra aba e **Baixar CRLV** salva o PDF com placa e ano. Quando há documentos anteriores, um seletor permite escolher a versão. O indicador “Ativo” foi retirado desses cards; veículos sem arquivo mostram “CRLV não disponível”.
- Aba **Usuários**, exclusiva de administradores: pesquisa, listagem de contas ativas/inativas, criação com nome, sobrenome, login e perfil, e definição de nova senha sem código adicional. Senhas existentes não são exibidas: o banco armazena hashes bcrypt. O botão de visualizar senha revela apenas o valor digitado no formulário.
- Recuperação por código do administrador, visibilidade da senha, encerramento e restauração de sessão.
- Telas de trabalho ocupam toda a largura. O hambúrguer na barra superior abre o **Menu de serviços**: somente nessa tela aparece a lateral com busca e categorias (Todos os serviços, Principal, Operação, Cadastros e Gestão). Selecionar uma categoria filtra os cards à direita, mantendo favoritos e serviços vistos por último. Ao abrir um serviço, a lateral desaparece. A logo **hashi** leva à **Análise geral**, também disponível como card. O botão de fechar o menu retorna à tela anterior.
- Favoritos e os seis últimos serviços acessados são salvos neste navegador, por usuário. O menu respeita o perfil de acesso; **Usuários** aparece somente para administradores.
- Layout responsivo, tema claro/escuro, navegação por teclado nos seletores e diálogos com foco contido. Conta, ajuda e tema ficam na barra superior.

## Acesso e integração

| Perfil        | Acesso                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| Funcionário   | Criar, consultar e editar os próprios envios.                                     |
| Administrador | Criar, consultar e editar os envios de todas as contas; excluir após confirmação. |

O token da autenticação própria fica em cookie `HttpOnly`, `SameSite=Strict`, com validade retornada pelo banco. Não vai para localStorage nem para o JSON de login. O servidor insere `p_token` nas RPCs. As respostas da API usam `Cache-Control: no-store`; mutações exigem origem igual a `APP_ORIGIN` e JSON. Em produção, o cookie exige HTTPS/`Secure`. As fontes são servidas pelo próprio sistema.

O banco permanece responsável por conferir sessão, atividade, autoria, perfil e versão a cada operação. As RPCs usam a chave publicável e a sessão compartilhada. Para buscar os PDFs privados, somente o servidor usa `SUPABASE_SECRET_KEY`, configurada no `.env` e nunca enviada ao navegador. A migração aditiva `supabase/migrations/202609300004_web_admin.sql` habilita a gestão pelo web com verificação de administrador no servidor e no banco, preservando os dados e as funções existentes. Veja [Administração pelo web](docs/ADMINISTRACAO-WEB.md).

Para essas ações, entre com uma conta de perfil **admin**. Não há nova autenticação nem código de recuperação para o administrador já conectado. Ao definir uma senha, todas as sessões e autorizações de recuperação da conta alterada são revogadas. Se alterar a própria senha, o administrador precisa entrar novamente. O aplicativo continua usando seu fluxo de recuperação por código; a senha da conta continua compartilhada entre web e aplicativo. Cadastrar um funcionário não cria automaticamente uma conta de usuário.

`buscar_historico` é percorrida em páginas de 100 até completar os resultados autorizados, antes de filtrar, calcular indicadores e exportar. O custo não é multiplicado pelo número de equipes. Filtros de motorista e placa devem coincidir **na mesma equipe**. A API atual não fornece autor, versão ou data de alteração no histórico: não há filtro de autor inventado. A versão é obtida ao abrir a edição.

Atualização manual, após salvar/excluir e ao retornar à janela após 30 segundos. Não há assinatura Realtime. Erros de recarga mantêm os dados anteriores e mostram aviso; falha ao encerrar a sessão é informada, sem declarar revogação bem-sucedida.

## Estrutura

```text
src/
  App.tsx               Navegação, sessão, estado e composição das telas
  components/           Login, formulários, filtros, tabelas, dias e painéis
  domain/               Tipos, schemas, validação, filtros e CSV
  lib/api.ts            Comunicação com o servidor, erros e expiração
  styles.css            Layout, temas e responsividade
server/
  app.ts                API, cookies, origem, permissões e paginação remota
  rpc.ts                Transporte REST das RPCs Supabase
  crlv.ts               Leitura dos PDFs privados no Supabase Storage
  demo.ts               Exemplos isolados para desenvolvimento
  index.ts              Servidor de desenvolvimento e produção
tests/                  Regras, API e fluxos Playwright
scripts/check-remote.ts Verificação remota com sessão deliberadamente inválida
docs/                   Documentos originais usados como referência
storage/veiculos/crlv/  Backup local e relatórios (fora do Git e do acesso público)
  originais/            CRLVs com nomes padronizados e conteúdo preservado
  outros-documentos/    CNH e ATPV-e identificados na conferência
  relatorios/           Inventário, nomes anteriores, vínculos e pendências
```

Foram lidos os sete Markdown originais da pasta `docs`. Em conflitos históricos, foram priorizados `HASHI-APP-INTEGRACAO-HASH-WEB.md` (revisão de 25/09) e `ACESSO-BANCO-VISUALIZACOES.md` (29/09), com conferência dos contratos nos fontes do aplicativo existente. A solicitação inicial antiga com Supabase Auth não corresponde à autenticação atual.

### Documentos CRLV

Em 02/10/2026, os 151 PDFs recebidos foram lidos: 149 são CRLVs, um é CNH e um é ATPV-e. As cópias locais dos CRLVs ficam em `storage/veiculos/crlv/originais`, no padrão `CRLVDigital_PLACA_ANO.pdf`; 51 nomes foram corrigidos. O ano corresponde ao campo **DATA** indicado pelo usuário, não ao ano de fabricação/modelo. A CNH e a ATPV-e ficam em `outros-documentos`. Nenhum PDF foi regravado: os 151 hashes SHA-256 continuam iguais aos do inventário inicial.

A migration `202610020001_veiculo_crlv.sql` criou `public.veiculo_documentos` e duas RPCs que validam a sessão compartilhada. A migration `202610020003_crlv_vinculo_minimo.sql` reduz a tabela de **17 para três campos: `id`, `veiculo_id` e `storage_path`**. Ela guarda somente a associação ao PDF e permite mais de um documento por veículo. Modelo, chassi, datas e demais informações permanecem nos próprios PDFs, sem duplicação nessa tabela. A placa e o ano exibidos vêm do nome do arquivo; o hash vem do caminho e o tamanho é consultado no Storage. O card mostra o ano, as versões disponíveis e os botões Visualizar/Baixar.

Existem **75 documentos vinculados a 73 veículos**, incluindo dois CRLVs antigos cuja identidade foi confirmada por chassi e placa anterior durante a leitura dos PDFs. Os 149 registros de vínculo foram preservados, incluindo 74 com `veiculo_id` nulo, cujas placas não constam no cadastro. Os sete veículos cadastrados sem CRLV identificado são `KNC1076`, `LMP9H12`, `LMP9H23`, `LRJ7G35`, `LRJ7G95`, `LRJ9B37` e `LUL8A32`; há também dois equipamentos. Os cadastros existentes, inclusive suas placas e modelos, não foram alterados. Os documentos antigos continuam ligados ao mesmo ID do veículo mesmo quando a placa mudou.

Funcionários e administradores autenticados podem consultar os CRLVs dos veículos ativos. A API confere sessão e vínculo no banco a cada abertura/download e confere tamanho e hash antes de entregar o PDF. Documentos sem vínculo, CNH e ATPV-e não aparecem nesses cards. A demonstração não expõe documentos reais. A leitura direta da nova tabela é bloqueada, e as pastas `storage` e `.tools` não são servidas pelo Vite.

**Os 149 PDFs completos ficam no Supabase Storage, no bucket privado `hashi-crlv`.** A tabela `veiculo_documentos` mantém o vínculo e o caminho de cada arquivo; a migration `202610020002_crlv_storage.sql` adiciona esses campos e bloqueia acesso direto ao bucket por clientes. A API autoriza a sessão e o veículo antes de buscar o PDF na nuvem. Visualização e download não leem a pasta local nem têm fallback para ela. As cópias em `originais` são apenas backup e podem ser removidas sem interromper esses recursos. A CNH e a ATPV-e continuam somente locais e não fazem parte dessa migração.

Para publicar ou executar em outra máquina, configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` no ambiente do servidor; não é necessário copiar os PDFs. A chave secreta é exclusiva do servidor, fica fora do Git e não deve receber o prefixo `VITE_`. Depois de atualizar o servidor, reinicie `INICIAR.cmd`. O armazenamento segue a separação entre [arquivos no Storage e metadados no PostgreSQL](https://supabase.com/docs/guides/storage).

A migração para a nuvem conferiu tamanho e SHA-256 dos 149 arquivos após o upload, totalizando 14.968.558 bytes. O relatório está em `storage/veiculos/crlv/relatorios/migracao-storage.json`. `node scripts/migrar-crlv-storage.mjs --upload` usa o inventário local `.tools/crlv-storage-preflight.json` e os originais para enviar arquivos ausentes, sem sobrescrever objetos existentes; sem `--upload`, apenas confere as cópias. Esse script de manutenção precisa dos originais; a aplicação em execução não precisa.

Os relatórios da leitura original estão em `relatorios/conferencia-conteudo.csv`, com totais em `resumo-conteudo.json`, nomes anteriores/destinos em `organizacao-aplicada.json` e confirmação da importação em `importacao-banco.json`. O inventário anterior à redução da tabela está em `antes-simplificacao.json`; é um arquivo de conferência local, não uma dependência da aplicação. `node scripts/preparar-crlv.mjs` reconfere hashes e prepara o SQL com os três campos de vínculo a partir da leitura já revisada e do snapshot local `.tools/crlv-preflight.json`; esse SQL exige as três migrations e os PDFs enviados ao Storage. `--apply` efetiva a organização local, sem sobrescrever destinos. O script não executa SQL nem refaz a leitura dos PDFs. `node scripts/comparar-crlv.mjs` continua disponível para comparação apenas por nomes e não considera vínculos históricos por chassi. Nenhum dos comandos atualiza o snapshot do banco.

A validação SQL em `supabase/tests/crlv-validation.sql` deve ser executada após as três migrations de CRLV, dentro de transação com `ROLLBACK`: confere os três campos, contagens, associação às placas, perfis admin/funcionário, sessões inválidas, veículo/usuário inativo, permissões e presença dos objetos no bucket privado. A migration de simplificação também compara todos os IDs, veículos associados e caminhos antes/depois para impedir perda de vínculos. A conversão do caminho gerado para um campo normal preserva os valores usando [DROP EXPRESSION do PostgreSQL](https://www.postgresql.org/docs/current/sql-altertable.html). As RPCs seguem a autenticação própria existente, com `security definer`, `search_path` vazio e validação da sessão, conforme as [orientações de funções do Supabase](https://supabase.com/docs/guides/database/functions).

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:ui
npm.cmd run build
npm.cmd run check:remote
```

Playwright usa o Chrome instalado. `test:ui` reutiliza um servidor local em 3000 ou o inicia; os fluxos utilizam demonstração e respostas simuladas, sem gravar no banco real. Os testes não leem senhas existentes. Capturas ficam em `test-results/`.

Validação local em 30/09/2026: TypeScript e build aprovados, **24 testes de domínio/API** e **10 fluxos de navegador** aprovados (sete existentes e três de administração). A migração administrativa passou em PostgreSQL local/PGlite e no Supabase com dados temporários revertidos; foi aplicada e registrada no banco compartilhado. A conferência HTTP reconheceu 14 RPCs, rejeitou sessões inválidas e confirmou a negativa de leitura anônima nas oito tabelas. As capturas de usuários em desktop e celular foram inspecionadas. Para testar em uma porta separada no Windows: `$env:HASHI_TEST_PORT='3012'; npm.cmd run test:ui`.

Validação dos CRLVs em 02/10/2026, repetida após reduzir a tabela: **31 testes de domínio/API**, **três fluxos de navegador**, TypeScript e build aprovados. As migrations de Storage e simplificação foram aplicadas e registradas com 149 objetos presentes; os testes SQL de perfis e bloqueios foram revertidos antes da confirmação das migrations. Todos os IDs, veículos associados, caminhos e objetos foram comparados antes/depois e permaneceram iguais. Um teste HTTP com RPC simulada e os três campos atuais baixou e abriu um PDF real pelo Storage, sem ler arquivos PDF locais, e conferiu seu SHA-256. O bucket recusou acesso público e anônimo. O servidor foi reiniciado e os fluxos de navegador passaram; o teste não usou uma senha pessoal. Evidências em `relatorios/simplificacao-aplicada.json`, `relatorios/depois-simplificacao.json` e `relatorios/validacao-vinculo-minimo.json`.

`check:remote` usa a configuração pública e um token deliberadamente inválido para conferir resolução das 16 assinaturas e bloqueio de acesso. Também confere a negativa de leitura anônima nas nove tabelas, sem consultar conteúdo. Não cria usuários, não autentica pessoas e não altera envios. Essa verificação **não comprova login real ou um ciclo de escrita Web ↔ APK**.

## Publicação

```powershell
npm.cmd run build
# Defina no ambiente do servidor:
# APP_ORIGIN=https://seu-dominio
# COOKIE_SECURE=true
# NODE_ENV=production
# SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY (somente no servidor)
npm.cmd start
```

O processo Node serve a interface compilada e `/api` na mesma origem. Use um proxy HTTPS para a porta local 3000, ajuste `APP_ORIGIN` ao endereço público e mantenha as variáveis no servidor. O processo recusa produção sem HTTPS e cookie seguro. Não basta publicar somente `dist` em uma hospedagem estática, pois a sessão e as operações precisam do servidor. O serviço não foi publicado em domínio externo nesta entrega.

## Limites conhecidos

- Login com uma conta real e conferência operacional Web ↔ APK precisam ser validados pelo responsável; os testes automatizados não usam senhas pessoais nem escrevem registros na produção.
- O histórico completo em memória atende a base atual, mas volumes elevados exigirão RPC com filtros/paginação no servidor. Há limite explícito de 100 mil itens; o sistema retorna erro em vez de mostrar totais parciais. A paginação por offset não é um snapshot transacional se houver alterações simultâneas.
- O web não oferece edição, exclusão ou ativação/inativação de contas e catálogos nesta revisão; inclui criação de cadastros, criação/listagem de usuários e redefinição de senhas. A administração fica no web. O fluxo de recuperação do aplicativo não foi alterado.
- Duplicidades dentro de um registro são bloqueadas na UI e no servidor Web. As RPCs compartilhadas têm a limitação de integridade já descrita na documentação original; não foi aplicada migração nesta entrega.
- Uma referência inativada não é substituída silenciosamente durante edição: a interface pede a seleção de uma referência ativa.
- Sem fila offline ou recuperação de registros excluídos. Rascunhos são mantidos somente enquanto o formulário está aberto; fechar com alterações solicita descarte.

Referências de implementação: [API Express](https://expressjs.com/en/5x/api/), [integração Vite](https://vite.dev/guide/backend-integration) e [RPCs Supabase](https://supabase.com/docs/reference/javascript/rpc).
