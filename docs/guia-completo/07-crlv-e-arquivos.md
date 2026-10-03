# CRLV arquivos e armazenamento

Os PDFs completos ficam no **Supabase Storage**, no bucket privado `hashi-crlv`. A tabela `public.veiculo_documentos` não contém o arquivo binário nem uma transcrição dos dados do veículo. Ela guarda somente o vínculo necessário para localizar o documento.

## Estrutura atual

```text
Supabase Storage
  hashi-crlv  privado
    crlv/
      SHA256_DO_PDF/
        CRLVDigital_PLACA_ANO.pdf

PostgreSQL
  public.veiculo_documentos
    id             UUID estável do documento
    veiculo_id     ID de public.veiculos, ou NULL sem correspondência
    storage_path   crlv/SHA256_DO_PDF/CRLVDigital_PLACA_ANO.pdf
```

O nome contém a placa lida no PDF e o ano da data do documento indicado pelo usuário. Não corresponde necessariamente ao ano de fabricação, ano do modelo ou exercício do licenciamento. Nos documentos antigos, a placa no PDF pode diferir da placa atual do cadastro, mas o vínculo é mantido pelo ID do veículo.

O bucket aceita `application/pdf`, limita cada objeto a 20.971.520 bytes e tem 149 arquivos, somando 14.968.558 bytes no inventário consultado. Não há dependência do diretório local para visualizar ou baixar.

## Leitura associação e simplificação realizadas

Na carga de 02/10/2026, foram identificados 149 CRLVs, uma CNH e uma ATPV-e entre 151 PDFs. Cinquenta e um nomes foram padronizados. Os bytes dos PDFs foram preservados, conferidos por SHA-256 antes/depois da organização e após o envio para a nuvem.

A placa foi comparada com o cadastro compartilhado. Dois documentos antigos tiveram a identidade confirmada por chassi e placa anterior em documentos mais recentes. O resultado preservado é de **75 documentos para 73 veículos**; outros 74 arquivos não têm veículo correspondente confirmado e ficam com `veiculo_id=NULL`.

A tabela foi reduzida de 17 para três campos a pedido do usuário. Modelo, chassi, datas e outras informações extraídas deixaram de ser duplicadas na tabela. Continuam nos PDFs e nos relatórios locais de conferência. O documento inicialmente selecionado nos 73 veículos permaneceu igual após a simplificação.

No levantamento original, os sete veículos sem CRLV identificado eram `KNC1076`, `LMP9H12`, `LMP9H23`, `LRJ7G35`, `LRJ7G95`, `LRJ9B37` e `LUL8A32`. Essa lista é histórica; consulte o cadastro e os vínculos para uma posição posterior.

## Fluxo de visualização e download

1. Cadastro de veículos carrega a listagem autenticada dos documentos.
2. O card associa os resultados pelo `veiculo_id`, prioriza maior ano do nome e oferece seleção das versões.
3. Visualizar abre a rota do próprio Hashi em outra aba. Baixar chama a mesma rota com `download=1`.
4. A RPC `web_obter_crlv` valida a sessão, o documento, o veículo solicitado e se o veículo está ativo.
5. O servidor usa a chave secreta para buscar o objeto no bucket privado.
6. Valida o caminho, limite/tamanho retornado do Storage, assinatura `%PDF-` e SHA-256 antes de responder.
7. O navegador exibe o PDF ou salva `CRLVDigital_PLACA_ANO.pdf`.

A listagem para a interface retorna só `id`, `veiculo_id`, `placa` e `ano_documento`. A placa e o ano vêm do nome; hash e nome vêm do caminho; tamanho vem de `storage.objects.metadata`. A demonstração não retorna documentos reais, mesmo se IDs de veículos fictícios coincidirem com a base.

## Ver os arquivos no painel

Abra o projeto no Dashboard Supabase e vá a **Storage → hashi-crlv → crlv**. As subpastas têm o SHA-256 como nome. Dentro está o PDF padronizado. Selecione um arquivo para usar as opções do painel, incluindo Download. No Hashi, o caminho por placa é mais simples: **Cadastros → Veículos → Visualizar**.

## O que existe localmente

| Caminho                                   | Conteúdo                                               | Necessário para o runtime    |
| ----------------------------------------- | ------------------------------------------------------ | ---------------------------- |
| `storage/veiculos/crlv/originais`         | Cópias dos 149 CRLVs                                   | Não                          |
| `storage/veiculos/crlv/outros-documentos` | CNH e ATPV-e                                           | Não; continuam apenas locais |
| `storage/veiculos/crlv/relatorios`        | Leitura, inventário, vínculos e relatórios de migração | Não                          |
| `.tools`                                  | Snapshots e programas temporários usados na carga      | Não                          |

As cópias locais de CRLV podem ser removidas após guardar o que desejar como backup. **CNH e ATPV-e não foram enviadas para a nuvem**. Excluir toda a pasta `storage` também exclui esses documentos e as evidências locais.

## Clonar o Storage para outro projeto

Uma cópia usando o mesmo projeto Supabase não precisa mover os PDFs. Numa cópia independente:

1. Crie no destino um bucket **privado**, chamado `hashi-crlv`, com o limite e MIME indicados acima.
2. Copie todos os objetos completos pela Storage API, S3 compatível ou ferramenta administrativa do Supabase, conservando exatamente os caminhos e os bytes.
3. Restaure os vínculos preservando os IDs de veículo e documento.
4. Instale a [política do CRLV](anexos/politica-crlv.sql) uma vez no destino.
5. Configure as chaves do novo projeto no servidor e confira tamanho e SHA-256 dos PDFs baixados.

O banco guarda metadados dos objetos, enquanto os arquivos ficam no serviço de armazenamento. Copiar `storage.objects` por SQL não transfere o PDF e não deve substituir a operação pela Storage API. [Documentação do schema Storage](https://supabase.com/docs/guides/storage/schema/design).

Se os originais locais já tiverem sido apagados, a origem da cópia é o bucket atual; não é preciso recuperar uma pasta do PC. O script histórico `migrar-crlv-storage.mjs` depende de arquivos locais e snapshot específico e não é, por si só, um sincronizador entre dois projetos.

## Novos documentos e alterações futuras

Não há importação automática, OCR em execução ou tela de envio de CRLV nesta versão. Um novo PDF exige leitura/conferência, nome padronizado, upload privado e cadastro do vínculo por um responsável técnico. Não altere apenas o nome no Storage: `storage_path`, integridade e vínculo precisam continuar correspondendo ao arquivo.

O bucket e os vínculos são independentes: remover um objeto quebra o download; remover o vínculo faz o card deixar de oferecer o documento. Não há rotina automática de exclusão ou coleta de arquivos sem vínculo.

Fontes: [VehicleCrlv](../../src/components/VehicleCrlv.tsx), [leitor do servidor](../../server/crlv.ts), [schema mínimo](../../supabase/migrations/202610020003_crlv_vinculo_minimo.sql) e [inventário](anexos/inventario-supabase.json).
