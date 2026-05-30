// ConSSS Wars — Echoes of Chainoa · Official limited-time event
// Wallet connect + on-chain mint of "ConSSS Wars - 1st Gift" on Sui Testnet.

import { getWallets } from "https://esm.sh/@mysten/wallet-standard@0.14.5";
import { Transaction } from "https://esm.sh/@mysten/sui@1.30.4/transactions";
import { SuiClient, getFullnodeUrl } from "https://esm.sh/@mysten/sui@1.30.4/client";

// ---- on-chain config (deployed gift_nft package, Sui testnet) ----
const CFG = {
  network: "testnet",
  chain: "sui:testnet",
  packageId:
    "0xff60f6d21f898320e5d81109080ad4d454004726fbfd7b6abd1d51da2622fd30",
  module: "gift",
  fn: "mint",
  mintCounter:
    "0x3ac47386a7a2080952d21b7ddcf274ca0c0a82165149552d8d29127f1ad3afaa",
  nftName: "ConSSS Wars - 1st Gift",
  nftImage: "consss_1st_gift.webp",
};

const NUM_CHESTS = 10;
const client = new SuiClient({ url: getFullnodeUrl(CFG.network) });

// ------------------------------------------------------------------ state
let currentWallet = null; // wallet-standard Wallet
let currentAccount = null; // { address, ... }

// ------------------------------------------------------------------ dom refs
const $ = (sel) => document.querySelector(sel);
const walletBtn = $("#walletBtn");
const grid = $("#chestGrid");
const modal = $("#modal");
const modalBody = $("#modalBody");
const modalClose = $("#modalClose");
const toastEl = $("#toast");

// ------------------------------------------------------------------ helpers
const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
let toastTimer;
function toast(msg, isErr = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle("err", isErr);
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 4200);
}
function openModal(html) {
  modalBody.innerHTML = html;
  modal.hidden = false;
}
function closeModal() {
  modal.hidden = true;
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ------------------------------------------------------------------ chests
function buildChests() {
  // 7,8,9,10,1,2,3,4,5,6 — the order the event organisers specified.
  const order = [7, 8, 9, 10, 1, 2, 3, 4, 5, 6];
  grid.innerHTML = "";
  order.forEach((n) => {
    const el = document.createElement("div");
    el.className = "chest";
    el.dataset.n = n;
    el.innerHTML = `<img src="chests/${n}.webp" alt="Treasure chest ${n}" loading="lazy"/>
      <div class="open-tag">開啟 · OPEN</div>`;
    el.addEventListener("click", () => onChestClick(el));
    grid.appendChild(el);
  });
}

// ------------------------------------------------------------------ wallet discovery
function availableWallets() {
  // Sui wallets expose the standard sign features.
  return getWallets()
    .get()
    .filter(
      (w) =>
        w.features["standard:connect"] &&
        (w.features["sui:signAndExecuteTransaction"] ||
          w.features["sui:signTransaction"])
    );
}

async function connect(wallet) {
  const res = await wallet.features["standard:connect"].connect();
  const accounts = res?.accounts || wallet.accounts || [];
  if (!accounts.length) throw new Error("錢包未授權任何帳戶");
  currentWallet = wallet;
  currentAccount = accounts[0];
  reflectConnected();
  toast(`已連接 ${wallet.name} · ${short(currentAccount.address)}`);
  return currentAccount;
}

function reflectConnected() {
  if (currentAccount) {
    walletBtn.textContent = short(currentAccount.address);
    walletBtn.classList.add("connected");
  } else {
    walletBtn.textContent = "連接錢包";
    walletBtn.classList.remove("connected");
  }
}

// Show a wallet picker (or connect directly if only one). Resolves to account.
function chooseAndConnect() {
  return new Promise((resolve, reject) => {
    const wallets = availableWallets();
    if (wallets.length === 0) {
      openModal(`
        <h3>找不到 Sui 錢包</h3>
        <p>請先安裝支援 Sui 的錢包以參與活動。</p>
        <div class="modal-actions">
          <a class="modal-link solid" href="https://slush.app/" target="_blank" rel="noopener">取得 Slush 錢包</a>
        </div>
        <p class="muted" style="margin-top:14px">安裝後請重新整理本頁。</p>`);
      reject(new Error("no-wallet"));
      return;
    }
    if (wallets.length === 1) {
      connect(wallets[0]).then(resolve).catch(reject);
      return;
    }
    const items = wallets
      .map(
        (w, i) => `<button class="wallet-opt" data-i="${i}">
          ${w.icon ? `<img src="${w.icon}" alt=""/>` : ""}<span>${w.name}</span>
        </button>`
      )
      .join("");
    openModal(`<h3>選擇錢包</h3><div class="wallet-list">${items}</div>`);
    modalBody.querySelectorAll(".wallet-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const w = wallets[Number(b.dataset.i)];
        connect(w)
          .then((acc) => {
            closeModal();
            resolve(acc);
          })
          .catch((e) => {
            toast(e.message || "連接失敗", true);
            reject(e);
          });
      });
    });
  });
}

walletBtn.addEventListener("click", async () => {
  if (currentAccount) {
    // already connected — offer to disconnect
    try {
      await currentWallet?.features["standard:disconnect"]?.disconnect();
    } catch (_) {}
    currentWallet = null;
    currentAccount = null;
    reflectConnected();
    toast("已斷開錢包連接");
    return;
  }
  try {
    await chooseAndConnect();
  } catch (_) {}
});

// ------------------------------------------------------------------ mint
async function ensureAccount() {
  if (currentAccount && currentWallet) return currentAccount;
  return chooseAndConnect();
}

async function onChestClick(el) {
  if (el.classList.contains("busy")) return;
  let account;
  try {
    account = await ensureAccount();
  } catch (_) {
    return; // user closed picker / no wallet
  }

  el.classList.add("busy");
  openModal(`
    <h3>正在開啟寶箱…</h3>
    <div class="modal-spinner"></div>
    <p>請在錢包中確認交易，於 Sui 鏈鑄造你的禮物。</p>
    <p class="muted">${CFG.nftName} · Testnet</p>`);

  try {
    const digest = await mintGift(account);
    showSuccess(digest);
  } catch (err) {
    console.error(err);
    const msg = humanError(err);
    openModal(`
      <h3 class="err">鑄造未完成</h3>
      <p>${msg}</p>
      <div class="modal-actions">
        <button class="modal-link solid" id="retryBtn">再試一次</button>
      </div>`);
    const r = $("#retryBtn");
    if (r) r.addEventListener("click", () => { closeModal(); onChestClick(el); });
  } finally {
    el.classList.remove("busy");
  }
}

async function mintGift(account) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CFG.packageId}::${CFG.module}::${CFG.fn}`,
    arguments: [tx.object(CFG.mintCounter)],
  });
  tx.setSender(account.address);

  // Prefer the combined sign+execute feature.
  const sae = currentWallet.features["sui:signAndExecuteTransaction"];
  if (sae) {
    const out = await sae.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: CFG.chain,
    });
    return out.digest;
  }

  // Fallback: sign then execute through our own fullnode client.
  const st = currentWallet.features["sui:signTransaction"];
  const { bytes, signature } = await st.signTransaction({
    transaction: tx,
    account,
    chain: CFG.chain,
  });
  const res = await client.executeTransactionBlock({
    transactionBlock: bytes,
    signature,
    options: { showEffects: true },
  });
  return res.digest;
}

function showSuccess(digest) {
  const url = `https://suiscan.xyz/${CFG.network}/tx/${digest}`;
  openModal(`
    <h3>寶箱已開啟！</h3>
    <img class="modal-art" src="${CFG.nftImage}" alt="${CFG.nftName}" />
    <p><b style="color:var(--gold-soft)">${CFG.nftName}</b><br/>已鑄造至你的錢包。</p>
    <div class="modal-actions">
      <a class="modal-link solid" href="${url}" target="_blank" rel="noopener">在瀏覽器查看交易 ▸</a>
    </div>
    <p class="muted" style="margin-top:14px">於 Sui Testnet · digest ${short(digest)}</p>`);
  toast(`鑄造成功！${CFG.nftName} 已入袋。`);
}

function humanError(err) {
  const m = (err && (err.message || String(err))) || "未知錯誤";
  if (/reject|cancel|denied|user/i.test(m)) return "交易已取消。隨時可以再次開啟寶箱。";
  if (/insufficient|gas|balance/i.test(m))
    return "錢包餘額不足以支付 Gas。請至 Sui Testnet 水龍頭領取測試幣後再試。";
  return `發生錯誤：${m}`;
}

// ------------------------------------------------------------------ boot
buildChests();

// auto-reflect if a wallet was already connected this session
(function tryAutoConnect() {
  const wallets = availableWallets();
  for (const w of wallets) {
    if (w.accounts && w.accounts.length) {
      currentWallet = w;
      currentAccount = w.accounts[0];
      reflectConnected();
      break;
    }
  }
})();
