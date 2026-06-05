# ConSSS Wars — Official Limited-Time Event

> Claim page for the **ConSSS Wars: Echoes of Chainoa（鏈州英雄傳：鏈之迴響）** 1st Gift NFT.

The official limited-time event page for the game, served at
**[consss.wal.app](https://consss.wal.app)** as a [Walrus Site](https://docs.walrus.site/)
(SuiNS name `consss`). A player who personally cleared battles 1, 2 and 3 can claim
a single **ConSSS Wars - 1st Gift** NFT on **Sui mainnet**.

This repository contains only the static front end. The Move contract
(`event_01_gift`) lives in the separate `contracts` repo.

- Game: https://play.conssswars.com
- Site: https://conssswars.com/
- X: https://x.com/conssswars
- Discord: https://discord.com/invite/GyrfKEADaG

## Features

- **Eligibility-gated claim** — one mint per wallet, gated on-chain by ownership of
  the Chronicles earned for battles 1, 2 and 3.
- **Two chests, one gift** — pick the Tatum or Walrus chest; both open the same
  reward and reveal `consss_1st_gift.png`.
- **Bilingual (zh / en)** — top-right language toggle, persisted in `localStorage`.
- **Wallet Standard** — connects any Sui-compatible wallet (e.g. Slush), with
  auto-connect on revisit and graceful no-wallet / cancel / out-of-gas handling.
- **Shared design system** — reuses the official conssswars.com look (Chainoa
  9-slice panels and buttons, Noto Sans TC + Source Serif 4).
- **No build step** — vanilla HTML/CSS/JS; SDK modules loaded as ESM from `esm.sh`.

## How it works

1. The visitor connects a Sui wallet.
2. The page queries the wallet's owned `Chronicle` objects and builds a 1 / 2 / 3
   checklist, keeping only Chronicles the wallet **earned itself** (`player == caller`)
   for each of battles 1, 2 and 3. It also calls `has_claimed` to detect a prior mint.
3. The claim chests are enabled only when all three Chronicles are present and the
   wallet has not already claimed.
4. Opening a chest submits `event_01_gift::mint`, passing the three Chronicle objects.
   The contract re-verifies eligibility and one-mint-per-wallet on-chain, assigns a
   sequential edition, and transfers the Gift to the caller.

Eligibility is enforced by the contract; the front-end checks are only there to
guide the user.

## On-chain (Sui mainnet)

| Item | Value |
|---|---|
| `event_01_gift` package | `0xd1ed457cb4f1bb209c09a094f772472db15c115a29eb5995b7cb2a2313227896` |
| `MintCounter` (shared) | `0x7c15f5391cd1baf53bc3280ac3f75331c5abe027a370eedb39ac9d7f301890a9` |
| `chronicle` package (eligibility lookup) | `0x5760b2685d41bd45e2991dedc242e866b1aca9ff3c3a5e193445751c2b8dfe4b` |
| Mint call | `event_01_gift::mint(counter, c1, c2, c3, clock)` |
| NFT name | `ConSSS Wars - 1st Gift` |

`c1 / c2 / c3` are the caller's own Chronicle objects for battles 1, 2 and 3;
`clock` is the system clock at `0x6`. Network IDs are configured at the top of
`app.js` (`NETWORK = "mainnet"`).

## Project layout

```
index.html            event page markup (Chainoa-themed)
styles.css            gold / navy painterly styling, 9-slice panels & buttons
app.js                wallet connect + on-chain eligibility check + mint (ESM)
ws-resources.json     Walrus Sites routing (SPA fallback to /index.html)
build-dist.sh         assembles the slim dist/ bundle for deployment
consss_1st_gift.png   NFT reveal image shown on a successful claim
chests/Tatum.png      chest / powered-by logo
chests/Walrus.png     chest / powered-by logo
assets/               icon + shared Chainoa UI art (panels, buttons)
```

## Local development

No build or install step. Serve the repo root with any static server:

```bash
python3 -m http.server 8099   # then open http://localhost:8099
```

To complete a claim you need a Sui-compatible wallet on **mainnet** with a little
gas, plus the Chronicles earned for battles 1, 2 and 3.

## Deploy (Walrus Sites → consss.wal.app)

```bash
./build-dist.sh                                              # → dist/
site-builder --context mainnet update --epochs <N> ./dist <site-object-id>
```

`<site-object-id>` is the existing `consss.wal.app` site object. `build-dist.sh`
copies only the optimized web assets (HTML/CSS/JS, the reveal image, chest logos,
and the shared UI art) into `dist/`. Updating requires mainnet SUI (gas) and WAL
(storage) on the deployer address.
