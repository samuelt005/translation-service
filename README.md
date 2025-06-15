# Sistema de Tradução Assíncrona com Microserviços

Este projeto implementa um sistema de tradução de textos baseado em uma arquitetura de microserviços. Ele foi projetado para ser resiliente e escalável, utilizando uma fila de mensagens para comunicação assíncrona entre os serviços.

O sistema é composto por uma API REST que recebe requisições de tradução, um serviço de worker que processa essas requisições, e um front-end simples para interação do usuário.

## Índice

- [Arquitetura](#arquitetura)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Como Executar o Projeto](#como-executar-o-projeto)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração](#configuração)
  - [Iniciando os Serviços](#iniciando-os-serviços)
- [Como Usar](#como-usar)
  - [Usando o Front-end](#usando-o-front-end)
  - [Usando a API Diretamente (via cURL)](#usando-a-api-diretamente-via-curl)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Monitoramento](#monitoramento)

## Arquitetura

O sistema é dividido em componentes que interagem de forma desacoplada:

1.  **Front-end (`index.html`)**: Uma interface de usuário simples em HTML, CSS e JavaScript puro que permite enviar textos para tradução e verificar o status do processo.
2.  **API de Tradução (`translation-api`)**: Um serviço Node.js com Express que expõe endpoints REST. Ele é a porta de entrada do sistema.
    - Recebe a requisição de tradução.
    - Gera um ID único para o pedido (`requestId`).
    - Salva o estado inicial (`queued`) no banco de dados.
    - Publica a tarefa de tradução em uma fila no RabbitMQ.
    - Responde imediatamente ao cliente com o `requestId`.
3.  **Worker de Tradução (`translation-worker`)**: Um serviço Node.js que consome mensagens da fila do RabbitMQ.
    - Pega uma tarefa da fila.
    - Atualiza o status da requisição para `processing`.
    - Chama um serviço externo (DeepL API) para realizar a tradução.
    - Atualiza o status para `completed` (com o texto traduzido) ou `failed` (com uma mensagem de erro) no banco de dados.
4.  **Fila de Mensagens (RabbitMQ)**: Atua como um message broker, garantindo a comunicação assíncrona e a persistência das tarefas, mesmo que o worker esteja temporariamente indisponível.
5.  **Banco de Dados (MySQL)**: Armazena o estado de todas as requisições de tradução, incluindo os textos original e traduzido, status e timestamps.



## Tecnologias Utilizadas

- **Back-end**: Node.js
- **API**: Express.js, Cors
- **Comunicação Assíncrona**: RabbitMQ (com `amqplib`)
- **Banco de Dados**: MySQL (com Sequelize ORM)
- **Containerização**: Docker e Docker Compose
- **API de Tradução Externa**: DeepL API
- **Utilitários**: `dotenv`, `uuid`, `axios`, `http-status`

## Funcionalidades

-   Envio de textos para tradução via uma API REST.
-   Processamento assíncrono que não bloqueia o cliente.
-   Consulta de status da tradução em tempo real (`queued`, `processing`, `completed`, `failed`).
-   Persistência de todas as requisições e seus resultados.
-   Interface web simples para facilitar os testes.

## Como Executar o Projeto

### Pré-requisitos

-   [Docker](https://www.docker.com/get-started) instalado e em execução.
-   [Docker Compose](https://docs.docker.com/compose/install/) instalado.
-   Uma chave da **DeepL API**. Você pode obter uma no plano gratuito [aqui](https://www.deepl.com/pro-api).

### Configuração

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/samuelt005/translation-service.git
    cd translation-service
    ```

2.  **Crie o arquivo de configuração de ambiente:**
    Na raiz do projeto, crie um arquivo chamado `.env` a partir do exemplo `.env.example`.

### Iniciando os Serviços

Com o Docker em execução, navegue até a raiz do projeto e execute o seguinte comando:

```bash
docker-compose up --build
```

## Como Usar

### Usando o Front-end

A maneira mais fácil de interagir com o sistema é através da interface web.

1.  Abra o arquivo `index.html` (localizado na pasta `front-end`) em seu navegador.
2.  Digite o texto que deseja traduzir, selecione o idioma de destino e clique em **"Enviar Tradução"**.
3.  A interface irá automaticamente preencher o `requestId` e começar a verificar o status a cada 2 segundos, atualizando os resultados na tela em tempo real.

### Usando a API Diretamente (via cURL)

#### 1. Criar uma nova tradução

Faça uma requisição `POST` para o endpoint `/translations`.

```bash
curl -X POST http://localhost:3000/translations \
-H "Content-Type: application/json" \
-d '{"text": "How are you?", "targetLanguage": "es"}'
```

A resposta será um JSON informando que a requisição foi aceita, junto com o ID:

```json
{
  "message": "Translation request received and is being processed.",
  "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

#### 2. Verificar o status da tradução

Use o `requestId` recebido na etapa anterior para fazer uma requisição `GET`.

```bash
curl http://localhost:3000/translations/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

A resposta irá refletir o estado atual do processamento:

-   **Processamento concluído:**
    ```json
    {
        "id": 1,
        "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "originalText": "How are you?",
        "targetLanguage": "es",
        "translatedText": "¿Cómo estás?",
        "status": "completed",
        "errorMessage": null,
        "createdAt": "...",
        "updatedAt": "..."
    }
    ```
-   **Falha no processamento:**
    ```json
    {
        "id": 2,
        "requestId": "...",
        "originalText": "...",
        "targetLanguage": "xx",
        "translatedText": null,
        "status": "failed",
        "errorMessage": "DeepL API Error: 400 - \"target_lang\" not supported.",
        "createdAt": "...",
        "updatedAt": "..."
    }
    ```

## Estrutura do Projeto

```
/
├── docker-compose.yml       # Orquestra todos os serviços
├── .env                     # (Local) Configurações e segredos
├── front-end/
│   ├── index.html           # Front-end para testes
├── README.md                # Esta documentação
├── translation-api/         # Microserviço da API
│   ├── src/
│   ├── Dockerfile
│   └── package.json
└── translation-worker/      # Microserviço do Worker
    ├── src/
    ├── Dockerfile
    └── package.json
```

## Monitoramento

Você pode monitorar a fila de mensagens acessando a interface de gerenciamento do RabbitMQ:

-   **URL**: `http://localhost:15672`
-   **Usuário**: `guest`
-   **Senha**: `guest`

Lá você poderá visualizar a fila `translation_tasks` e as mensagens que estão aguardando para serem processadas.
