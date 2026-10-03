# Instalação clonagem e publicação

Há dois destinos possíveis. **Outra instalação ligada ao Supabase atual** usa os mesmos usuários, dados e PDFs imediatamente. **Uma cópia independente** exige outro projeto Supabase, restauração dos dados e transferência dos arquivos. Depois da separação, alterações de senhas e registros em um projeto não se propagam ao outro.

Os procedimentos abaixo são instruções para executar no destino. Esta entrega não criou uma hospedagem nem um segundo projeto. Não execute restauração sobre o banco atual.

## Pré requisitos e arquivos

- Node.js 22.12 ou superior; para reproduzir o ambiente conferido, use 24.12.0.
- Código completo do HashimotoWeb, `package.json`, `package-lock.json`, configurações e ativos.
- Acesso autorizado ao projeto Supabase usado no destino e às chaves necessárias.
- Chrome se for executar os testes Playwright com a configuração atual.
- Para backup/restore: Supabase CLI, Docker Desktop para o fluxo `db dump` e cliente PostgreSQL/`psql` compatível com PostgreSQL 17. A consulta de inventário feita nesta entrega não exige que um dump de dados tenha sido produzido.

Não dependa de um `git clone` enquanto os arquivos novos não estiverem commitados e disponíveis no remoto. O [inventário de fontes](anexos/inventario-arquivos.json) representa os arquivos desta pasta em disco. Copiar o projeto completo conserva também trabalho não commitado; `node_modules`, caches e resultados podem ser recriados.

## Instalação usando o mesmo Supabase

Abra PowerShell na pasta copiada:

```powershell
npm.cmd ci
if (-not (Test-Path -LiteralPath '.env')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
npm.cmd run dev
```

Antes de iniciar, preencha `.env` conforme a tabela a seguir. A chave secreta é necessária para PDFs. Não substitua um `.env` já configurado sem conferir seu conteúdo.

| Variável                   | Desenvolvimento                             | Produção                                                  |
| -------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `SUPABASE_URL`             | URL do projeto atual ou do destino          | URL do projeto escolhido                                  |
| `SUPABASE_PUBLISHABLE_KEY` | Chave `sb_publishable_...` do mesmo projeto | Configuração privada do servidor                          |
| `SUPABASE_SECRET_KEY`      | Chave `sb_secret_...` do mesmo projeto      | Somente no servidor, para Storage                         |
| `PORT`                     | `3000`                                      | Porta interna do Node                                     |
| `APP_ORIGIN`               | `http://localhost:3000`                     | Origem pública HTTPS, sem caminho ou barra final          |
| `COOKIE_SECURE`            | `false`                                     | `true`                                                    |
| `ENABLE_DEMO`              | `true` se quiser exemplos isolados          | `false`; o servidor a desativa em produção mesmo que true |
| `NODE_ENV`                 | Pode ficar ausente                          | `production`; `npm start` também passa `--production`     |
| `HASHI_TEST_PORT`          | Opcional, somente para Playwright           | Não é configuração de runtime                             |

Os valores reais devem ser obtidos no projeto correto pelo responsável. A conta do Hashi não serve como credencial do Dashboard Supabase. Não copie a chave de outro projeto misturada com a URL atual.

Abra **http://localhost:3000**. No Windows, `INICIAR.cmd` inicia e abre o navegador; mantenha sua janela aberta. O log fica em `.tools/hashi-server.log`. Abrir `index.html` por `file://` não executa React nem Express. Para outro endereço local, ajuste também `APP_ORIGIN`; usar `127.0.0.1` só na barra do navegador com origem configurada como `localhost` pode permitir a página e recusar o POST de login.

Nesse cenário não reaplique migrations, não copie PDFs locais e não crie usuários duplicados. A nova instalação estará operando na mesma base do aplicativo. Um teste de exclusão ou edição com usuário real afeta os dados compartilhados.

## Cópia independente por backup e restore

Este é o caminho indicado para conservar os dados, IDs, contas e hashes de senha existentes. Faça os backups numa pasta privada ignorada pelo Git, e não dentro destes anexos. Os dumps de `private` contêm credenciais e, se não excluídas, sessões e autorizações.

### Preparar origem e destino

1. Crie um projeto Supabase novo e identifique claramente seu project ref.
2. Obtenha as conexões PostgreSQL pelo painel **Connect**. Use o pooler de sessão quando necessário para IPv4, ou a conexão direta quando disponível. A senha de banco é diferente das chaves API.
3. Instale as extensões necessárias no destino, especialmente `pgcrypto` no schema `extensions`. Preserve a localização esperada pelas funções.
4. Defina privadamente `HASHI_SOURCE_DB_URL` e `HASHI_TARGET_DB_URL` na sessão de terminal. Não registre credenciais no documento ou no histórico compartilhado.
5. Planeje uma janela sem alterações de schema/dados durante a coleta de dumps separados e o inventário do Storage, para comparar um estado consistente.

A sequência usa o procedimento oficial de [backup e restore do Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), adaptado aos schemas da aplicação. A plataforma possui passos próprios para schemas gerenciados e histórico de migrações.

### Exportar estrutura e dados

Exemplo PowerShell na raiz do projeto, com as variáveis de conexão já configuradas:

```powershell
$hashiBackupDir = Join-Path (Get-Location) '.tools\backup-clonagem'
New-Item -ItemType Directory -Path $hashiBackupDir -Force | Out-Null

supabase db dump --db-url $env:HASHI_SOURCE_DB_URL --schema public,private --file (Join-Path $hashiBackupDir 'schema.sql')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar estrutura' }

supabase db dump --db-url $env:HASHI_SOURCE_DB_URL --schema public,private --data-only --use-copy --file (Join-Path $hashiBackupDir 'data.sql')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar dados' }
```

Esses comandos não foram executados para gerar este guia: o material publicado contém estrutura, não um dump de credenciais. O filtro inclui as nove tabelas públicas e cinco privadas. Se for transportar papéis customizados da organização, inventarie-os e siga também o fluxo de roles do guia oficial; os papéis administrados pelo Supabase não devem ser reinventados.

O dump de dados deve preservar os UUIDs e IDs de identidade, inclusive os valores das sequências. Exportar só os CSVs visíveis nas telas do Hashi não produz um backup relacional completo e não conserva credenciais.

### Restaurar somente no projeto novo

Confira que as URLs apontam a projetos diferentes e que as tabelas da aplicação não existem no destino. Uma string de conexão diferente, sozinha, não prova que os projetos são diferentes; confira o project ref e o host no painel.

```powershell
if (-not $env:HASHI_SOURCE_DB_URL -or -not $env:HASHI_TARGET_DB_URL) {
  throw 'Configure as conexões de origem e destino'
}
if ($env:HASHI_SOURCE_DB_URL -eq $env:HASHI_TARGET_DB_URL) {
  throw 'Origem e destino não podem ser iguais'
}

psql --dbname $env:HASHI_TARGET_DB_URL --single-transaction --set ON_ERROR_STOP=on --file (Join-Path $hashiBackupDir 'schema.sql') --command 'SET session_replication_role = replica' --file (Join-Path $hashiBackupDir 'data.sql') --command 'SET session_replication_role = origin'
if ($LASTEXITCODE -ne 0) { throw 'Restore interrompido; conferir erro no destino' }
```

A desativação temporária dos triggers é relevante porque restaurar credenciais poderia invalidar recuperações no meio da carga. No final, os triggers precisam voltar ao estado normal. Depois do restore, é recomendável iniciar novas sessões na cópia independente; invalide sessões e recuperações **somente no destino**, conforme a decisão do responsável. Não reaproveite tokens de produção como credencial de teste.

Conserve também o histórico de `supabase_migrations` usando o fluxo específico do guia oficial. Ele contém versões anteriores que não estão nos quatro arquivos locais. Não rode as quatro migrations web por cima de um dump que já contém seu estado final.

### Transferir PDFs e configurações

Siga [CRLV e arquivos](07-crlv-e-arquivos.md): crie `hashi-crlv` privado, copie os 149 objetos completos por Storage API/S3 com os mesmos caminhos, aplique a política do bucket e confira os bytes. SQL de metadados não copia PDFs.

Configure a nova URL e as duas novas chaves no servidor clonado. Preserve os arquivos de código, mas não a conexão de origem. Emita novas credenciais técnicas pelo projeto destino; elas não são transportadas por um dump PostgreSQL.

### Validar a cópia

Compare tabelas, funções e privilégios com o inventário. Confira registros e FKs, contas/perfis, sequências de IDs e política do Storage. Faça login como admin e funcionário, teste o escopo de histórico de cada conta, crie/edite/exclua apenas dados de teste no destino e abra/baixe um CRLV. Compare os hashes dos PDFs, não apenas seus nomes.

A contagem atual registrada é 149 PDFs, 75 vínculos preenchidos e 73 veículos com documento; recalcule se houver novos arquivos antes da cópia. O responsável deve confirmar que uma escrita no destino não aparece na origem.

## Instalação com banco vazio usando os anexos

Para montar somente a estrutura atual sem copiar dados de produção:

1. Use um Supabase novo, com schemas e papéis gerenciados disponíveis.
2. Revise e execute [schema-aplicacao.sql](anexos/schema-aplicacao.sql) pelo administrador do banco. O arquivo aborta se detectar tabelas da aplicação existentes.
3. Execute [inicializar-login-novo.sql](anexos/inicializar-login-novo.sql), necessário para hash fictício e os 1.024 contadores de login.
4. Crie o primeiro admin usando `public.cadastrar_usuario`, em ambiente administrativo, com login, senha privada, perfil `admin`, nome e sobrenome. Não há usuário/senha padrão neste guia.
5. Cadastre contratos, funcionários, veículos e tipos de manutenção. O web cria os três primeiros; os tipos precisam de manutenção administrativa do banco.
6. Se houver PDFs, crie o bucket, aplique a política e importe os vínculos após enviar os arquivos.

O snapshot SQL contém as tabelas, funções, índices, constraints, triggers, políticas e privilégios explícitos dos objetos da aplicação. **Não é equivalente a um `pg_dump` integral**: não inclui dados, valores correntes das sequências, todo o estado de privilégios padrão da plataforma, histórico de migrations, membros da organização ou os bytes do Storage. As definições completas de sequências e ACLs estão no JSON para conferência. Não foi testado um restore desse arquivo em um segundo Supabase nesta entrega; para réplica exata com dados, prefira o fluxo de backup acima.

## Compilar e publicar o web

No ambiente de build:

```powershell
npm.cmd ci
npm.cmd run build
```

Conserve `dist`, `server`, os módulos de domínio importados de `src/domain`, `package.json`, `package-lock.json` e as dependências de runtime. Para reduzir erros de empacotamento, transportar o projeto completo de fontes e regenerar `dist` é uma opção direta. `tsx` é dependência de runtime.

No servidor, configure as variáveis de produção e execute:

```powershell
npm.cmd start
```

Em Linux/macOS, use `npm` em vez de `npm.cmd`. O backend escuta por padrão em `127.0.0.1:3000`; coloque um proxy HTTPS na mesma máquina apontando para esse endereço. Preserve o cabeçalho Host e a origem pública. `APP_ORIGIN` deve ser exatamente a origem HTTPS acessada pelo navegador.

Não basta publicar `dist` em hospedagem estática: cookies, login, RPCs e PDFs dependem do servidor. Configure um processo persistente da hospedagem e seus logs; o iniciador local Windows não é um serviço de produção. Para contêiner com proxy em outro contêiner, a ligação atual em loopback exige adaptação explícita de rede/bind; não há Dockerfile pronto nesta revisão.

O servidor recusa modo de produção sem HTTPS em `APP_ORIGIN` e `COOKIE_SECURE=true`. A demonstração é desabilitada. Não há domínio, provedor de hospedagem ou pipeline CI/CD configurado e validado por esta documentação.

## Critérios para considerar a clonagem concluída

- Os arquivos de fonte e o lockfile correspondem à versão desejada, incluindo trabalho antes não commitado.
- A instalação usa o projeto Supabase intencional, com chaves dele e nenhuma chave secreta no frontend.
- Há login real de ambos os perfis e as permissões continuam corretas.
- Formulários, histórico, relatórios, exportação e administração funcionam no destino.
- Cada PDF vinculado pode ser aberto e baixado sem a cópia local.
- Tema, marca, menu, tabelas, desktop e celular correspondem ao visual documentado.
- Backup, processo persistente e diagnóstico estão sob responsabilidade definida no novo ambiente.
