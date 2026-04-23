# ImobTech API

API REST para gerenciamento de clientes.

## Pré-requisitos

- **Node.js >= 22** (utiliza ESM com `import` e top-level `await`)
- **Docker** (opcional, para rodar o banco de dados localmente)

## Instalação

```bash
git clone https://github.com/mvt-dev/imobtech-api.git
cd imobtech-api
npm install
```

## Configuração

Copie o arquivo `.env.sample` para `.env` e preencha as variáveis:

```bash
cp .env.sample .env
```

Edite o `.env` com as configurações do seu ambiente:

```env
VERSION=1.0.0
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/imobtech
```

## Migrations

Execute as migrations para criar as tabelas no banco de dados:

```bash
npx knex migrate:latest
```

## Executando

```bash
npm run start
```

Para desenvolvimento com hot-reload:

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`.

## Documentação

A documentação da API é gerada automaticamente usando Swagger. Acesse `http://localhost:3000/docs` para visualizar a documentação interativa.

## Testes

```bash
npm run test
```

## Docker

O Dockerfile inclui Node.js 22 e PostgreSQL no mesmo container, sem necessidade de configuração externa.

### Build

```bash
docker build -t imobtech-api .
```

### Executar

```bash
docker run -p 3000:3000 imobtech-api
```

O container inicializa o PostgreSQL, cria o banco de dados, executa as migrations e inicia a aplicação automaticamente.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /client | Listar clientes com filtros e paginação |
| GET | /client/:id | Buscar cliente por id |
| POST | /client | Criar cliente |
| PUT | /client/:id | Atualizar cliente |
| PATCH | /client/status | Atualizar status de múltiplos clientes |
| DELETE | /client/:id | Remover cliente (soft delete) |
| GET | /docs | Documentação Swagger |

## Principais Decisões Técnicas

- **PostgreSQL como banco de dados:** banco relacional robusto, com suporte a constraints (unique para document), índices eficientes e busca case-insensitive com ILIKE. Ideal para dados estruturados como cadastro de clientes, garantindo integridade referencial e consistência dos dados.

- **Arquitetura em camadas (Route → Service → Model):** separação clara de responsabilidades — as rotas tratam HTTP, os services contêm a lógica de negócio e validação, e os models lidam exclusivamente com o banco de dados. Facilita manutenção, testabilidade e evolução independente de cada camada.

- **Express v5:** versão mais recente do framework, com melhor suporte a handlers assíncronos e tratamento de erros.

- **Knex como query builder:** oferece flexibilidade para construir queries dinâmicas (filtros, paginação, busca ILIKE) sem a complexidade de um ORM completo, mantendo o SQL legível e o controle sobre as queries.

- **Zod v4 para validação:** validação de dados na camada de service com schemas declarativos e type-safe. Utiliza `z.discriminatedUnion` para validar CPF ou CNPJ conforme o tipo do cliente (PF/PJ), evitando duplicação de regras.

- **Constantes centralizadas:** status (`ACTIVE`, `INACTIVE`, `REMOVED`), tipos (`PF`, `PJ`) e mensagens de erro (`INVALID-DATA`, `NOT-FOUND`, `DUPLICATED`, `INTERNAL`) extraídos em arquivos dedicados (`src/constant/`), eliminando strings hardcoded e facilitando refatorações.

- **Soft delete:** a remoção de clientes altera o status para `REMOVED` ao invés de excluir o registro, preservando o histórico de dados.

- **Paginação com contagem total:** a listagem retorna `{ data, total, page, page_size }`, permitindo que o frontend construa a navegação de páginas. Busca ordenada por nome com limite máximo de 50 itens por página.

- **Validação de documentos por máscara:** CPF e CNPJ são validados por regex com máscara, garantindo formato consistente no banco sem a complexidade de validação de dígitos verificadores.

- **Testes unitários com Jest:** cada camada (model, service, route) possui testes co-localizados com mocks isolados — model mocka o banco (knex), service mocka o model, e route mocka o service usando supertest. Garante que cada camada é testada independentemente.

- **Documentação com Swagger/OpenAPI:** documentação interativa gerada automaticamente a partir de anotações `@openapi` nas rotas, disponível em `/docs`, facilitando testes e integração.

- **ESM nativo:** o projeto utiliza ES Modules (`"type": "module"`) com `import/export` e top-level `await`, sem necessidade de transpilação.

- **Docker all-in-one:** container único com Node.js e PostgreSQL para simplificar o setup de desenvolvimento e demonstração, com entrypoint que inicializa o banco, executa migrations e inicia a aplicação.
