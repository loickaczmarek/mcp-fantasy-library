# Tutorial MCP Server Typescript

L'objectif de ce tutoriel est de créer un premier server MCP de type `stdio` en Typescript, et qui donne accès à une base de donnée locale.

Pour avoir plus d'informations sur ce qu'est le format MCP : https://modelcontextprotocol.io/introduction

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

Puis, vérifier que ça fonctionne : 
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

Build le code et lancer : 
```shell
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get-book-description", "arguments" : {}}}
EOF
      ) | npm run dev
```

Si tout se passe bien, le message "Hello world !" devrait apparaître en sortie.

#### Connection à la base



## Utilisation ressource

listing tool : 
```
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF
) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

call tool :
```
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get-book-description", "arguments" : {"name":"Germinal"}}}
EOF
    ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

listing resources :
```
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}
EOF
   ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```

call resources :
```
( cat <<\EOF
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"example-client","version":"1.0.0"},"capabilities":{}}}
{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"postgres://admin@localhost:5432/clients/schema"}}
EOF
    ) | npm run dev -- postgresql://admin:password@localhost:5432/bibliotheque
```