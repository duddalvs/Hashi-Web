# Arquitetura tecnologias e pastas

O navegador roda uma aplicação React. Um processo Node serve a interface e a API Express. Express chama as funções PostgreSQL do Supabase e busca os PDFs no Storage. A lógica compartilhada com o aplicativo móvel está no banco; o web mantém validações adicionais e a apresentação.

```text
Navegador
  React + TypeScript + CSS + fontes + ícones
  fetch /api com cookie HttpOnly na mesma origem
       |
Servidor Node
  Express + validações Zod + controle de origem + Helmet
       |-- RPC com chave publicável e token Hashi
       |       Supabase PostgreSQL: public + private
       |
       |-- leitura autorizada com chave secreta
               Supabase Storage: hashi-crlv privado
```

O Hashi App acessa o mesmo banco por seu próprio código. Expo, React Native e EAS são tecnologias do aplicativo móvel, não dependências deste repositório web.

## Tecnologias e versões

| Tecnologia                   | Função                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Node.js                      | Executa o servidor e as ferramentas; mínimo declarado 22.12; ambiente conferido 24.12.0 |
| React e React DOM            | Componentes, estado e renderização                                                      |
| TypeScript                   | Tipagem; `strict`, alvo ES2022 e verificação sem emissão                                |
| Vite e plugin React          | Servidor de módulos em desenvolvimento e build da interface                             |
| Express                      | Rotas `/api`, cookies e servidor HTTP                                                   |
| tsx                          | Executa os fontes TypeScript do servidor em desenvolvimento e produção                  |
| Zod                          | Contratos de entrada, dados de RPC e validações                                         |
| cookie-parser e Helmet       | Cookies e cabeçalhos HTTP                                                               |
| dotenv                       | Carrega variáveis privadas do servidor                                                  |
| Lucide React                 | Ícones SVG                                                                              |
| Fontsource DM Sans e Manrope | Fontes variáveis empacotadas localmente                                                 |
| PostgreSQL e Supabase        | Dados, RPCs, permissões e Storage                                                       |
| node:test e Playwright       | Testes de regras/API e navegador                                                        |
| Prettier                     | Formatação                                                                              |

As faixas do `package.json` não são as versões exatas instaladas. Consulte [dependencias.json](anexos/dependencias.json) e conserve o [package-lock.json](../../package-lock.json). Use `npm ci`, não atualização indiscriminada de dependências, para reproduzir a resolução atual. O transporte usa `fetch`; não há SDK `supabase-js`, ORM, Tailwind ou biblioteca de gráficos no web.

## Árvore do projeto

```text
HashimotoWeb/
  .git/                         Histórico Git local
  .tools/                       Ferramentas temporárias, cache, logs e inventários privados
  dist/                         Interface compilada pelo Vite
  docs/                         Referências anteriores e esta documentação
    guia-completo/
      anexos/                   Inventários, esquema, políticas e contratos
  node_modules/                 Dependências instaladas
  public/
    favicon.svg                 Ícone público
  scripts/                      Iniciador, verificação remota e manutenção de CRLV
  server/                       API e acesso ao Supabase
  src/
    components/                 Telas e componentes reutilizáveis
    domain/                     Tipos, regras, filtros e contratos
    lib/                        Cliente HTTP e preferências do menu
  storage/
    veiculos/crlv/
      originais/                Cópias locais de CRLV, opcionais para o runtime
      outros-documentos/        CNH e ATPV-e, somente locais
      relatorios/               Inventários e evidências da organização e migração
  supabase/
    migrations/                 Quatro migrações próprias do web
    tests/                      Consultas e testes SQL
    .temp/                      Cache da CLI, quando presente
  test-results/                 Capturas, traces e resultados gerados
  tests/
    fixtures/                   PDF sintético para testes
    ui/                         Testes de navegador
  .env                          Configuração privada, fora do Git
  .env.example                  Modelo público de configuração
  .gitignore                    Exclusões do versionamento
  .npmrc                        Cache npm em .tools/npm-cache
  .prettierignore                Exclusões do formatador
  .prettierrc.json               Regras do formatador
  index.html                    Entrada do React e orientação para file://
  INICIAR.cmd                   Atalho Windows
  package.json                  Dependências e comandos
  package-lock.json             Resolução exata das dependências
  playwright.config.ts          Configuração dos testes de navegador
  README.md                     Apresentação e execução rápida
  tsconfig.json                 Configuração TypeScript
  vite.config.ts                Build, React e restrições do servidor de desenvolvimento
```

As subpastas internas de `node_modules`, `.git` e do cache npm são geradas pelas ferramentas; não são módulos escritos para o produto. O [inventário de arquivos](anexos/inventario-arquivos.json) lista os fontes, configurações, testes e documentos com tamanho e SHA-256. Não enumera cada arquivo de bibliotecas, segredos, PDFs ou caches.

## Arquivos de interface

| Arquivo                         | Responsabilidade                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                  | Monta React com StrictMode e importa fontes e CSS                                                 |
| `src/App.tsx`                   | Sessão, bootstrap, rotas hash, tema, filtros, diálogos, atualização, CSV, relatórios e composição |
| `src/styles.css`                | Todo o layout, cores, temas, tamanhos, interações e media queries                                 |
| `components/Login.tsx`          | Login, visibilidade de senha, recuperação e demonstração                                          |
| `components/Overview.tsx`       | Indicadores, gráficos e últimos envios                                                            |
| `components/ServiceMenu.tsx`    | Busca/categorias, cards, favoritos e recentes                                                     |
| `components/DayView.tsx`        | Agrupamento de equipes por dia e contrato                                                         |
| `components/Filters.tsx`        | Campos básicos/avançados, chips, limpeza e erros de intervalo                                     |
| `components/RecordsTable.tsx`   | Linhas, ordenação por data, paginação e ações                                                     |
| `components/EntryForm.tsx`      | Criar/editar registro ou manutenção e sugerir último veículo                                      |
| `components/Catalog.tsx`        | Busca e apresentação de catálogos; carrega CRLVs na aba de veículos                               |
| `components/VehicleCrlv.tsx`    | Escolha de versão, visualização e download do PDF                                                 |
| `components/AdminForms.tsx`     | Criação administrativa de cadastros                                                               |
| `components/UserManagement.tsx` | Listagem, criação de usuários e redefinição de senha                                              |
| `components/ui.tsx`             | Marca textual, seletores pesquisáveis, campos, modal, estados vazios e carregamento               |
| `domain/models.ts`              | Perfil, catálogos, histórico e tipos de formulários                                               |
| `domain/rules.ts`               | Datas, BRL, pesquisa, validação operacional e conversão para RPC                                  |
| `domain/filters.ts`             | Filtros por envio/equipe e CSV                                                                    |
| `domain/admin.ts`               | Contratos de usuários, senhas e novos cadastros                                                   |
| `domain/crlv.ts`                | Metadados mínimos e validação do arquivo privado                                                  |
| `lib/api.ts`                    | `fetch`, mensagens, expiração de sessão e download PDF                                            |
| `lib/navigation.ts`             | Serviços, categorias e preferências por usuário                                                   |

## Servidor e scripts

| Arquivo                           | Responsabilidade e dependências                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `server/index.ts`                 | Carrega `.env`, cria Express, inicia Vite ou serve `dist`; escuta em `127.0.0.1`                                    |
| `server/app.ts`                   | API, sessão, origem, perfil, validações e carregamento paginado do histórico                                        |
| `server/rpc.ts`                   | POST REST de RPCs, timeout de 25 s e tradução de erros                                                              |
| `server/crlv.ts`                  | Leitura privada do Storage e conferência de integridade                                                             |
| `server/demo.ts`                  | Dados e operações fictícias isoladas por sessão em memória                                                          |
| `scripts/open-hashi.cjs`          | Iniciador Windows, verificação de porta, logs, abertura do navegador e acompanhamento do processo                   |
| `scripts/check-remote.ts`         | Testa assinaturas com token inválido e bloqueio de leitura das tabelas                                              |
| `scripts/comparar-crlv.mjs`       | Compara nomes de documentos com snapshot de placas; não detecta histórico de chassi                                 |
| `scripts/preparar-crlv.mjs`       | Confere a leitura revisada e hashes locais, prepara organização/SQL; `--apply` move os arquivos previstos           |
| `scripts/migrar-crlv-storage.mjs` | Envia/confronta objetos a partir do inventário histórico e dos originais locais; `--upload` permite enviar ausentes |

Os scripts de importação CRLV dependem dos inventários em `.tools` e `storage/veiculos/crlv/relatorios`. Eles não são um formulário de upload e não são necessários para abrir documentos já enviados. Copiar apenas esses scripts para outra máquina não transporta os inventários privados de que dependem.

## Pastas geradas e privadas

| Pasta ou arquivo                                          | Copiar para executar?                 | Observação                                                                              |
| --------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| `src`, `server`, `public`, configurações, `package*.json` | Sim                                   | Base do sistema                                                                         |
| `scripts/open-hashi.cjs` e `INICIAR.cmd`                  | Para o iniciador                      | `npm run dev` pode ser usado diretamente                                                |
| `docs`, `supabase`, `tests`, demais scripts               | Para entregar o projeto completo      | Conhecimento, migrações e manutenção                                                    |
| `.env`                                                    | Configurar privadamente               | Nunca colocar num repositório público                                                   |
| `node_modules`                                            | Não                                   | Recriar com `npm ci`                                                                    |
| `dist`                                                    | Gerar ou transportar no deploy        | Recriar com `npm run build`; não substitui o servidor                                   |
| `.tools`                                                  | Normalmente não                       | Contém `npm-cache`, ambiente Python da leitura de PDFs, logs e verificações temporárias |
| `storage/veiculos/crlv/originais`                         | Não para abrir/baixar na aplicação    | Cópia de segurança e insumo de scripts históricos                                       |
| `storage/veiculos/crlv/outros-documentos`                 | Se desejar preservar esses documentos | Não foram enviados ao Storage                                                           |
| `test-results`, `playwright-report`                       | Não                                   | Evidências geradas, algumas pastas só aparecem após executar testes                     |
| `.git`                                                    | Opcional para rodar                   | Necessário para conservar o histórico Git local                                         |

## Desenvolvimento e produção

Em desenvolvimento, Express integra o Vite como middleware e o navegador recebe fontes transformados. Em produção, Express serve `dist`, mas o próprio backend continua sendo executado por `tsx server/index.ts --production`; não há um bundle separado do servidor.

`npm run build` executa TypeScript e Vite, sem construir APK. O servidor de produção exige origem HTTPS e cookie seguro. A ligação com proxy, processo persistente e domínio precisa ser configurada na hospedagem. A configuração atual só escuta em loopback; isso precisa ser considerado se o destino for um contêiner com proxy externo ao contêiner.
