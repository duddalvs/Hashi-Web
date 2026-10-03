# Design e interface

O visual atual é um painel operacional com marca em texto, tema escuro como padrão e tema claro opcional. As referências de layout fornecidas pelo usuário orientaram o menu de serviços, os cards e as tabelas. A fonte de verdade para reproduzir o resultado é [styles.css](../../src/styles.css), junto dos componentes React.

## Marca e identidade

A marca é o componente `Brand` em [ui.tsx](../../src/components/ui.tsx): a palavra **hashi** em minúsculas, seguida de um ponto. O texto é laranja; o ponto é claro no tema escuro e azul no tema claro. Não há imagem de logotipo principal ou uma fonte exclusiva da marca. O favicon é [favicon.svg](../../public/favicon.svg).

O laranja principal é `#ff6200`. O azul institucional documentado é `#0b2c44`; ele não é o único azul do painel. Fundos e superfícies usam a paleta abaixo. Conservar só duas cores não reproduz a interface inteira.

## Tokens de cor

| Variável CSS    | Tema escuro         | Tema claro              | Uso                              |
| --------------- | ------------------- | ----------------------- | -------------------------------- |
| `--bg`          | `#111820`           | `#f3f5f7`               | Fundo                            |
| `--sidebar`     | `#101a25`           | `#ffffff`               | Barra superior e lateral do menu |
| `--surface`     | `#18222e`           | `#ffffff`               | Painéis e botões secundários     |
| `--surface2`    | `#1c2835`           | `#f4f6f8`               | Superfície alternativa           |
| `--surface3`    | `#23313f`           | `#e8edf2`               | Estados e destaque de superfície |
| `--input`       | `#131d28`           | `#f8fafb`               | Campos                           |
| `--border`      | `#2a3542`           | `#dce2e8`               | Bordas                           |
| `--text`        | `#e6ebf1`           | `#203246`               | Texto principal                  |
| `--muted`       | `#929fac`           | `#5b6f80`               | Texto secundário                 |
| `--subtle`      | `#728292`           | `#778695`               | Texto discreto                   |
| `--accent`      | `#ff6200`           | Mesmo valor             | Ação e identidade                |
| `--orange-soft` | `#ff620018`         | Mesmo valor             | Destaque suave                   |
| `--green`       | `#53c8a2`           | Mesmo valor             | Indicadores positivos            |
| `--blue`        | `#76a9cc`           | `#326485`               | Destaques azuis                  |
| `--shadow`      | `0 12px 35px #0002` | `0 12px 35px #13263d12` | Sombra                           |

Cards de serviço usam `#253149`, borda `#35435b` e texto `#f2f5fa`; ao passar o mouse, fundo `#2d3d57`. Recentes usam `#365779`. No tema claro, cards usam `#e4ebf3` e recentes `#cfdeed`. Botão destrutivo usa `#c84242`; botão primário em hover usa `#e85c06`. Outras cores de gráficos e estados estão no CSS, não numa biblioteca externa de temas.

## Tipografia e densidade

DM Sans Variable é a família principal, com Arial/sans-serif de fallback. Manrope Variable é usada nos títulos e na marca. Ambas são importadas localmente por pacotes Fontsource em `src/main.tsx`.

O início de `styles.css` também contém um `@import` de Google Fonts. Assim, existe uma referência externa no código, embora as famílias `Variable` usadas pela interface sejam fornecidas pelos pacotes locais. Em produção a CSP restringe estilos a mesma origem e estilos inline; a reprodução deve conservar as fontes locais e conferir o comportamento dessa referência externa. Este guia não removeu nem alterou essa linha.

| Elemento                  | Medida base confirmada               |
| ------------------------- | ------------------------------------ |
| Marca geral               | 43 px, peso 800, espaçamento −2,8 px |
| Marca na barra            | 29 px, espaçamento −1,3 px           |
| Título do menu            | 23 px, peso 650                      |
| Títulos de seções do menu | 17 px, peso 450                      |
| Nome dos serviços         | 12 px, peso 550                      |
| Categorias nos cards      | 10 px                                |
| Botões comuns             | 12 px, peso 650, altura 39 px        |
| Botões de texto           | 11 px                                |

A interface usa tamanhos específicos por componente, inclusive textos auxiliares pequenos; não existe um único tamanho global de 12 px para todo o sistema. A escala atual preserva a reversão visual solicitada anteriormente. Não aumente fontes ou espaços ao clonar se o objetivo é reproduzir exatamente o estado atual.

## Estrutura de layout

| Elemento                    | Regra base                                                |
| --------------------------- | --------------------------------------------------------- |
| Área de trabalho            | Largura 100%, sem lateral fixa nas telas de operação      |
| Barra superior              | Altura 56 px, padding horizontal 31 px                    |
| Conteúdo principal          | Padding horizontal 31 px                                  |
| Menu de serviços            | Grid `248px minmax(0, 1fr)`                               |
| Conteúdo da lateral do menu | Sticky no topo; padding 28 px × 16 px                     |
| Área dos cards              | Padding 28 px                                             |
| Grade de serviços           | Colunas automáticas, mínimo 230 px quando cabe, gap 20 px |
| Link principal do card      | Altura mínima 140 px                                      |
| Bordas dos cards            | Raio 4 px                                                 |
| Botões                      | Raio 6 px, padding horizontal 16 px, gap 8 px             |
| Ícones de ação              | Botão base 31 × 31 px                                     |

Lucide fornece os ícones. O CSS aplica `stroke-width: 1.7` aos SVGs. Os gráficos do painel são feitos com HTML/CSS e medidas calculadas pelo React. Não há imagens externas de fundo necessárias para montar a estrutura principal.

## Responsividade

| Media query                      | Exemplos de adaptação                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| Mínimo 1650 px                   | Padding horizontal de barra e conteúdo passa a 40 px                                      |
| Máximo 1250 px                   | Padding 23 px e ajustes nos indicadores                                                   |
| Máximo 1000 px                   | Indicadores em duas colunas e ajustes de painéis                                          |
| Máximo 760 px                    | Lateral do menu com 180 px, barra de 58 px, simplificação das ações e login em uma coluna |
| Máximo 540 px                    | Lateral do menu com 130 px e conteúdo mais compacto                                       |
| Máximo 390 px                    | Grade de serviços com uma coluna; margens menores                                         |
| `prefers-reduced-motion: reduce` | Redução das animações/transições                                                          |

O corpo tem largura mínima de 320 px. Tabelas usam rolagem na própria área quando necessário. As 685 regras CSS, seus contextos de media query, seletores, valores e linhas estão em [design-css.json](anexos/design-css.json). Esse anexo detalha as diferenças que não cabem numa tabela resumida.

## Interação acessibilidade e estados

Há foco visível laranja com 2 px, rótulos de campos, controles de seleção pesquisáveis, navegação por teclado, retorno de foco e foco contido em modal. O link para pular ao conteúdo e a marcação `main[data-page]` apoiam navegação e testes. Carregamentos usam `role=status`; mensagens relevantes usam alertas.

Botões desabilitados têm opacidade reduzida. Ações destrutivas pedem confirmação. Os seletores diferenciam uma referência ausente de um campo vazio. Estados vazios, falha de rede e ausência de CRLV têm mensagens diferentes. O tema usa `data-theme` na raiz e é salvo como `hashi-theme` no `localStorage`.

Esses recursos foram implementados no código; não foi realizada certificação WCAG completa. Para uma cópia fiel, compare desktop e celular, ambos os temas, estados vazios, formulário aberto e menu de serviços, além da tela inicial.
