# API contratos e regras de negócio

Todas as rotas do navegador estão sob `/api`, na mesma origem da interface. As mutações recebem JSON e exigem `Origin` igual a `APP_ORIGIN`. O cookie transporta a sessão; clientes do web não precisam enviar `p_token` no corpo.

## Rotas sem sessão Hashi

| Método e rota                 | Entrada                                            | Resultado                                                           |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| `GET /api/config`             | Nenhuma                                            | `{ demo: boolean }`                                                 |
| `POST /api/login`             | `{ username, password }`                           | Perfil e cookie de sessão                                           |
| `POST /api/demo`              | `{ role: "admin" ou "funcionario" }`; padrão admin | Perfil e cookie de demonstração; somente desenvolvimento habilitado |
| `POST /api/recovery/validate` | `{ username, code }`                               | `{ ok: true }` e cookie de recuperação                              |
| `POST /api/recovery/reset`    | `{ password }` e cookie de recuperação             | Consome autorização, troca senha e limpa cookies                    |

## Rotas com sessão ativa

| Método e rota                                   | Entrada ou parâmetros                                      | Resultado e RPC                                             |
| ----------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /api/bootstrap`                            | Cookie                                                     | `profile`, `catalogs`, `history`, `syncedAt`, `demo`        |
| `POST /api/logout`                              | JSON vazio                                                 | Revoga por `encerrar_sessao` e limpa cookie                 |
| `GET /api/entry/:type/:id`                      | `type=registro` ou `manutencao`, UUID                      | Dados de edição por `obter_envio`                           |
| `GET /api/last-vehicle`                         | `driver` inteiro e `exclude` UUID obrigatórios na rota web | Sugestão por `ultimo_veiculo_motorista`                     |
| `POST /api/entry/:type`                         | Registro ou manutenção descritos abaixo                    | Cria ou edita segundo presença de `version`; `{ ok: true }` |
| `DELETE /api/entry/:type/:id`                   | Tipo, UUID, origem e JSON                                  | Somente admin; `apagar_envio`                               |
| `GET /api/vehicles/crlv`                        | Cookie                                                     | Array de `{ id, veiculo_id, placa, ano_documento }`         |
| `GET /api/vehicles/:vehicleId/crlv/:documentId` | Inteiro positivo, UUID; `download=0` ou `1`                | PDF inline ou attachment; autoriza por `web_obter_crlv`     |

## Rotas administrativas

Todas conferem `meu_perfil` antes da operação e só aceitam admin ativo. As RPCs repetem essa condição.

| Método e rota                           | Corpo                                          | RPC                                           |
| --------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `POST /api/admin/catalogs/veiculos`     | `{ placa, modelo, tipo }`                      | `web_criar_cadastro`                          |
| `POST /api/admin/catalogs/funcionarios` | `{ nome }`                                     | `web_criar_cadastro`                          |
| `POST /api/admin/catalogs/contratos`    | `{ nome }`                                     | `web_criar_cadastro`                          |
| `GET /api/admin/users`                  | Nenhum                                         | `web_listar_usuarios`                         |
| `POST /api/admin/users`                 | `{ nome, sobrenome, login, perfil, password }` | `web_criar_usuario`                           |
| `POST /api/admin/users/:id/password`    | `{ password }`                                 | `web_definir_senha`; retorna `reauthenticate` |

Criações retornam HTTP 201 com o item criado. Não há PUT/PATCH genérico para tabelas. Não há endpoints de upload, exclusão de PDFs ou alteração de vínculo documental na interface.

## Contrato de registro

```json
{
  "id": "UUID_DO_ENVIO",
  "date": "2026-10-01",
  "contractId": 1,
  "teams": [{ "responsavel_id": 1, "veiculo_id": 1 }]
}
```

IDs do exemplo são ilustrativos; devem existir e estar ativos no destino. Na edição, acrescente `version` com a versão recebida de `obter_envio`. O servidor converte para `p_id`, `p_data`, `p_contrato_id`, `p_equipes` e, quando aplicável, `p_versao`.

Validações: UUID, data real em `YYYY-MM-DD`, data não futura em São Paulo, contrato ativo, entre 1 e 50 equipes, responsável ativo que não seja status e veículo ativo. Responsáveis e veículos não se repetem no mesmo envio. O banco decide autoria e autorização a partir da sessão, não de um ID fornecido pelo navegador.

## Contrato de manutenção

```json
{
  "id": "UUID_DO_ENVIO",
  "date": "2026-10-01",
  "contractId": 1,
  "vehicleId": 1,
  "driverId": null,
  "driverUnidentified": true,
  "typeId": 1,
  "costDigits": "15000",
  "note": "Troca de óleo"
}
```

`costDigits` é uma string de centavos: `15000` vira R$ 150,00. Aceita de 1 a 12 dígitos; `0` é válido, vazio não. `driverUnidentified=true` exige `driverId=null`; quando falso, exige ID de motorista. A observação aceita até 40 caracteres Unicode, incluindo espaços. Na edição, use `version`.

O servidor transforma em `p_tipo_id`, `p_motorista_id`, `p_veiculo_id`, `p_custo` em reais e `p_observacao`. O schema permite campos auxiliares de apresentação, mas a conversão envia somente o contrato esperado. O catálogo é consultado novamente no envio para evitar aceitar uma referência que foi inativada depois de abrir a tela.

## Novos cadastros e contas

Nome de funcionário/contrato: 1 a 200 caracteres após aparar e compactar espaços. Nome/sobrenome de conta: 1 a 100. Modelo: 1 a 150. Identificação de veículo/equipamento: 1 a 30, convertida para maiúsculas, com letras, números, espaços ou hífen e primeiro caractere alfanumérico. Equipamento não precisa seguir padrão de placa automotiva.

Os limites e mensagens são compartilhados em [admin.ts](../../src/domain/admin.ts) e reforçados nas RPCs. As regras de senha estão no [capítulo de acessos](02-acessos-e-seguranca.md).

## Leitura do histórico e catálogos

Bootstrap chama perfil, catálogos e histórico em paralelo. O histórico é consultado em blocos de 100 até terminar, deduplicando por ID, com limite explícito de 100 mil itens. Atingir o limite retorna erro em vez de um total silenciosamente incompleto.

Catálogos expostos ao navegador contêm somente referências ativas; funcionários com `is_status=true` são excluídos. As opções históricas usadas pelos filtros podem incluir nomes e placas que já não constem entre os ativos.

Cada item de histórico possui `id`, `tipo`, `data`, `contrato`, `placas`, `detalhes`, `custo` e `created_at`. Os detalhes contêm pessoa, placa, modelo e campos da equipe/serviço. A RPC usada pelo web não retorna autor ou versão nesse histórico. A versão vem da abertura do envio.

## Transporte e falhas

| Situação                                                             | Resposta web                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| Sem sessão ou sessão expirada                                        | 401; limpeza de cookie e evento de expiração no cliente |
| Origem inválida ou perfil sem permissão                              | 403                                                     |
| Registro/documento inexistente                                       | 404 quando tratado pela rota                            |
| Duplicidade ou concorrência de versão                                | 409                                                     |
| Validação Zod ou catálogo inválido                                   | 422                                                     |
| JSON inválido                                                        | 400                                                     |
| Supabase indisponível, configuração ausente ou RPC web não instalada | 503                                                     |
| Falha inesperada                                                     | 500 com mensagem genérica                               |

O corpo de erro é `{ "error": "mensagem" }`. Os códigos PostgreSQL `28000`, `42501` e `23505` são mapeados para sessão, permissão e duplicidade. O erro `PGRST202` em RPCs `web_*` produz orientação de atualização do banco. O timeout do transporte RPC e do Storage é 25 segundos.

A visualização entrega `Content-Disposition: inline`; o download usa `attachment` com nome padronizado. O cliente não salva respostas JSON como se fossem PDFs. A consulta documental e o download não expõem a chave secreta nem uma URL pública permanente.

Fontes: [server/app.ts](../../server/app.ts), [server/rpc.ts](../../server/rpc.ts), [domain](../../src/domain/) e [lib/api.ts](../../src/lib/api.ts).
