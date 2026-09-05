# kabipay-gateway

TypeScript **GraphQL gateway** using **GraphQL Yoga** and schema stitching. At startup it resolves each KabiPay subgraph at `KABIPAY_SUBGRAPH_BASE_URL:<port>/graphql`, builds a merged schema, and exposes **one** HTTP endpoint for browsers and tools. Development permits a partial local fleet. Production fails startup when a configured subgraph or a required client schema field is unavailable, so it cannot expose an incomplete schema to users.

**Not in the gateway:** `kabipay-auth` (REST, port 4001) and `kabipay-outbox-worker` (no HTTP) — the UI points `authUrl` at auth and `gatewayUrl` here.

## Architecture

- **Source of truth** for which subgraphs are stitched: `src/subgraphs.ts` (`SUBGRAPHS` — names, ports, **ops** vs **tenant** plane).
- **Ops plane** (data in `kabipay_ops`): single subgraph **`ops`** on port **4010** (`kabipay-ops` binary).
- **Tenant plane** (per-tenant schema): **4013–4029** — employee through analytics.

## Dependencies

| Requirement | Notes |
|-------------|--------|
| **Node.js** | LTS (v20+ recommended). |
| **npm** | Comes with Node. |
| **Rust subgraphs** | Running or reachable at `KABIPAY_SUBGRAPH_BASE_URL` + ports below. |

| Subgraph | Port | Plane |
|----------|------|--------|
| ops | 4010 | ops |
| employee | 4013 | tenant |
| leave | 4014 | tenant |
| attendance | 4015 | tenant |
| payroll | 4016 | tenant |
| tax | 4017 | tenant |
| benefits | 4018 | tenant |
| expense | 4019 | tenant |
| recruitment | 4020 | tenant |
| performance | 4021 | tenant |
| lms | 4022 | tenant |
| succession | 4023 | tenant |
| compensation | 4024 | tenant |
| assets | 4025 | tenant |
| grievance | 4026 | tenant |
| workflow | 4027 | tenant |
| notification | 4028 | tenant |
| analytics | 4029 | tenant |

## Configure

```powershell
copy .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `KABIPAY_SUBGRAPH_BASE_URL` | Base URL for subgraphs, **no trailing slash** (e.g. `http://127.0.0.1`). Each subgraph serves `/graphql` on its port. |
| `KABIPAY_GATEWAY_PORT` | Port for this gateway (default **4009**). |
| `KABIPAY_ALLOW_PARTIAL_SUBGRAPHS` | Optional `true`/`false` override. Defaults to `false` in production and `true` otherwise. |

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
