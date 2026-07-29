#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const FIELD_RULES = {
  subject: {
    label: "subject",
    patterns: [
      /\b(subject|character|object|scene|product|person)\b/i,
      /^\s*(a|an|the)\s+[a-z][\w-]*/i,
    ],
  },
  motion: {
    label: "motion",
    patterns: [/\b(move|moves|moving|walk|run|turn|rotate|drift|rise|fall|motion|action)\w*\b/i],
  },
  camera: {
    label: "camera treatment",
    patterns: [/\b(camera|shot|angle|close-up|wide|tracking|dolly|pan|tilt|zoom|static)\b/i],
  },
  visual_details: {
    label: "visual details",
    patterns: [/\b(light|lighting|color|texture|style|background|foreground|composition|visual)\w*\b/i],
  },
  audio_direction: {
    label: "audio direction",
    patterns: [/\b(audio|sound|music|voice|dialogue|silence|ambient|foley)\b/i],
  },
};

function analyzeBrief(brief) {
  const detected = [];
  const missing = [];

  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    if (rule.patterns.some((pattern) => pattern.test(brief))) {
      detected.push(field);
    } else {
      missing.push(field);
    }
  }

  const warnings = [];
  if (/\bsilence|silent\b/i.test(brief) && /\bmusic|dialogue|voice|foley\b/i.test(brief)) {
    warnings.push("Audio direction mixes silence with an explicit sound cue; clarify the intended timing.");
  }
  if (/\bstatic (camera|shot)\b/i.test(brief) && /\btracking|dolly|pan|tilt|zoom\b/i.test(brief)) {
    warnings.push("Camera direction mixes a static shot with camera movement; clarify which instruction wins.");
  }

  return {
    valid: missing.length === 0 && warnings.length === 0,
    detected,
    missing,
    warnings,
    questions: missing.map(
      (field) => `What ${FIELD_RULES[field].label} should the brief specify?`,
    ),
  };
}

function buildManifest(input) {
  const analysis = analyzeBrief(input.brief);
  return {
    title: input.title || "Untitled video brief",
    brief: input.brief.trim(),
    intended_duration_seconds: input.duration_seconds ?? null,
    aspect_ratio: input.aspect_ratio || null,
    validation: analysis,
    next_step: analysis.valid
      ? "The brief is structurally complete and ready for human review."
      : "Resolve the missing fields and warnings before generation.",
    scope:
      "This server validates brief structure only. It does not call, control, or claim integration with a video-generation model.",
  };
}

function createServer() {
  const server = new McpServer({
    name: "video-brief-manifest",
    version: "1.0.0",
  });

  server.registerTool(
    "validate_video_brief",
    {
      title: "Validate Video Brief",
      description:
        "Check a draft video brief for subject, motion, camera, visual-detail, and audio-direction signals.",
      inputSchema: {
        brief: z.string().min(20).describe("The draft video brief to validate."),
      },
    },
    async ({ brief }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(analyzeBrief(brief), null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    "build_video_brief_manifest",
    {
      title: "Build Video Brief Manifest",
      description:
        "Return a portable JSON manifest containing the brief, optional delivery constraints, and validation results.",
      inputSchema: {
        title: z.string().max(120).optional(),
        brief: z.string().min(20),
        duration_seconds: z.number().positive().max(3600).optional(),
        aspect_ratio: z
          .enum(["16:9", "9:16", "1:1", "4:3", "3:2", "custom"])
          .optional(),
      },
    },
    async (input) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(buildManifest(input), null, 2),
        },
      ],
    }),
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Video Brief Manifest MCP server failed:", error);
  process.exit(1);
});
