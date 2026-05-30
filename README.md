# ConSSS Wars — Official Limited-Time Event

官方限時活動頁面 for **ConSSS Wars: Echoes of Chainoa 鏈州英雄傳**.

Open any of the 10 treasure chests → wallet pops up → mint a **ConSSS Wars - 1st Gift** NFT on **Sui (testnet)**.

- 官網: https://conssswars.com/
- X: https://x.com/conssswars
- Discord: https://discord.com/invite/GyrfKEADaG

## Structure

```
index.html              event page (conssswars-style dark-fantasy theme)
styles.css              gold/navy + magenta painterly styling
app.js                  wallet-standard connect + Sui mint flow (ESM via esm.sh)
consss_1st_gift.png     the NFT artwork (also used for on-chain Display)
chests/1.png … 10.png   the 10 treasure-chest tiles
contracts/gift_nft/     Move package for the gift NFT
  sources/gift_nft.move
  Move.toml
  deployment.json       deployed package / counter IDs (testnet)
```

## On-chain (Sui Testnet)

| | |
|---|---|
| Package | `0xff60f6d21f898320e5d81109080ad4d454004726fbfd7b6abd1d51da2622fd30` |
| Mint call | `gift::mint(counter: &mut MintCounter)` |
| MintCounter (shared) | `0x3ac47386a7a2080952d21b7ddcf274ca0c0a82165149552d8d29127f1ad3afaa` |
| NFT name | `ConSSS Wars - 1st Gift` |
| NFT image | `https://raw.githubusercontent.com/ConsssLabs/public-assets/main/consss-first-gift/consss-1st-gift.png` |

Each mint assigns a sequential `edition` number and transfers the `Gift` object to the caller.

## Run locally

```bash
python3 -m http.server 8099
# open http://localhost:8099
```

A Sui-compatible wallet extension (e.g. Slush) on **testnet** with a little gas is required to mint.

## Deploy (Walrus Sites → consss.wal.app)

The page is deployed to **Walrus Sites** and served at `https://consss.wal.app`
(SuiNS name `consss` linked to the site object on mainnet).

```bash
site-builder --context mainnet publish . --epochs 53
# then link the SuiNS name `consss` to the returned site object id
```

Requires mainnet SUI (gas) + WAL (storage) on the deployer address.

The NFT's on-chain `image_url` is hosted in the
[`ConsssLabs/public-assets`](https://github.com/ConsssLabs/public-assets) repo:
`https://raw.githubusercontent.com/ConsssLabs/public-assets/main/consss-first-gift/consss-1st-gift.png`.

## Re-deploy the contract

```bash
cd contracts/gift_nft
sui move build
sui client publish --gas-budget 200000000
# then update CFG.packageId / CFG.mintCounter in app.js + deployment.json
```
