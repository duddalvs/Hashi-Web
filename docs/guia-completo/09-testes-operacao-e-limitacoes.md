# Testes operação e limitações

As verificações precisam ser interpretadas pelo que realmente testam. Um build válido não comprova login real; uma RPC que rejeita token inválido não comprova o ciclo de cadastro; documentação de restore não significa que um novo projeto já foi restaurado.

## Comandos do projeto

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:ui
npm.cmd run check:remote
```

| Comando ou arquivo                   | Cobertura                                                                  | Acesso à produção                                                 |
| ------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `typecheck`                          | Tipos de aplicação, servidor, scripts e testes                             | Não                                                               |
| `npm test`                           | `node:test`: regras, filtros, API, sessão, administração e CRLV            | RPC/Storage simulados                                             |
| `build`                              | TypeScript e geração de `dist`                                             | Não grava no banco                                                |
| `tests/ui/app.spec.ts`               | Fluxos de interface, navegação, formulários e demonstração                 | Dados fictícios                                                   |
| `tests/ui/admin.spec.ts`             | Administração na demonstração e negação de acesso                          | Dados fictícios                                                   |
| `tests/ui/crlv.spec.ts`              | Cards, versão antiga, abrir/baixar, falhas e nova tentativa                | Respostas simuladas e PDF sintético                               |
| `check:remote`                       | 16 assinaturas rejeitam token inválido; nove tabelas negam leitura anônima | Consulta a API, sem conta real nem criação de registros           |
| `supabase/tests/web-admin-*.sql`     | Inventário e validação administrativa                                      | O arquivo de validação deve estar em transação revertida          |
| `supabase/tests/crlv-validation.sql` | Vínculos, campos mínimos, perfis, acesso e presença no Storage             | Cria dados temporários dentro da transação; executar com rollback |

Os testes SQL de CRLV incluem contagens da carga de 149 documentos e referências históricas de placas. Eles não são uma prova genérica para uma base vazia ou uma frota modificada. Leia o arquivo antes de executar e adapte a expectativa ao snapshot correto.

## Configuração do navegador de testes

Playwright usa o Chrome instalado, modo headless, um worker, viewport padrão 1440 × 1000, timeout de 45 segundos e espera de asserção de oito segundos. Reutiliza um servidor em `localhost:3000` ou inicia `npm.cmd run dev`. Captura screenshots em falhas e conserva trace em falhas; os testes CRLV também geram capturas específicas.

Para uma porta separada no Windows:

```powershell
$env:HASHI_TEST_PORT = '3012'
npm.cmd run test:ui
```

O comando do servidor de testes é `npm.cmd`, específico do Windows. Para rodar essa configuração em Linux/macOS, ajuste `playwright.config.ts` para o comando disponível e providencie o navegador esperado; essa portabilidade não é automática na configuração atual.

## Evidências e datas

| Data       | Evidência                                                                                           | Limite                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 02/10/2026 | 31 testes de domínio/API, três fluxos CRLV, TypeScript e build aprovados após simplificação         | Não é resultado de uma nova execução de toda a suíte UI em 03/10                                         |
| 02/10/2026 | 149 PDFs enviados e conferidos por tamanho e SHA-256                                                | Corresponde ao inventário da migração                                                                    |
| 02/10/2026 | Todos os vínculos e objetos iguais antes/depois da redução para três campos                         | Não houve remoção de PDFs                                                                                |
| 02/10/2026 | Teste HTTP abriu/baixou PDF real do Storage sem leitura local; autorização RPC simulada nesse teste | Perfis reais das funções foram verificados separadamente em SQL com rollback; não utilizou senha pessoal |
| 03/10/2026 | Inventário remoto de estrutura e contagens atualizado para esta documentação                        | Somente leitura; não é backup de dados                                                                   |
| 03/10/2026 | Conferência de fontes, lockfile, CSS, links e anexos deste guia                                     | Não equivale a restore num segundo projeto                                                               |

Relatórios anteriores ficam em `storage/veiculos/crlv/relatorios`, inclusive `migracao-storage.json`, `simplificacao-aplicada.json`, `depois-simplificacao.json` e `validacao-vinculo-minimo.json`. A documentação copia somente inventários estruturais adequados para o guia, não credenciais.

## Rotina operacional

No computador local, abra `INICIAR.cmd` e conserve a janela aberta; após reiniciar o computador, inicie de novo. O launcher pode reutilizar o servidor existente, portanto alterações no backend só entram depois de reiniciar o processo que realmente escuta a porta. O HMR do Vite não substitui a reinicialização do Express.

Em produção, acompanhe processo Node, proxy HTTPS, logs e disponibilidade do Supabase. Faça backup privado de dados e dos objetos do Storage. Não confunda `.git` com backup de PDFs ou de banco. Não existe rotina agendada de backup implementada no repositório.

## Diagnóstico por sintoma

| Sintoma                                              | Verificar                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Página em branco ao abrir `index.html`               | Abrir o servidor HTTP, não `file://`                                                                       |
| `ERR_CONNECTION_REFUSED`                             | Processo ativo, porta 3000, janela do launcher e `.tools/hashi-server.log`                                 |
| Página abre, mas login retorna origem não autorizada | `APP_ORIGIN` precisa corresponder ao navegador; `localhost` e `127.0.0.1` são origens diferentes           |
| Porta ocupada ou servidor antigo                     | Identificar processo da porta; não encerrar processos desconhecidos; reiniciar o servidor Hashi correto    |
| Banco precisa ser configurado                        | URL, chave publicável com prefixo aceito e ambiente do servidor                                            |
| CRLV precisa ser configurado                         | Chave secreta do mesmo projeto, disponível somente no servidor, seguida de reinício                        |
| Consulta de CRLV falha                               | Migration atual, RPCs, sessão e vínculo; usar Tentar novamente na tela                                     |
| CRLV ausente                                         | Verificar `veiculo_id` e existência do arquivo no caminho cadastrado                                       |
| PDF falha por integridade                            | Conferir arquivo, tamanho e hash; não ignorar a checagem                                                   |
| Usuários não aparece no menu                         | Perfil deve ser `admin` ativo; funcionário não tem acesso                                                  |
| Atualização administrativa não instalada             | Assinatura de RPC `web_*` ausente; verificar estado do banco, sem reaplicar migrations indiscriminadamente |
| Sessão expirada                                      | Entrar novamente; verificar troca de senha, desativação, prazo e cookie seguro                             |
| Tipo de manutenção ausente                           | Cadastro ativo no banco; não há editor desse catálogo na tela                                              |
| CSV vazio                                            | Filtros e visibilidade da conta; não indica necessariamente banco vazio                                    |
| Teste UI falha só no conjunto completo               | Reproduzir em porta/processo isolado e conferir estado da demonstração e timeouts                          |

Para verificar conectividade, testar `localhost` e `127.0.0.1` pode ajudar a separar resolução de nome e escuta IPv4. Isso não dispensa alinhar a origem para login e mutações.

## Limitações confirmadas

- Sem fila offline, recuperação de registros apagados ou persistência de rascunhos após fechar/recarregar a aplicação.
- Sem assinatura Realtime; os dados são recarregados nos eventos documentados.
- Histórico completo em memória, consultas por offset e limite de 100 mil itens; não existe snapshot transacional entre todas as páginas quando há gravações concorrentes.
- Filtros por nomes/placas dependem do contrato atual de histórico, não de IDs de catálogo em todas as opções.
- As funções de histórico com autor e filtros múltiplos existem no banco compartilhado, mas o web ainda não as usa.
- Sem edição/exclusão/ativação de contas ou catálogos pelo web; a gestão disponível é criação e redefinição de senha.
- Sem upload, associação automática de novos PDFs, OCR contínuo ou edição de vínculo documental pela interface.
- Duplicidade de responsável/veículo dentro de um envio é barrada no web; as funções privadas e constraints da base não impõem toda essa mesma regra.
- A API de login permite entrada de senha maior que 72 bytes, mas o banco a recusa; criação e redefinição validam esse limite explicitamente. A validação de recuperação usa o comprimento JavaScript para o mínimo, enquanto a criação administrativa conta caracteres Unicode e o banco usa seu próprio `length`.
- A demonstração é em memória e isolada por sessão; não substitui validação com conta real.
- Não há servidor Windows instalado como serviço, Dockerfile, domínio de produção, pipeline CI/CD ou restore completo de outro projeto validado nesta entrega.

## Como manter o guia atualizado

Ao alterar uma tela, rota, variável, regra ou tabela, atualize o capítulo correspondente. Recolha a estrutura com [consultar-estrutura.sql](anexos/consultar-estrutura.sql), sem consultar linhas de credenciais. Registre a data e se a verificação foi no código, por teste simulado ou no serviço real.

Use o `package-lock.json` para versões, `src/styles.css` para o visual e o catálogo PostgreSQL para schema/permissões. Não transforme uma contagem histórica em fato atual. Nunca cole chaves, senhas, tokens ou dumps privados de contas nos documentos versionados.
