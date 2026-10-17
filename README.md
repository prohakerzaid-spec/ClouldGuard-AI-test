# CloudGuard AI

Source bundle for the CloudGuard AI local-simulation dashboard. No real GitHub, AWS, or Azure API calls are made by the demo.

## Run locally

Requirements: Node.js 24 and pnpm.

```sh
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/cloudguard-ai run dev
```

Open http://localhost:5173.

To build the static site:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/cloudguard-ai run build
```
