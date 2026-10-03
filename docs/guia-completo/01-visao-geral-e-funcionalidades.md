# Funcionalidades do Hashi Web

O sistema organiza a alocação de responsáveis e veículos por contrato, manutenções e custos, histórico de envios, cadastros, contas de acesso e CRLVs. O perfil determina quais registros operacionais são retornados pelo banco. Os catálogos compartilhados não são limitados ao autor de um envio.

## Navegação e serviços

A navegação usa o fragmento da URL, no formato `/#/equipes`; não usa React Router. O estado é coordenado em [App.tsx](../../src/App.tsx). A relação de serviços está em [navigation.ts](../../src/lib/navigation.ts).

| Categoria | Serviço             | Rota              | Perfil                                   |
| --------- | ------------------- | ----------------- | ---------------------------------------- |
| Principal | Análise geral       | `/#/inicio`       | Admin e funcionário                      |
| Operação  | Registro de equipes | `/#/equipes`      | Ambos                                    |
| Operação  | Manutenções         | `/#/manutencoes`  | Ambos                                    |
| Operação  | Histórico de envios | `/#/historico`    | Ambos                                    |
| Cadastros | Veículos            | `/#/veiculos`     | Ambos; criação somente admin             |
| Cadastros | Funcionários        | `/#/funcionarios` | Ambos; criação somente admin             |
| Cadastros | Contratos           | `/#/contratos`    | Ambos; criação somente admin             |
| Cadastros | Usuários            | `/#/usuarios`     | Admin                                    |
| Gestão    | Relatórios e custos | `/#/relatorios`   | Ambos, dentro da visibilidade dos envios |
| Navegação | Menu de serviços    | `/#/menu`         | Ambos                                    |

O hambúrguer abre o menu. Somente nessa tela aparece a coluna lateral com busca e categorias. A área principal mostra cards, favoritos e serviços vistos por último. Clicar em um card abre a funcionalidade usando a largura da tela. Fechar o menu retorna ao último serviço; clicar na marca `hashi.` leva à Análise geral.

Favoritos iniciam com todos os serviços disponíveis e podem ser alterados individualmente. Os seis serviços mais recentes e os favoritos ficam no navegador, separados por ID do usuário. O menu oculta Usuários para funcionário, mas a proteção administrativa também existe na API e nas funções do banco.

## Entrada e conta

A página inicial sem sessão oferece usuário e senha, mostrar ou ocultar senha e recuperação com código. Quando habilitada no desenvolvimento, há demonstração isolada. Após o login, o servidor carrega perfil, catálogos e histórico autorizado. Conta, tema, ajuda e saída ficam na barra superior.

Não há inscrição pública nem login por e-mail, Google ou outro provedor neste web. A criação de contas é administrativa. A página de ajuda explica as operações do sistema; a alternância de tema é local ao navegador.

## Análise geral

- Total de equipes no histórico disponível e total da data de hoje.
- Quantidade de veículos e equipamentos ativos no catálogo.
- Quantidade de manutenções e soma dos seus custos.
- Acessos rápidos a equipes, manutenções e histórico.
- Gráfico de equipes dos últimos sete dias, considerando a data operacional.
- Distribuição das equipes nos cinco contratos com maior quantidade.
- Cinco envios mais recentes, ordenados por data de criação, com abertura de detalhes.

Os indicadores seguem os dados retornados para a conta. Um funcionário não recebe automaticamente os totais de todos os usuários. Clicar numa barra do gráfico abre Registro de equipes; não aplica automaticamente um filtro para o dia da barra.

## Registro de equipes

Há duas abas:

| Aba                  | Comportamento                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visão por dia        | Agrupa envios por data, em ordem decrescente. O dia mais recente inicia expandido. Há seleção de mês e dia, e controles para expandir ou recolher. Dentro do dia, separa por contrato e mostra cards com equipe, responsável, placa e modelo. Clicar abre o envio correspondente. |
| Consulta com filtros | Mostra filtros combináveis e uma tabela das equipes que correspondem à consulta. Uma linha representa uma equipe; a edição ou exclusão afeta seu envio completo.                                                                                                                  |

O formulário exige data, contrato e de 1 a 50 equipes. Cada equipe tem responsável e veículo. É possível adicionar e remover blocos. Não se aceita repetir responsável ou veículo no mesmo envio pelo web. O sistema consulta o último veículo usado pelo responsável e apresenta uma sugestão que depende da escolha do usuário.

A criação usa um UUID do envio. A edição abre os dados e a versão atual; se outro cliente tiver alterado o registro, o banco pode exigir a reabertura da edição. Alterações ainda não salvas ficam em memória, com confirmação para descartar ao fechar o formulário.

## Manutenções

O formulário oferece data, contrato, veículo, motorista ou **Motorista não identificado**, tipo de manutenção, valor e observação. Motorista não identificado é gravado como `NULL`. Valor zero é permitido; valor vazio não é equivalente a zero. A observação permite até 40 caracteres Unicode.

A lista permite visualizar detalhes, editar e, para admin, excluir com confirmação. A manutenção pode se referir a veículo ou equipamento ativo. Os tipos de manutenção vêm do banco; não há tela web de gestão desse catálogo nesta revisão.

## Histórico e filtros

O Histórico combina registros e manutenções. Os resultados são filtrados no navegador depois de carregar o histórico autorizado. As páginas Manutenções e Relatórios usam somente manutenções; Registro de equipes usa somente registros.

| Filtro                                | Aplicação                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Data inicial e final                  | Data operacional do envio, limites inclusivos; podem ser usados separadamente                              |
| Contrato                              | Nome do contrato no histórico                                                                              |
| Responsável ou motorista              | Nome da pessoa; manutenção permite não identificado                                                        |
| Veículo                               | Placa ou identificação                                                                                     |
| Busca livre                           | Termos em ID, contrato, pessoa, placa, modelo, serviço e observação, sem diferenciar acentos ou maiúsculas |
| Modelo e tipo de veículo              | Modelo; veículo ou equipamento                                                                             |
| Categoria                             | Registro ou manutenção no Histórico                                                                        |
| Tipo de manutenção                    | Nome do serviço                                                                                            |
| Custo mínimo e máximo                 | Somente envios com custo, em reais                                                                         |
| Observação contém                     | Pesquisa por termos na observação                                                                          |
| Quantidade mínima e máxima de equipes | Registros, pela quantidade total do envio                                                                  |
| Enviado a partir de e até             | Data de criação convertida para São Paulo                                                                  |

Os filtros de pessoa e placa precisam corresponder à **mesma equipe**, evitando falsos resultados em envios com várias equipes. A tela informa intervalos invertidos, mostra chips removíveis e o botão **Limpar filtros**. Esse é o texto atual do web; não confundir com rótulos do aplicativo móvel.

A tabela ordena por data, permite inverter a ordem e oferece 15, 30 ou 50 linhas por página. Não há ordenação arbitrária por todas as colunas. Referências inativas ainda presentes em detalhes históricos podem aparecer nas opções de consulta, mas não são válidas para novos envios.

## Relatórios e exportação

Relatórios e custos aplica os filtros às manutenções, calcula valores e apresenta a distribuição por contrato. As somas usam envios únicos, evitando multiplicar custos por linhas de equipe. A exportação CSV usa os resultados filtrados, não apenas a página visível.

O CSV inclui ID, categoria, data, contrato, equipe, responsável, placa, modelo, serviço, observação, custo e data de envio. Usa ponto e vírgula, aspas escapadas, BOM UTF-8 e proteção contra fórmulas de planilha. Não há exportação Excel nativa ou geração de relatório PDF.

## Cadastros

Veículos, funcionários e contratos têm busca e listagem. Admin pode criar novos itens, que passam a integrar a base compartilhada. Um funcionário de catálogo não é uma conta de login.

Os cards de veículos exibem placa ou identificação, modelo e tipo. Não exibem o selo Ativo. Mostram o ano do CRLV, seletor quando há várias versões e ações **Visualizar** e **Baixar CRLV**. Sem vínculo, mostram a ausência do documento; falha de consulta é apresentada como erro, não como inexistência. O [capítulo de CRLV](07-crlv-e-arquivos.md) detalha o armazenamento.

## Administração de usuários

Admin consulta e pesquisa contas, vê perfil e estado ativo ou inativo, cria usuários com nome, sobrenome, login, perfil e senha e define nova senha. Trocar a senha revoga sessões e recuperações da conta. Ao trocar a própria senha, precisa entrar novamente.

O web não oferece exclusão de contas, troca de login, edição completa de perfil nem ativação ou inativação de contas e catálogos. Não há contas criadas automaticamente a partir de funcionário.

## Atualização e estados de tela

Há carregamento inicial, atualização manual, recarga após gravações e recarga ao retornar à janela se passaram mais de 30 segundos desde a sincronização. Erros preservam os dados já carregados quando possível. Expiração da sessão fecha diálogos e retorna ao login. O código usa mensagens de erro, estados vazios, progresso, confirmação de exclusão e confirmação de descarte; não usa Realtime nem sincronização offline.

Fontes principais: [componentes](../../src/components/), [App.tsx](../../src/App.tsx), [filtros](../../src/domain/filters.ts) e [API](../../server/app.ts).
