# Video Brief Manifest MCP Server

A small local Model Context Protocol server that checks whether an AI video brief
contains the structural signals needed for a useful human review before
generation begins.

The server is intentionally model-agnostic. It does not call a video-generation
API, send prompts to a hosted service, or claim a direct integration with any
video model.

## Why validate a brief first?

Video prompts often fail because the brief leaves one dimension implicit. The
subject may be clear while the motion is vague, or the visual style may be
detailed while the camera and audio direction are missing. Those gaps are much
cheaper to find before a generation run.

This server checks five practical dimensions:

- subject
- motion
- camera treatment
- visual details
- audio direction

It also flags two common contradictions: asking for both silence and an explicit
sound cue, or combining a static camera with camera movement.

## Tools

### `validate_video_brief`

Accepts a draft brief and returns detected fields, missing fields, warnings, and
clarifying questions.

### `build_video_brief_manifest`

Builds a portable JSON manifest containing the brief, optional duration and
aspect-ratio constraints, validation results, and the next recommended step.

## Install and run

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "video-brief-manifest": {
      "command": "node",
      "args": ["/absolute/path/to/video-brief-manifest-mcp/index.js"]
    }
  }
}
```

Run the protocol-level smoke test:

```bash
npm test
```

## Example brief

> A ceramic robot turns toward camera in a slow tracking shot, with cool rim
> lighting and quiet ambient room tone.

The validator detects all five structural dimensions and returns a clean report.
A shorter brief such as "A robot in a room" produces questions for motion,
camera, visual details, and audio direction.

## Where structured prompt workflows fit

This pattern works independently of any generation backend. It is useful when a
workflow expects one brief to coordinate subject, motion, camera treatment,
visual details, and audio direction. [Muse Video](https://muse-video.app/) is one
example of a prompt-led workflow organized around those dimensions. Its
underlying model is presented on the current site as preview-stage, so this
repository treats it only as a workflow example and makes no claim about public
access, pricing, limits, performance, or direct integration.

## Limitations

The validator checks structure, not creative quality. A complete brief may still
be ineffective, and simple keyword rules may miss unusual phrasing. The output
should be treated as a preflight checklist for human review, never as a promise
that a generation model will produce a particular result.

## License

MIT
