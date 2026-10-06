# Build and reuse diagrams

The canvas now supports a complete workflow: insert an editable starting point,
arrange its shapes, and save a file you can reuse on another board.

## References and choices

Reviewed the following working projects and their first-party documentation:

| Project | Useful capability | Implementation here |
| --- | --- | --- |
| [Excalidraw](https://github.com/excalidraw/excalidraw#features) | Shape libraries and editable JSON export | Save a board or selection as an editable, versioned file; import it into any board. |
| [draw.io / diagrams.net](https://www.drawio.com/blog/example-diagrams-github/) | Editable diagram templates | Four original templates for decision flows, project planning, system architecture, and retrospectives. |
| [tldraw](https://tldraw.dev/features/composable-primitives) | Object alignment and distribution | Six alignment actions and equal-gap distribution along either axis. |

These features use the existing shape model, renderer, history, and collaboration
protocol. No drawing engine replacement or third-party artwork is involved.

## Using the features

- Choose **Browse templates** on an empty board or in the board menu. Search by
  name, description, or category. Each preview renders the actual editable shapes.
- Click a template to insert it at the center of your current view. Its shapes
  are selected together; the view fits the inserted diagram. Double-click text
  to edit a label. Shapes and labels remain separate elements.
- Select two or more shapes to reveal **Arrange** below the style panel. Align
  their edges or centers; select at least three to distribute with equal gaps.
  Each arrangement is one undo step.
- Use **Save board file**, or select part of a diagram and choose **Save selection
  as file** to make your own reusable snippet.
- Choose **Import board file** to insert a saved file. Existing shapes stay intact,
  imported shapes receive fresh IDs, and one undo removes the entire insert.

The file format is this project's `.exciladraw.json` format, not Excalidraw's
`.excalidraw` or draw.io's XML format. Version 1 contains `type: "exciladraw"`,
`version: 1`, and a `shapes` array. Files are limited to 5 MB and 2,000 shapes;
invalid files are rejected in full before changing the board. Oversized boards
can be saved in smaller selections. Room IDs, tokens, and invite codes are not
included in the files.

New file/template actions wait for the existing board to load. Imports use the
normal live drawing messages. Update and erase messages are split by item count
and byte size, and the WebSocket backend processes each connection's messages in
order so an immediate undo follows the corresponding insert writes.

## Interface contract

The canvas stays the primary workspace. Templates live in a searchable dialog,
file actions in the existing menu, and arrangement controls appear only for a
multiple selection. The existing ink/chalk/amber colors and panel styles are
retained. The gallery scrolls on narrow screens; drawing tools use a separate
scrollable row below the board controls. Dialog focus is trapped and restored,
and board shortcuts do not intercept dialog or menu interactions.

## Verification

```sh
pnpm --filter exciladraw-frontend test
pnpm --filter exciladraw-frontend lint
pnpm --filter exciladraw-frontend exec tsc --noEmit
pnpm --filter ws-backend exec tsc --noEmit --incremental false
pnpm --filter exciladraw-frontend build
```

Tests cover template/schema validity, file round trips, malformed and oversized
files, fresh IDs, all alignment directions, unequal-size distribution,
insert/undo ordering, and two board instances replaying large edits through the
shared WebSocket schema. Both item-count and byte-size batching are exercised.

Browser verification used an isolated in-memory HTTP/WebSocket fixture, without
accessing the configured database: template search and empty results, insertion,
undo/redo, JSON download contents, invalid-file errors, repeated import,
alignment/undo, menu-to-dialog focus, Tab/Shift+Tab trapping, Escape restoration,
and layout measurements at 320, 768, 1024, and 1440 pixels. Production database
persistence was not exercised. The collaborative browser's screenshot tool
failed, so visual screenshot review was unavailable.
