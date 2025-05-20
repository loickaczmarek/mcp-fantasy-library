# Tutorial MCP Server

## Initialisation

## Premier appel

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