import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["index.js"],
});

const client = new Client({
  name: "video-brief-manifest-test",
  version: "1.0.0",
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  if (tools.tools.length !== 2) {
    throw new Error(`Expected 2 tools, received ${tools.tools.length}`);
  }

  const result = await client.callTool({
    name: "validate_video_brief",
    arguments: {
      brief:
        "A ceramic robot turns toward camera in a slow tracking shot, with cool rim lighting and quiet ambient room tone.",
    },
  });
  const payload = JSON.parse(result.content[0].text);
  if (!payload.valid || payload.missing.length !== 0) {
    throw new Error(`Unexpected validation result: ${result.content[0].text}`);
  }

  console.log(`Protocol test passed; tools=${tools.tools.map((tool) => tool.name).join(",")}`);
} finally {
  await client.close();
}
