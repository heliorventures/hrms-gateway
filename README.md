# kabipay-gateway

TypeScript **GraphQL gateway** using **graphql-yoga** and **@graphql-tools/stitch**. It introspects each Rust subgraph, merges schemas, and exposes a single HTTP GraphQL endpoint for clients.

## Dependencies

| Requirement | Notes |
|-------------|--------|
| **Node.js** | LTS (v20+ recommended). |
| **npm** | Comes with Node. |
| **Rust subgraphs** | Must be running (or reachable) at the URLs implied by `KABIPAY_SUBGRAPH_BASE_URL` and each service port — see **kabipay-svc** README). |

## Configure

```powershell
copy .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `KABIPAY_SUBGRAPH_BASE_URL` | Base URL for subgraphs, **no trailing slash** (e.g. `http://127.0.0.1`). Each subgraph serves `/graphql` on its port. |
| `KABIPAY_GATEWAY_PORT` | Port for this gateway (default **4009**). |

## Install

```powershell
npm install
```

## Run

**Development** (reload on file changes):

```powershell
npm run dev
```

**Production-style** (after compile):

```powershell
npm run build
npm run start
```

The gateway listens on **`http://127.0.0.1:<KABIPAY_GATEWAY_PORT>/graphql`** (e.g. `http://127.0.0.1:4009/graphql`).

## Typical local order

1. Postgres + migrations (**kabipay-database**).
2. `kabipay-auth` + subgraphs (**kabipay-svc**), or at least the subgraphs you need.
3. Start this gateway.
4. Point **kabipay-ui** `public/config.json` `gatewayUrl` at this server’s `/graphql` URL.

## Related repositories

- **kabipay-svc** — subgraph processes and port list.
- **kabipay-ui** — set `gatewayUrl` and `authUrl` in `public/config.json`.
