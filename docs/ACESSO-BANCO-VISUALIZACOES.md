# Acesso ao banco para visualizações

Conferência em **29/09/2026**. Projeto existente: **Hashimoto Frota**, referência `qxkhjlkexsjgkttdugqt`, região cadastrada `sa-east-1` (São Paulo). PostgreSQL remoto **17.6**.

## Painel do Supabase

[Abrir o projeto](https://supabase.com/dashboard/project/qxkhjlkexsjgkttdugqt).

O painel usa a conta Supabase que possui acesso ao projeto. Esse acesso é separado dos usuários do Hashi App e da senha PostgreSQL. Em **Connect**, consulte as conexões do banco; em **Settings → API Keys**, consulte as chaves. Nenhuma senha da conta do painel foi consultada ou alterada.

## PostgreSQL para ferramenta de relatórios ou servidor

Conexão Session pooler encontrada no projeto vinculado:

| Configuração | Valor |
|---|---|
| Host | `aws-0-sa-east-1.pooler.supabase.com` |
| Porta | `5432` |
| Banco | `postgres` |
| Usuário administrativo | `postgres.qxkhjlkexsjgkttdugqt` |
| Schema operacional | `public` |
| SSL | Ativado; `sslmode=require` |
| Senha salva | Abra `VER-ACESSO-BANCO.cmd` na raiz do projeto |

O atalho mostra a senha e a connection string completa, com a senha codificada para URL. Usa a cópia protegida pelo Windows em `.tools/supabase-frota-db-password.dpapi`; depende do mesmo usuário/ambiente Windows. A leitura dessa cópia foi verificada sem exibir o segredo no relatório. Se a senha tiver sido redefinida no painel, a cópia local pode estar desatualizada. Não houve teste de autenticação PostgreSQL com essa senha nesta entrega; a consulta remota de metadados foi feita pelo CLI vinculado.

Modelo, sem a senha:

```text
postgresql://postgres.qxkhjlkexsjgkttdugqt:SENHA_CODIFICADA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

O Session pooler atende conexões de redes IPv4; os dados também podem ser conferidos no botão Connect do projeto. [Documentação de conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Esse usuário é administrativo. Para disponibilizar um sistema destinado apenas a visualizações, prefira um usuário PostgreSQL com permissão somente de leitura, configurado no servidor ou na ferramenta de relatórios. Não foi criado novo usuário ou alterada permissão nesta entrega. Senhas do banco e chaves secretas devem ficar no servidor, fora do código enviado ao navegador. [Documentação de chaves Supabase](https://supabase.com/docs/guides/api/api-keys).

## API para o novo sistema

```env
SUPABASE_URL=https://qxkhjlkexsjgkttdugqt.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_VbAyds6D5l3bchOBVMWC1g_XMITcsss
```

URL REST: `https://qxkhjlkexsjgkttdugqt.supabase.co/rest/v1`.

Os nomes das variáveis acima são genéricos; no aplicativo atual possuem prefixo `EXPO_PUBLIC_`. A chave é publicável e identifica o projeto; não substitui o login nem concede leitura irrestrita.

O Hashi App usa **autenticação própria por usuário e senha**, por RPC, sem Supabase Auth. O token retornado não é JWT. A integração deve:

1. Chamar `autenticar_usuario` com `p_usuario` e `p_senha`; verificar erro da requisição e `data.error`.
2. Guardar a sessão adequadamente no sistema novo e enviar `data.token` como `p_token` nas RPCs seguintes.
3. Usar `meu_perfil`, `listar_catalogos`, `buscar_historico` e `obter_envio` para leitura.
4. Chamar `encerrar_sessao` ao sair.

| RPC | Parâmetros |
|---|---|
| `autenticar_usuario` | `p_usuario`, `p_senha` |
| `meu_perfil` | `p_token` |
| `listar_catalogos` | `p_token` |
| `buscar_historico` | `p_token`, `p_busca=''`, `p_limite=21`, `p_offset=0`, `p_tipo='todos'` |
| `obter_envio` | `p_token`, `p_id`, `p_tipo` (`registro` ou `manutencao`) |
| `encerrar_sessao` | `p_token` |

As assinaturas e permissões acima foram conferidas no banco remoto. `anon` não possui SELECT direto nas oito tabelas públicas: chamar `.from('manutencoes').select()` usando apenas a chave publicável não é o fluxo permitido atualmente. Funcionários consultam os próprios envios; administradores do aplicativo consultam todos. Um administrador do aplicativo também possui operações de escrita/exclusão; ocultar botões não transforma a conta em somente leitura.

`buscar_historico` pagina resultados; o limite máximo atual é 101 itens por chamada. Um relatório completo precisa percorrer as páginas. O app filtra por categoria, embora a RPC também aceite `todos`.

## Tabelas para as visualizações

| Tabela | Conteúdo |
|---|---|
| `registros_frota` | Cabeçalho da alocação: data, contrato, autor e versão. |
| `registro_equipes` | Equipes, responsáveis e veículos vinculados à alocação. |
| `manutencoes` | Serviços, veículos, motorista, contrato, custo e observação de até 40 caracteres. |
| `funcionarios` | Catálogo de responsáveis/motoristas. |
| `veiculos` | Placas, modelos e tipo de veículo/equipamento. |
| `contratos` | Catálogo de contratos. |
| `tipos_manutencao` | Catálogo dos serviços. |
| `usuarios` | Contas do aplicativo e seus perfis. |

`usuarios` e `funcionarios` têm finalidades diferentes. Credenciais e sessões ficam no schema `private` e não são dados necessários aos gráficos operacionais.

As relações e regras completas estão em [HASHI-APP-INTEGRACAO-HASH-WEB.md](HASHI-APP-INTEGRACAO-HASH-WEB.md). Relatório desta conferência: `.tools/verificar-acesso-visualizacoes-20260929.json`. A entrega contém informações e um atalho local; não altera o banco ou o APK.
