import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as pg from "pg";

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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get-book-description") {
        return await getBookDescription(request);
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});

async function runServer() {
    const transport = new StdioServerTransport();
    console.log("Starting MCP Fantasy Library server")
    await server.connect(transport);
}

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

runServer().catch(console.error);