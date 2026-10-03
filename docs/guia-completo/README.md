# Documentação completa do Hashi Web

Este conjunto documenta o sistema web existente e o que é necessário para reproduzi-lo em outra máquina ou em outro projeto Supabase. Destina-se ao responsável pela operação e a quem assumir o desenvolvimento. A referência é o código desta pasta e a estrutura do Supabase consultada em **03/10/2026**.

O Hashi Web usa React, TypeScript e Express. Compartilha usuários, senhas, perfis e dados com o Hashi App, mas este repositório não é o aplicativo React Native nem gera APK. Os PDFs de CRLV ficam no Supabase Storage; a tabela de documentos contém somente o vínculo ao veículo.

## Por onde começar

| Objetivo                                               | Documento                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Entender todas as telas e funcionalidades              | [Funcionalidades](01-visao-geral-e-funcionalidades.md)          |
| Entender quem acessa o quê e como funciona o login     | [Acessos e segurança](02-acessos-e-seguranca.md)                |
| Encontrar arquivos, tecnologias e responsabilidades    | [Arquitetura e pastas](03-arquitetura-e-pastas.md)              |
| Entender tabelas, relacionamentos, funções e migrações | [Supabase](04-supabase-tabelas-e-rpcs.md)                       |
| Integrar ou modificar a API e as validações            | [API e regras](05-api-e-regras.md)                              |
| Reproduzir cores, fontes, layout e navegação           | [Design](06-design-e-interface.md)                              |
| Entender onde estão os PDFs e como migrá-los           | [CRLV e arquivos](07-crlv-e-arquivos.md)                        |
| Copiar, instalar, criar outro banco ou publicar        | [Clonagem e publicação](08-instalacao-clonagem-e-publicacao.md) |
| Validar, operar e diagnosticar problemas               | [Testes e operação](09-testes-operacao-e-limitacoes.md)         |

## O que acompanha esta documentação

- [Inventário completo do Supabase](anexos/inventario-supabase.json): estrutura, ACLs, políticas, funções, extensões, migrações, configuração de buckets e contagens, sem linhas de credenciais ou de usuários.
- [Dicionário das 54 tabelas](anexos/todas-as-tabelas.md): colunas, tipos, valores padrão, restrições, índices, triggers e políticas, incluindo tabelas gerenciadas pela plataforma.
- [Catálogo das 47 funções](anexos/todas-as-funcoes.md): todas as assinaturas de `public` e `private`, com privilégios e sobrecargas.
- [SQL estrutural da aplicação](anexos/schema-aplicacao.sql): 14 tabelas, 47 funções, restrições, índices, triggers, RLS e privilégios explícitos extraídos do catálogo. É uma referência para um Supabase novo, não um backup de dados nem um `pg_dump` integral. Leia o capítulo de clonagem antes de executar.
- [Inicialização de login em banco novo](anexos/inicializar-login-novo.sql): cria somente a configuração técnica e os contadores, sem usuário ou senha padrão.
- [Política do bucket de CRLV](anexos/politica-crlv.sql): configuração específica a reproduzir no Storage do destino.
- [Consulta de estrutura](anexos/consultar-estrutura.sql): SQL somente de leitura para atualizar a evidência.
- [Dependências](anexos/dependencias.json), [inventário de fontes](anexos/inventario-arquivos.json) e [regras de CSS](anexos/design-css.json): versões efetivas, hashes dos arquivos e declarações do visual.
- [Validação da documentação](anexos/validacao-documentacao.json): conferência de links, abrangência dos anexos e ausência de credenciais reais.

## O que é necessário para uma cópia exata

1. **Código completo em disco**, incluindo arquivos ainda não commitados. `git clone` sozinho só transporta o que estiver commitado e disponível no remoto.
2. **Dependências do `package-lock.json`**, instaladas com `npm ci`.
3. **Configuração privada do destino**, baseada em `.env.example`. Chaves e senhas não estão nesta documentação.
4. **Banco**: manter a conexão com o atual ou restaurar estrutura e dados em outro Supabase. Contas e hashes de senha precisam ser transportados por backup privado para conservar os mesmos logins em uma cópia independente.
5. **Arquivos do Storage**: os objetos PDF precisam ser copiados separadamente se mudar de projeto Supabase.

O código e os anexos descrevem a implementação. Dados de produção, senhas, tokens, backups de credenciais e PDFs não são incorporados ao guia. O passo a passo de transferência está em [Clonagem](08-instalacao-clonagem-e-publicacao.md).

## Estado confirmado e limites da entrega

A consulta atual encontrou **9 tabelas públicas da aplicação, 5 privadas e 40 da plataforma**, PostgreSQL **17.6**, 15 migrações registradas e um bucket privado com **149 PDFs**. Os PDFs têm 75 vínculos preenchidos para 73 veículos. Estes números são um retrato de 03/10/2026, não limites fixos do produto.

As verificações de funcionamento executadas em 02/10/2026 estão separadas das conferências documentais desta entrega. Não foi criado um novo projeto Supabase, executado um restore completo, publicado um domínio ou feita uma sessão real usando senha pessoal para produzir este guia.

Os documentos antigos de [docs](../) continuam como referência histórica do aplicativo e das etapas anteriores. Para o **estado atual do web**, use este guia, o código e o inventário datado; não aplique requisitos antigos de Supabase Auth como se fossem o login atual.
