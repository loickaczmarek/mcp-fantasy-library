import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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