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

## Utilisation outil

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