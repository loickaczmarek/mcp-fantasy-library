import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get-book-description") {
        return {
            content: [{ type: "text", text: "Hello World !" }],
            isError: false,
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});

async function runServer() {
    const transport = new StdioServerTransport();
    console.log("Starting MCP Fantasy Library server")
    await server.connect(transport);
}

runServer().catch(console.error);