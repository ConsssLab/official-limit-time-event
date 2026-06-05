# ConSSS Wars — Official Limited-Time Event

官方限時活動頁面 for **ConSSS Wars: Echoes of Chainoa 鏈州英雄傳**.

Clear battles 1, 2 and 3 at **play.conssswars.com**, then claim a single
**ConSSS Wars - 1st Gift** NFT here on **Sui**. One mint per wallet, while the
event is open.

- 遊戲: https://play.conssswars.com
- 官網: https://conssswars.com/
- X: https://x.com/conssswars
- Discord: https://discord.com/invite/GyrfKEADaG

## Eligibility (enforced on-chain)

The connected wallet must **hold Chronicles it earned** (`player == caller`) for
three distinct battles **{1, 2, 3}**, and may mint **exactly one** Gift while the
event is open. The page reads the wallet's owned `Chronicle` objects, shows a
1/2/3 checklist, and only enables the claim button when all three are present;
`event_01_gift::mint` re-checks everything on-chain.

## Structure

```
index.html              event page (conssswars-style dark-fantasy theme)
styles.css              gold/navy painterly styling
app.js                  wallet connect + eligibility check + Sui mint (ESM via esm.sh)
consss_1st_gift.png     the NFT artwork (also used for on-chain Display)
chests/Tatum.png        powered-by logo
chests/Walrus.png       powered-by logo
build-dist.sh           assembles the slim dist/ for Walrus Sites
```

The Move contract now lives in the **`contracts` repo** (`sui/event_01_gift/`),
not here.

## On-chain (Sui Testnet)

| | |
|---|---|
| `event_01_gift` package | `0xede0b0a01f32fffa02482cca4fbfe4d4170da5c165159462b86419287e8738fa` |
| Mint call | `event_01_gift::mint(counter, c1, c2, c3, clock)` |
| MintCounter (shared) | `0x2973e09707b78c2358d3ebbd976f5507b270bab4a19c01935e4bbf3e0b970d1a` |
| `chronicle` package (eligibility lookup) | `0xe6d697993e777535844f7916be78e9a76de0cb14448cb6db4a34893190b87e60` |
| NFT name | `ConSSS Wars - 1st Gift` |
| NFT image | `https://raw.githubusercontent.com/ConsssLab/public-assets/main/consss-first-gift/consss-1st-gift.png` |

`c1/c2/c3` are the caller's own Chronicle objects for battles 1/2/3; `clock` is
`0x6`. Each mint assigns a sequential `edition` and transfers the `Gift` to the
caller. (IDs above are the current **testnet** deploy; swap to mainnet at launch.)

## Run locally

```bash
python3 -m http.server 8099   # open http://localhost:8099
```

A Sui-compatible wallet (e.g. Slush) on **testnet** with a little gas, plus
Chronicles for battles 1/2/3, is required to claim.

## Deploy (Walrus Sites → consss.wal.app)

```bash
./build-dist.sh                                   # → dist/
site-builder --context mainnet publish dist --epochs 53
# then link the SuiNS name `consss` to the returned site object id
```

Requires mainnet SUI (gas) + WAL (storage) on the deployer address.
