# Acessos por nome de usuário

O Hashi App agora usa somente **usuário e senha**, sem e-mail, telefone ou conta no Supabase Auth. Essa alteração foi instalada em 15/09/2026. As antigas contas técnicas do Auth foram removidas depois da migração; usuários, senhas e envios existentes foram preservados.

## Onde consultar os usuários

No [projeto Supabase](https://supabase.com/dashboard/project/qxkhjlkexsjgkttdugqt), abra **Table Editor → public → usuarios**.

- `login`: nome usado para entrar, como `user_pessoa1`.
- `nome`: aceita nomes compostos, como `Maria Eduarda`; a saudação usa somente a primeira palavra (“Maria”).
- `sobrenome`: sobrenome, como `Alves`. O menu da conta exibe nome e sobrenome juntos.
- `perfil`: `funcionario` ou `admin`.
- `ativo`: `true` libera o acesso; `false` bloqueia e revoga as sessões abertas.
- `id`: identificador que liga a pessoa a seus envios.

**Authentication → Users não é mais usado pelo aplicativo.** Nenhum endereço técnico precisa ser cadastrado.

## Criar um novo usuário

Abra **SQL Editor → New query**. Execute como `postgres`, a opção administrativa do painel. Preencha a senha antes de executar:

```sql
select public.cadastrar_usuario(
  p_usuario => 'user_pessoa2',
  p_senha => '', -- PREENCHA: pelo menos 12 caracteres, até 72 bytes
  p_perfil => 'funcionario',
  p_nome => 'Maria Eduarda',
  p_sobrenome => 'Alves'
);
```

O comando devolve um ID. A linha aparece em `usuarios` já ativa, e a pessoa pode entrar imediatamente usando `user_pessoa2` e a senha escolhida. Para criar outro administrador, use `p_perfil => 'admin'`.

Nome e sobrenome são obrigatórios para novos cadastros, com até 100 caracteres em cada campo. O nome de acesso (`p_usuario`) continua separado do nome da pessoa. Cadastros anteriores não têm sobrenome inferido automaticamente.

Em 16/09/2026, as contas existentes foram atualizadas para **Lucas Melgaço** (`user_admin`, administrador) e **Maria Eduarda Alves** (`user_pessoa1`, funcionária). IDs, senhas e envios foram preservados. A saudação mostra “Olá, Lucas!” ou “Olá, Maria!”.

Em 18/09/2026, foram criadas e ativadas as contas **`user_eduardo`** (Carlos Eduardo Alves Germano) e **`user_wallace`** (Wallace Felizardo de Queiroz), ambas com perfil **funcionário** e as senhas informadas pelo usuário. O login de ambas foi validado pela API e as sessões de teste foram encerradas. Esses acessos já funcionam no aplicativo existente; não exigem novo APK. A cópia local consultada por `VER-ACESSOS.cmd` não foi atualizada com essas contas.

Ainda em 18/09/2026, foram criadas contas ativas de **funcionário** para **`user_renato`** (Carlos Renato Dantas Nascimneto), **`user_armino`** (Armino Correia Ointo Sales Netp) e **`user_mario`** (Marcio Flores dos Santos). Nomes e logins mantidos exatamente como informados pelo usuário. Os três logins e perfis foram validados pela API com as senhas fornecidas, e as sessões de teste foram encerradas. Não exigem atualização do APK; essas contas também não foram acrescentadas à cópia local de `VER-ACESSOS.cmd`.

**Atualização de 21/09/2026:** o login de Marcio passou de `user_mario` para **`user_marcio`**, a pedido do usuário. Use o novo login com a mesma senha anterior; senha, ID, perfil, registros e sessões existentes foram preservados. Não exige novo APK. A edição direta da coluna `login` continua protegida; esta foi uma alteração administrativa pontual e transacional, registrada em `scripts/renomear-marcio.sql` (já executado, não reaplicar).

O usuário deve ter de 3 a 40 caracteres, começar por letra e usar letras sem acentos, números ou `_`. Maiúsculas são normalizadas para minúsculas. Um nome já existente é recusado sem alterar sua senha. Todo o cadastro é transacional: se houver erro, nenhuma conta parcial é criada.

Use esse comando em vez de **Insert row** em `usuarios`: ele cria o perfil e a credencial protegida juntos. Não compartilhe nem mantenha consultas salvas que contenham senhas.

## Consultar ou trocar a senha

### Esqueceu sua senha? — recuperação pelo aplicativo

Na tela de login, **Esqueceu sua senha?** abre a recuperação sem e-mail. O usuário informa seu login e um código temporário; depois aparecem somente **Nova senha** e **Confirmar senha**. O olho ao lado de cada senha permite mostrar/ocultar o texto, inclusive no login.

O administrador confere a identidade da pessoa e gera o código no SQL Editor, como `postgres`:

```sql
select public.gerar_codigo_recuperacao('user_pessoa1');
```

Entregue o código retornado diretamente à pessoa correta. Não é a senha e não permite entrar no aplicativo: serve somente para autorizar a troca. Ele vence em 30 minutos, é de uso único e fica inválido após cinco tentativas incorretas. Gerar outro código invalida o anterior. As tentativas no código não bloqueiam o login normal.

Após validar o código, a pessoa tem dez minutos para definir e confirmar a senha. O aplicativo exige pelo menos 12 caracteres, mantém o limite de 72 bytes do banco e não permite confirmação diferente. A nova senha encerra as sessões anteriores; a pessoa volta ao login para entrar novamente. Código/autorização são invalidados também por redefinição administrativa ou desativação da conta. Códigos e autorizações ficam apenas como hashes no banco; a autorização temporária fica só em memória no aplicativo.

### Consulta local e redefinição administrativa

As senhas originalmente guardadas de `user_admin` e `user_pessoa1` podem ser consultadas em **VER-ACESSOS.cmd**, na pasta original do projeto. Essa é uma cópia local protegida pelo Windows, não uma leitura da senha atual do banco. Contas criadas posteriormente pelo SQL não são acrescentadas automaticamente a esse arquivo, e redefinições feitas no banco não atualizam essa cópia. Uma senha mostrada por esse atalho pode, portanto, já ter sido substituída.

### A senha tem prazo de validade?

Não. Conferido no código e nas funções do banco em 21/09/2026: a senha definida pelo administrador ou pela recuperação permanece válida até outra troca. O aplicativo diferencia:

- **Senha:** não expira automaticamente. Maiúsculas, minúsculas e espaços fazem parte dela.
- **Sessão:** dura sete dias. Ao vencer, entre novamente com a mesma senha. Troca de senha, saída da conta, desativação ou excesso de sessões também podem encerrar o acesso salvo.
- **Código de recuperação:** válido por trinta minutos; após validá-lo, há dez minutos para definir a nova senha. Esses prazos não são a validade da senha escolhida.
- **Limite de tentativas:** dez falhas numa janela de quinze minutos impedem novas tentativas até terminar essa janela, inclusive com a senha correta. A mensagem informa muitas tentativas.

Se a mensagem for “Usuário ou senha incorretos”, confira o login e digite a senha atual manualmente, usando o olho para conferir caracteres e espaços. Verifique se o preenchimento automático ainda usa a senha anterior. Essas são possibilidades a verificar, não uma confirmação da causa de cada falha. Informe ao administrador o usuário, a mensagem e o horário do problema, sem divulgar a senha.

`gerar_codigo_recuperacao` apenas emite o código; a senha muda quando a recuperação é concluída no aplicativo. Já `definir_senha_usuario` troca a senha imediatamente pelo SQL. Se houver uma troca posterior no aplicativo, passa a valer a última senha escolhida ali, substituindo a definida antes por SQL.

Teste remoto de 21/09/2026 em `supabase/tests/password-persistence-validation.sql`, com conta temporária e rollback, confirmou login após esses fluxos, logout e expiração da sessão/código. Idades de senha de 3 e 30 dias foram simuladas por timestamps; não houve espera real de dias nem alteração de senhas dos funcionários.

O banco guarda somente um **hash** em `private.credenciais.senha_hash`. Não é possível recuperar a senha original a partir dele. A aplicação não tem permissão para consultar essa tabela.

Para redefinir uma senha pelo SQL Editor:

```sql
select public.definir_senha_usuario(
  p_usuario => 'user_pessoa2',
  p_senha => '' -- PREENCHA com a nova senha
);
```

Isso encerra todas as sessões dessa pessoa. Ela deverá entrar novamente com a nova senha. Para desativar uma conta ou mudar seu perfil, edite `ativo` ou `perfil` na tabela `usuarios`.

## Proteções implementadas

- Senhas novas usam bcrypt com custo 12 e salt aleatório. Os hashes existentes foram migrados, preservando as senhas.
- A sessão usa token aleatório de 256 bits. O banco guarda somente seu hash SHA-256; o dispositivo guarda o token de sessão, não a senha digitada.
- Sessões duram até sete dias, são verificadas em cada operação e revogadas ao sair, desativar a conta ou redefinir a senha. Até dez sessões simultâneas por usuário; as mais antigas são removidas ao ultrapassar esse limite.
- Dez tentativas incorretas provocam espera de até 15 minutos. A limitação usa 1.024 grupos fixos por hash do login para abranger nomes inexistentes sem crescimento ilimitado; nomes distintos podem compartilhar o limite.
- Consultas diretas às tabelas são bloqueadas para o aplicativo. As funções exigem sessão válida e conferem perfil e autoria. Funcionários consultam/editam seus envios; somente administradores apagam.
- Cadastro e redefinição de senha são funções exclusivas do administrador do banco. Não usam Vault, chave `service_role` ou o serviço Supabase Auth.

Referências: [hash de senha no PostgreSQL](https://www.postgresql.org/docs/17/pgcrypto.html#PGCRYPTO-PASSWORD-HASHING-FUNCS) e [gestão de sessões OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
