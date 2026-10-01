A partir de agora eu quero que voce de incio a esse projeto e faça tudo que puder sozinho, quero que vc tenha acesso a tudo do meu pc e até acesso externo se puder para fazer as tarefas necessárias do banco de dados. Eu autorizo que faça tudo. E use o PDF para ter uma ideia do lauout.
1. Objetivo do aplicativo
O Hashimoto Frota será utilizado por funcionários que trabalham em campo, principalmente peões que não possuem muita familiaridade com tecnologia.
O aplicativo deverá permitir:
1.	Registrar equipes e veículos da frota;
2.	Registrar manutenções dos veículos;
3.	Consultar o histórico de registros enviados.
O aplicativo será distribuído internamente como um APK Android. Não será publicado na Google Play Store.
Durante o desenvolvimento, utilizar Expo e Expo Go. Posteriormente, gerar o APK usando EAS Build.
2. Tecnologias obrigatórias
Utilizar:
•	React Native;
•	Expo;
•	Expo Router;
•	TypeScript;
•	Supabase como banco de dados e backend;
•	Supabase Auth para autenticação;
•	PostgreSQL do Supabase;
•	Row Level Security, RLS, para proteger os dados;
•	EAS Build para gerar o APK Android.
O projeto deverá utilizar componentes reutilizáveis, código organizado e nomes de arquivos claros.
3. Identidade visual
Nome do aplicativo:
HASHIMOTO FROTA
Utilizar:
•	Fundo principal branco ou quase branco;
•	Laranja principal: #ff6200;
•	Azul principal: #0b2c44;
•	Textos escuros em azul;
•	Bordas suaves;
•	Cantos arredondados;
•	Espaçamentos confortáveis;
•	Botões grandes;
•	Ícones intuitivos;
•	Alto contraste;
•	Interface simples para uso em campo.
Utilizar a logo enviada como referência visual.
A logo deve possuir:
•	Um caminhão moderno e simples na parte superior;
•	A palavra HASHIMOTO abaixo do caminhão;
•	A palavra FROTA abaixo de HASHIMOTO;
•	O caminhão deve ser utilizado na identidade visual e no cabeçalho;
•	Não repetir o caminhão nos botões inferiores de navegação.
4. Fluxo de telas
O fluxo principal deverá ser:
Tela de carregamento
        ↓
Tela principal
        ↓
Registro ou Manutenção
O Histórico poderá ser acessado:
•	Pelo card Histórico da tela principal;
•	Pelo ícone de histórico no cabeçalho.
5. Tela de carregamento
Criar uma tela inicial com:
•	Fundo branco ou azul escuro;
•	Caminhão da logo em destaque;
•	Texto HASHIMOTO;
•	Texto FROTA;
•	Botão Entrar;
•	Visual simples e profissional;
•	Pequena animação opcional de carregamento.
O caminhão deve ser moderno, limpo e visualmente relacionado a frota e transporte.
6. Tela principal
Depois da tela de carregamento, o usuário não deverá abrir diretamente em um serviço.
Criar uma tela principal com a mensagem:
“Que tipo de registro você pretende utilizar hoje?”
Adicionar três cards:
Card Registro
•	Ícone de formulário ou prancheta;
•	Texto Registro;
•	Descrição curta: Equipe e veículo;
•	Ao tocar, abrir a tela Registro da Frota.
Card Manutenção
•	Ícone de chave inglesa;
•	Texto Manutenção;
•	Descrição curta: Serviço e custo;
•	Ao tocar, abrir a tela Manutenção da Frota.
Os cards Registro e Manutenção devem ficar lado a lado, dividindo a largura da tela.
Card Histórico
Abaixo dos dois cards, criar um card menor em altura e ocupando toda a largura disponível.
O card deverá possuir:
•	Ícone de histórico;
•	Texto Histórico;
•	Descrição: Consulte os registros enviados;
•	Ao tocar, abrir a tela de histórico.
7. Cabeçalho
As telas internas devem possuir um cabeçalho com:
•	Logo Hashimoto Frota;
•	Ícone de histórico;
•	Ícone de menu;
•	Espaçamento adequado;
•	Fundo branco;
•	Linha inferior discreta.
O ícone de histórico deverá abrir a tela de histórico.
8. Rodapé de navegação
O rodapé deverá ser fixo e possuir somente dois botões:
1.	Registro;
2.	Manutenção.
Cada botão deve possuir:
•	Ícone intuitivo;
•	Texto;
•	Estado selecionado;
•	Cor laranja quando ativo;
•	Cor cinza ou azul claro quando inativo.
Não criar um terceiro botão de Histórico no rodapé.
O Histórico será acessado pelo card da tela principal ou pelo cabeçalho.
9. Tela Registro da Frota
Criar um formulário mobile com os seguintes campos:
1.	Data;
2.	Contrato;
3.	Número de equipes;
4.	Equipe 1 - Responsável;
5.	Equipe 1 - Placa do veículo.
Regras
•	O campo Data deve utilizar um seletor de data ou date picker;
•	O campo Número de equipes deve permitir escolher a quantidade;
•	Se o usuário escolher mais de uma equipe, criar dinamicamente os blocos Equipe 2, Equipe 3 etc.;
•	Cada equipe deverá possuir um responsável e um veículo;
•	O botão Salvar registro deve ficar visível e destacado;
•	Depois de salvar, exibir a mensagem Registro enviado com sucesso.
10. Tela Manutenção da Frota
Criar um formulário mobile com:
1.	Data;
2.	Tipo de manutenção;
3.	Motorista;
4.	Contrato;
5.	Placa;
6.	Modelo do veículo;
7.	Custo.
Regras importantes
O campo Placa deverá ser um dropdown pesquisável.
O usuário poderá digitar para filtrar, mas não poderá salvar um texto digitado manualmente.
Ele deverá obrigatoriamente tocar em uma opção da lista.
Depois que o usuário escolher uma placa:
•	Exibir uma visualização com a placa;
•	Exibir o modelo associado;
•	Preencher automaticamente o campo Modelo do veículo;
•	Deixar o modelo como somente leitura;
•	Não permitir que o usuário altere manualmente o modelo;
•	Se a placa for removida, limpar também o modelo.
O campo Custo deverá:
•	Aceitar somente números;
•	Utilizar máscara de moeda brasileira;
•	Exibir valores como R$ 480,00;
•	Não aceitar letras.
Depois de salvar, exibir:
Manutenção registrada com sucesso.
11. Comportamento dos dropdowns
Todos os dropdowns deverão funcionar da mesma forma:
•	Ao tocar no campo, abrir uma caixa com opções;
•	Mostrar uma área de pesquisa;
•	Permitir digitação para filtrar;
•	Filtrar por partes do texto;
•	Ignorar diferenças entre letras maiúsculas e minúsculas;
•	Permitir pesquisa sem acentos;
•	Exigir que o usuário toque em uma opção;
•	Nunca aceitar apenas o texto digitado;
•	Fechar a lista depois da seleção;
•	Exibir claramente o valor selecionado;
•	Possuir opção para limpar a seleção.
Aplicar esse comportamento aos campos:
•	Funcionário;
•	Motorista;
•	Contrato;
•	Placa;
•	Tipo de manutenção;
•	Número de equipes.
O modelo do veículo não será um dropdown independente. Ele será preenchido automaticamente com base na placa selecionada.
12. Tela Histórico
Criar uma tela com:
•	Título Histórico;
•	Campo de busca;
•	Busca por placa;
•	Busca por contrato;
•	Lista de registros enviados;
•	Identificação visual para Registro e Manutenção;
•	Data;
•	Placa;
•	Contrato;
•	Valor da manutenção, quando existir;
•	Botão Ver todos os registros.
Exemplos de registros:
•	Registro de equipe — CTR-2026-014 — RTE-4J28;
•	Manutenção preventiva — RTE-4J28 — Carlos Oliveira — R$ 480,00.
13. Banco de dados Supabase
Não criar uma tabela separada apenas para consultas.
As consultas serão feitas diretamente nas tabelas de referência.
Criar as seguintes tabelas:
usuarios
•	id;
•	nome;
•	email;
•	perfil;
•	ativo;
•	created_at.
funcionarios
•	id;
•	nome;
•	ativo;
•	created_at.
veiculos
•	id;
•	placa;
•	modelo;
•	tipo;
•	ativo;
•	created_at.
contratos
•	id;
•	nome;
•	ativo;
•	created_at.
tipos_manutencao
•	id;
•	nome;
•	ativo;
•	created_at.
registros_frota
•	id;
•	data;
•	contrato_id;
•	numero_equipes;
•	usuario_id;
•	created_at.
registro_equipes
•	id;
•	registro_frota_id;
•	numero_equipe;
•	responsavel_id;
•	veiculo_id;
•	created_at.
manutencoes
•	id;
•	data;
•	tipo_manutencao_id;
•	motorista_id;
•	contrato_id;
•	veiculo_id;
•	custo;
•	usuario_id;
•	created_at.
Utilizar chaves estrangeiras entre as tabelas.
Não salvar apenas nomes e placas como textos soltos quando for possível utilizar os IDs das tabelas relacionadas.
Exemplo:
responsavel_id = 12
veiculo_id = 5
contrato_id = 3
A interface exibirá os nomes, placas e contratos, mas o banco armazenará os identificadores.
14. Segurança
Configurar:
•	Supabase Auth;
•	Login dos usuários;
•	Controle de sessão;
•	RLS nas tabelas;
•	Permissões para usuários autenticados;
•	Perfil de administrador futuramente.
Nunca colocar a chave service_role dentro do aplicativo.
Usar somente a URL pública e a chave pública do Supabase no aplicativo.
15. Dados dos veículos
Cadastrar os veículos abaixo na tabela veiculos.
Manter a placa associada ao modelo correspondente.
Os modelos que possuem Alterar devem ser mantidos como pendentes, sem inventar um modelo definitivo. Utilizar a descrição PENDENTE - ALTERAR 1, PENDENTE - ALTERAR 2 etc., até que sejam corrigidos.
Placa	Modelo
BBE9E35	PENDENTE - ALTERAR 1
BBE9E90	M.BENZ/ACCELO 815 CE
BBH1E97	M.BENZ/ACCELO 815 CE
BBH1E99	M.BENZ/ACCELO 815
BDU9C81	M.BENZ/ACCELO 815 CE
BDX3B59	Ford K 1.0 SE/SE PLUS Tivct flex 5P
BDY9I58	M.BENZ/ACCELO 815 CE
BEA5H11	VW/9. 170 DRC 4X2
BEY3F01	VW/9. 170 DRC 4X2
CZA1C09	GMC/16.220
ELW7J98	FIAT/STRADA FREEDOM CC
FHB8H95	VW/8. 160 DRC 4X2
FJT9I54	PENDENTE - ALTERAR 2
FOW2B35	PENDENTE - ALTERAR 3
GBQ9366	VW/8. 160 DRC 4X2
GEI8C98	VW/NOVA SAVEIRO RB MBVS
GIG9B72	PENDENTE - ALTERAR 4
JAJ1C55	VW/9. 170 DRC 4X2
KNC1076	PENDENTE - ALTERAR 5
KNH7B51	PENDENTE - ALTERAR 6
KQS8B71	M. BENZ/ATEGO 2430
KRK8F40	PENDENTE - ALTERAR 7
KRL8G19	M.BENZ/ACCELO 815 CE
KRN6A41	M.BENZ/ACCELO 815 CE
KRN6J98	PENDENTE - ALTERAR 8
KTV1201	PENDENTE - ALTERAR 9
KWM9F69	VW/17.190 WORKER
KXA6H28	M.BENZ/ACCELO 815 CE
KXC7C13	M.BENZ/ACCELO 815 CE
KXL9F47	VW/8. 160 DRC 4X2
KXU6H41	VW/8. 160 DRC 4X2
KYH5D78	PENDENTE - ALTERAR 10
KYX8A58	VW/17 . 190 CRM 4X2 EP
KZF4D30	FIAT/STRADA ADVENTURE CD
LMH3C97	M.BENZ/ACCELO 815 CE
LMH3G88	M.BENZ/ACCELO 815 CE
LMO7B21	VW/9. 170 DRC 4X2
LMP9H12	FORD
LMP9H23	FORD
LQK3B38	M.BENZ/1718
LQN6C18	RENAULT/SANDERO EXP1016V
LRB4716	I/KIA UK2500 HD SC
LRJ7G35	FORD
LRJ7G95	FORD
LRJ9B37	FORD
LSG7222	M.BENZ/ATEGO 1719
LSG7C27	M.BENZ/ATEGO 1719
LSJ9C70	M.BENZ/ACCELO 815 CE
LSK7B48	M.BENZ/ACCELO 815 CE
LSK7J36	M.BENZ/ACCELO 815 CE
LSK8E20	M.BENZ/ACCELO 815 CE
LSM9J59	M.BENZ/ACCELO 815 CE
LSN8D43	M.BENZ/ACCELO 815 CE
LSP7F42	M.BENZ/ACCELO 815 CE
LSV7340	HYUNDAI/HR HDB
LTD6433	HYUNDAI/HR HDB
LTQ7F95	VW 15.190
LTV8D48	M.BENZ/ACCELO 815 CE
LTX9J56	M.BENZ/ACCELO 815 CE
LUE3B62	M.BENZ/ACCELO 815 CE
LUH8E33	M.BENZ/ACCELO 815 CE
LUL8A32	PENDENTE - ALTERAR 11
LUL9I66	M.BENZ/ACCELO 815 CE
LUM3D11	M.BENZ/ACCELO 815 CE
LUO1G86	M.BENZ/ACCELO 815 CE
LUT7G94	M.BENZ/ACCELO 815 CE
QUJ3E09	SAVEIRO
RFY4C30	PENDENTE - ALTERAR 12
RIX1J87	M.BENZ/ACCELO 815 CE
RJA0I50	M.BENZ/ACCELO 815 CE
RJF4J47	M.BENZ/ACCELO 815 CE
RJG0F36	M.BENZ/ACCELO 815 CE
RJO0I33	M.BENZ/ACCELO 815 CE
RJP3C12	VW/9. 170 DRC 4X2
RJW0J69	M.BENZ/ACCELO 815 CE
RKB0A29	M.BENZ/ACCELO 815 CE
RKE3H26	M.BENZ/ACCELO 815 CE
RKI3I58	M.BENZ/ACCELO 815 CE
RKK0A22	M.BENZ/ACCELO 815 CE
SP-6539	RETROESCAVADEIRA
SP-7188	MINI RETROESCAVADEIRA
SSD8A74	VW/26.260 CRM 6X2
Os registros SP-6539 e SP-7188 devem permanecer cadastrados como equipamentos, mesmo não seguindo o padrão comum de placa de caminhão.
16. Dados dos funcionários
Cadastrar os nomes abaixo na tabela funcionarios.
A opção Parado na Base parece representar um status, não uma pessoa. Mantê-la separada ou marcada como status até confirmação.
•	Parado na Base
•	Ademilson Cezar de Mendonça
•	Ademir Jorge Barbosa da Silva
•	Adriano Firmino da Silva
•	Adriana da Silva Santos
•	Afonso Alves de Almeida
•	Alberto da Silva Rodrigues
•	Anderson da Conceição Fonseca
•	Anderson Donato Costa
•	André Luiz da Silva Pereira
•	Antonio Vanderleiz da Paz
•	Auricélio Andrade Oliveira
•	Carlos de Oliveira Barreto
•	Carlos Eduardo Alves Germano
•	Carlos Renato Dantas do Nascimento
•	Carlos Vinicius Polito Rodrigues
•	Claudio Cordeiro de Sousa
•	Clebisom de Azevedo Vieira
•	Daniel Gomes da Silva
•	Davi Bezerra Félix
•	David Decroix Viana
•	Davi Venancio Rodrigues
•	Djavan Henrique Vieira Grilo
•	Edilberto Sá Vianna da Silva Junior
•	Edreque Feliciano da Silva Santos
•	Edy Carlos Abreu Barreto
•	Erick Moraes Muniz
•	Eumir Silva da Gama Junior
•	Fabiano Suguiyama Vieira
•	Fabio Lima de Amorim
•	Fernando Junior Abreu do Nascimento
•	Fernando Pereira dos Prazeres
•	Fernando Ribeiro da Silva
•	Gabriel Álvaro Moreira
•	Gabriel Henrique da Silva Neves
•	Gilberto Bastos
•	Gilmar Miguel Rodrigues Soares
•	Gustavo Martins Gomes da Silva
•	Israel Rodrigues de Oliveira
•	Jean de Souza Silva
•	Jhoenis Lima Nunes
•	Jocimar de Araújo Eufrásio
•	Jocimar Lino Castro Areas
•	Joel Guilherme de Souza Junior
•	Johnatan Luiz Gomes de França
•	Jonhcklem Barreto da Cruz
•	José Baia da Silva
•	José Edvanio da Silva
•	Julio Cesar Duarte Pereira
•	Juraci Martins de Araújo
•	Leandro Franciscus Azeredo Alves da Silva
•	Leandro Teixeira Santos
•	Lucas Cordeiro Pereira
•	Lucas Melgaço da Silva
•	Lucas Severiano de Oliveira Caldas
•	Luis Henrique Nascimento dos Santos
•	Luis Jose Pereira
•	Luiz Felipe Costa Soares Rocha
•	Luiz Fernando de Souza Rabello
•	Luiz Ricardo Mazzucchelli Ferreira
•	Marcio Flores dos Santos
•	Marcos Alexandre Souza da Silva
•	Marcos Antonio Cordeiro Felismino
•	Marcos Antonio Garcez Serqueira
•	Mauro Cesar Alves Ferreira de Souza
•	Max Sandro da Costa Figueredo
•	Maximiliano da Silva Pereira
•	Paulo Ricardo Tito
•	Pedro Paulo Mendes Baldez
•	Ramon Lopes do Livramento da Silva
•	Reinaldo da Silva Barros Junior
•	Roberto David Silva
•	Rodrigo Melo
•	Robson Luiz Ribeiro Pimentel
•	Robson Pargas Novaes
•	Rodrigo dos Santos Dias
•	Rodrigo Eduardo Carvalho de Oliveira
•	Rogerio Rangel Rosa
•	Severino Alves Barreto
•	Sérgio Reis de Jesus Bittencourt
•	Sidnei Carvalho da Silva
•	Silvanio Madureira Campos
•	Thiago Alexandre Frutuoso de Lima
•	Thiago Barcello Alves
•	Thomaz da Silva
•	Túlio da Silva Mariano
•	Uilliam Simões Fernandes
•	Vagner Soares Marinho
•	Valter Pereira da Silva
•	Valdinei Machado De Laia
•	Vitor Cesar Silva Domingos Oliveira
•	Wagner Souza de Oliveira
•	Wagner José da Silva
•	Wellington Tavares
•	Wallace Felizardo de Queiroz
•	Walter Cardoso Gonzaga
•	Wanderson Sabino Cabral
•	William de Souza Campos Chagas
•	Willis Martins Ferreira
•	Willye Cristiano Pessanha Ramos
•	Wilson da Silva Ramos
•	Wilson Vieira Mendes
•	Wislley Costa Santos
17. Dados dos contratos
Cadastrar na tabela contratos:
•	Belford Roxo;
•	Buri;
•	Campos dos Goytacazes;
•	Duque de Caxias;
•	Magé;
•	Natal;
•	Paty do Alferes;
•	São Gonçalo;
•	Saquarema.
18. Tipos de manutenção iniciais
Cadastrar inicialmente:
•	Preventiva;
•	Corretiva;
•	Revisão;
•	Pneus;
•	Elétrica;
•	Mecânica;
•	Funilaria;
•	Outros.
19. Variáveis de ambiente
Criar um arquivo .env com:
EXPO_PUBLIC_SUPABASE_URL=URL_DO_PROJETO
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA
Não expor chaves privadas no código.
20. Desenvolvimento
Começar criando o projeto com Expo e Expo Router.
Depois:
1.	Configurar o VS Code;
2.	Instalar as dependências;
3.	Criar a estrutura de pastas;
4.	Criar as telas;
5.	Criar a navegação;
6.	Criar os componentes de dropdown;
7.	Criar o cliente Supabase;
8.	Criar as tabelas;
9.	Inserir os dados iniciais;
10.	Conectar os formulários;
11.	Criar o histórico;
12.	Configurar autenticação;
13.	Configurar RLS;
14.	Testar no Expo Go;
15.	Testar em um aparelho Android real;
16.	Gerar o APK.
Para testar durante o desenvolvimento:
npx expo start
21. Geração do APK
Configurar o EAS Build.
Criar um perfil de APK interno no eas.json:
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
Gerar o APK com:
eas build -p android --profile preview
O APK deverá ser instalável diretamente nos celulares Android dos funcionários, sem publicação na Play Store.
22. Critérios de conclusão
Considerar o projeto concluído somente quando:
•	O aplicativo abrir na tela de carregamento;
•	A tela principal aparecer depois do carregamento;
•	Os cards Registro e Manutenção aparecerem lado a lado;
•	O card Histórico aparecer abaixo;
•	O rodapé possuir somente Registro e Manutenção;
•	O histórico funcionar pelo cabeçalho;
•	Os dropdowns permitirem pesquisa;
•	O texto digitado não for aceito sem seleção;
•	A placa escolhida preencher automaticamente o modelo;
•	O Registro da Frota for salvo no Supabase;
•	A Manutenção for salva no Supabase;
•	O Histórico consultar os registros;
•	Os dados dos funcionários, veículos e contratos vierem do Supabase;
•	As regras RLS estiverem configuradas;
•	O aplicativo funcionar em um aparelho Android real;
•	O APK puder ser instalado e aberto sem Expo Go;
•	O aplicativo não depender do computador do desenvolvedor para funcionar.

