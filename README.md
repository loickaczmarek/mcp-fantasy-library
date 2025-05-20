# Tutorial MCP Server Typescript

L'objectif de ce tutoriel est de créer un premier server MCP de type `stdio` en Typescript, et qui donne accès à une base de donnée locale.

Pour avoir plus d'informations sur ce qu'est le protocol MCP : https://modelcontextprotocol.io/introduction

## Prérequis

- Avoir des bases en javascript
- Avoir Node.js
- Avoir Docker

## Initialisation

On va commencer pas initialiser le projet. Pour ça, nous pouvons commencer par explorer le fichier `package.json`.

Il nous manque le fichier d'entrée `src/index.ts` : il faut donc le créer

Et nous pourrons lancer la commande d'installation des packages de notre choix.

Avec npm : `npm install`

## Premier pas

Nous allons ajouter le minimum nécessaire pour faire tourner le server MCP.
Pour ça, dans `index.ts`, ajouter ceci : 

```javascript
const server = new Server(
    {
        name: "Fantasy Library Database",
        version: "0.1.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    },
);

async function runServer() {
    const transport = new StdioServerTransport();
    console.log("Starting MCP Fantasy Library server")
    await server.connect(transport);
}

runServer().catch(console.error);
```

Nous allons construire et lancer l'application : 

`npm run build && npm run dev`

Si tout se passe bien, vous devriez voir apparaître le message suivant : 
`Starting MCP Fantasy Library server`

## Quelques concepts

Les servers MCP permettent d'exposer des outils, des ressources, des prompts, etc ... ( voir la documentation [ici](https://modelcontextprotocol.io/docs/concepts/architecture) )

Pour l'exercice, nous allons nous concentrer sur deux concepts : 
- l'outil : permet d'effectuer une action précise avec ou sans paramètres. L'usage est stateless, pour un usage ponctuel, et qui n'a pas besoin de garder une connection active, par exemple. C'est comparable à un appel précis d'une API.
- la ressource : permet de donner des accès. L'usage est stateful, l'usage est prévu pour garder une connection ouverte. C'est comparable à une déclaration d'API.

Pour utiliser le server MCP, nous allons injecter des JSON au format JSON RPC, qui est le format utilisé par le protocol MCP.

## Utilisation outil

### Mise en place

Nous avons besoin d'une base de donnée, et pour ça, nous allons utiliser le `docker-compose.yml`

lancer `docker-compose up -d`

Vérifier que la base de donnée est accessible via n'importe quel outil ( exemple d'outil : [DBeaver](https://dbeaver.io/download/))

### Création du tool

#### Exposition

Dans un premier temps, nous allons rendre visible les outils de notre server.
Il faut donc ajouter un handler de requêtes de listing d'outil.

Nous allons aussi en profiter pour déclarer notre premier outil : récupérer la description d'un livre

Dans `index.ts`, il faut ajouter : 

```javascript
// au niveau des imports
import {
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

...

// avant de lancer la fonction runServer()
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get-book-description",
                description: "Get the book description from fantasy library",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                    },
                },
            },
        ],
    };
});
```

Lancer le build : `npm run build`

Puis, vérifier que ça fonctionne avec la method `tools\list` :
```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF
) | npm run dev
```

Parmi la liste des outils, l'outil de récupération de livre devrait être visible dans le résultat.
La description de l'outil est importante : c'est cette description qui sera utilisée par les LLM pour identifier le bon outil !

#### Utilisation

Maintenant que l'outil est listé, nous allons l'utiliser.

Ajoutons ceci : 

```javascript
// import
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// code
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get-book-description") {
        return {
            content: [{ type: "text", text: "Hello World !" }],
            isError: false,
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
```

Build le code et lancer avec la method `tools\call` :
```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get-book-description", "arguments" : {}}}
EOF
      ) | npm run dev
```

Si tout se passe bien, le message "Hello world !" devrait apparaître en sortie.

#### Connection à la base

Il est temps de connecter le server à la base de données.

Pour ça, on va ajouter le nécessaire : 
- un argument pour passer l'url local
- la gestion de la connection
- la requête à exécuter

Dans un premier temps, on va ajouter :

```javascript
// import
import * as pg from "pg";

// code
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Please provide a database URL as a command-line argument");
    process.exit(1);
}

const databaseUrl = args[0];

const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = "";

const pool = new pg.Pool({
    connectionString: databaseUrl,
});
```

cette partie sert à ouvrir une connection à la base de donnée.

Créons également une méthode qui sera utilisé par l'outil : 

```javascript
async function getBookDescription(request : any) {
    const bookName = request.params.arguments?.name as string;

    const client = await pool.connect();
    try {
        await client.query("BEGIN TRANSACTION READ ONLY");
        const result = await client.query(`SELECT description FROM livres WHERE titre = '${bookName}'`);
        return {
            content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
            isError: false,
        };
    } catch (error) {
        throw error;
    } finally {
        client
            .query("ROLLBACK")
            .catch((error) =>
                console.warn("Could not roll back transaction:", error),
            );

        client.release();
    }
}
```

Remplaçons la méthode : 

```javascript
// avant
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get-book-description") {
        return {
            content: [{ type: "text", text: "Hello World !" }],
            isError: false,
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});

// après
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get-book-description") {
        return await this.getBookDescription(request);
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
```

Ensuite, il faut builder et valider avec la method `tools\call` :   

```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get-book-description", "arguments" : {"name":"Culture Code"}}}
EOF
    ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

Une description brève de Culture Code devrait apparaître !

#### Pour aller plus loin

Ajouter des tools pour :

- la liste des livres disponibles
- identifier la personne qui a emprunté le livre donné

## Utilisation ressource

#### Exposition

Comme pour les outils, il faut pouvoir identifier les ressources disponible
Il faut donc ajouter un handler de requêtes de listing de ressources.

```javascript
// imports
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

...

// code
const SCHEMA_PATH = "schema";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        );
        return {
            resources: result.rows.map((row) => ({
                uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
                mimeType: "application/json",
                name: `"${row.table_name}" database schema`,
            })),
        };
    } finally {
        client.release();
    }
});
```

Lancer le build : `npm run build`

Puis, vérifier que ça fonctionne, nous allons requêter avec la method `resources/list` : 

```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}
EOF
   ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

#### Utilisation

Nous allons ajouter le handler d'utilisation de ressources : 

```javascript
// import
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// code
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resourceUrl = new URL(request.params.uri);

    const pathComponents = resourceUrl.pathname.split("/");
    const schema = pathComponents.pop();
    const tableName = pathComponents.pop();

    if (schema !== SCHEMA_PATH) {
        throw new Error("Invalid resource URI");
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
            [tableName],
        );

        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify(result.rows, null, 2),
                },
            ],
        };
    } finally {
        client.release();
    }
});
```

Lançons le build, vérifions que ça fonctionne avec la method `resources/read` :

```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"postgres://admin@localhost:5432/clients/schema"}}
EOF
    ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

Le résultat devrait être les informations de schema de la base de donnée

### Pour aller plus loin

Ce tutoriel est basé sur le server MCP Postgres ( [ici](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) )

Pour le tester en condition réel, l'idéal est de le brancher sur un client MCP.
La liste se trouve là : https://modelcontextprotocol.io/clients

Ce server a été testé et validé avec le client Claude Code et retourne des résultats satisfaisants avec des prompts comme `donnes moi la description du livre Culture Code`