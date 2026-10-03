-- Somente no NOVO banco vazio, após schema-aplicacao.sql. Não cria usuários nem senhas padrão.
-- Dispense este arquivo se os dados dessas duas tabelas forem restaurados de um backup.
BEGIN;
INSERT INTO private.config_login(id,hash_ficticio)
VALUES (true,extensions.crypt(encode(extensions.gen_random_bytes(32),'hex'),extensions.gen_salt('bf',12)))
ON CONFLICT(id) DO NOTHING;
INSERT INTO private.tentativas_login(bucket) SELECT generate_series(0,1023) ON CONFLICT(bucket) DO NOTHING;
COMMIT;
