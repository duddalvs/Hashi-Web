# hashi

Sistema web de gestão de frota integrado ao mesmo Supabase do Hashi App. React, TypeScript e Vite na interface; Express na camada de servidor. Identidade em laranja `#ff6200` e azul `#0b2c44`, com marca em texto, painel escuro e opção de tema claro.

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

O banco permanece responsável por conferir sessão, atividade, autoria, perfil e versão a cada operação. A aplicação em execução usa somente a chave publicável e RPCs; não recebe credenciais administrativas do banco. A migração aditiva `supabase/migrations/202609300004_web_admin.sql` habilita a gestão pelo web com verificação de administrador no servidor e no banco, preservando os dados e as funções existentes. Veja [Administração pelo web](docs/ADMINISTRACAO-WEB.md).

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
  demo.ts               Exemplos isolados para desenvolvimento
  index.ts              Servidor de desenvolvimento e produção
tests/                  Regras, API e fluxos Playwright
scripts/check-remote.ts Verificação remota com sessão deliberadamente inválida
docs/                   Documentos originais usados como referência
```

Foram lidos os sete Markdown originais da pasta `docs`. Em conflitos históricos, foram priorizados `HASHI-APP-INTEGRACAO-HASH-WEB.md` (revisão de 25/09) e `ACESSO-BANCO-VISUALIZACOES.md` (29/09), com conferência dos contratos nos fontes do aplicativo existente. A solicitação inicial antiga com Supabase Auth não corresponde à autenticação atual.

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

`check:remote` usa a configuração pública e um token deliberadamente inválido para conferir resolução das assinaturas e bloqueio de acesso. Também confere a negativa de leitura anônima nas oito tabelas, sem consultar conteúdo. Não cria usuários, não autentica pessoas e não altera envios. Essa verificação **não comprova login real ou um ciclo de escrita Web ↔ APK**.

## Publicação

```powershell
npm.cmd run build
# Defina no ambiente do servidor:
# APP_ORIGIN=https://seu-dominio
# COOKIE_SECURE=true
# NODE_ENV=production
# SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY
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
