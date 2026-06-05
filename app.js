// ConSSS Wars — Echoes of Chainoa · Official limited-time event
// Wallet connect + on-chain mint of "ConSSS Wars - 1st Gift" on Sui Testnet.
//
// Eligibility (enforced on-chain by event_01_gift::mint): the connected wallet
// must hold Chronicles IT EARNED (player == caller) for battles 1, 2 and 3, and
// may mint exactly one Gift while the event is open.

import { getWallets } from "https://esm.sh/@mysten/wallet-standard@0.14.5";
import { Transaction } from "https://esm.sh/@mysten/sui@1.30.4/transactions";
import { SuiClient, getFullnodeUrl } from "https://esm.sh/@mysten/sui@1.30.4/client";

// ---- on-chain config (Sui testnet) ----
const CFG = {
  network: "testnet",
  chain: "sui:testnet",
  // event_01_gift package (the limited-time gift) — testnet 2026-06-05.
  giftPackageId:
    "0xede0b0a01f32fffa02482cca4fbfe4d4170da5c165159462b86419287e8738fa",
  mintCounter:
    "0x2973e09707b78c2358d3ebbd976f5507b270bab4a19c01935e4bbf3e0b970d1a",
  // chronicle package — used to look up the player's battle Chronicles.
  chroniclePackageId:
    "0xe6d697993e777535844f7916be78e9a76de0cb14448cb6db4a34893190b87e60",
  clockId: "0x6",
  requiredBattles: [1, 2, 3],
  nftName: "ConSSS Wars - 1st Gift",
  nftImage: "consss_1st_gift.webp",
  playUrl: "https://play.conssswars.com",
};

const chronicleType = `${CFG.chroniclePackageId}::chronicle::Chronicle`;
const client = new SuiClient({ url: getFullnodeUrl(CFG.network) });

// ------------------------------------------------------------------ state
let currentWallet = null; // wallet-standard Wallet
let currentAccount = null; // { address, ... }
let eligibility = null; // { byBattle:{1:id,2:id,3:id}, missing:[], claimed:bool }
let checking = false;

// ------------------------------------------------------------------ dom refs
const $ = (s) => document.querySelector(s);
const walletBtn = $("#walletBtn");
const claimBtn = $("#claimBtn");
const statusBox = $("#claimStatus");
const checklist = $("#checklist");
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

// ------------------------------------------------------------------ wallet discovery
function availableWallets() {
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
  refreshEligibility();
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
    try {
      await currentWallet?.features["standard:disconnect"]?.disconnect();
    } catch (_) {}
    currentWallet = null;
    currentAccount = null;
    eligibility = null;
    reflectConnected();
    renderClaim();
    toast("已斷開錢包連接");
    return;
  }
  try {
    await chooseAndConnect();
  } catch (_) {}
});

async function ensureAccount() {
  if (currentAccount && currentWallet) return currentAccount;
  return chooseAndConnect();
}

// ------------------------------------------------------------------ eligibility
async function getOwnedChronicles(address) {
  const out = [];
  let cursor = null;
  for (;;) {
    const page = await client.getOwnedObjects({
      owner: address,
      filter: { StructType: chronicleType },
      options: { showContent: true },
      cursor,
      limit: 50,
    });
    for (const it of page.data || []) {
      const f = it.data?.content?.fields;
      if (f)
        out.push({
          id: it.data.objectId,
          battle: Number(f.battle_id),
          player: String(f.player || ""),
        });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

async function hasClaimed(address) {
  try {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CFG.giftPackageId}::event_01_gift::has_claimed`,
      arguments: [tx.object(CFG.mintCounter), tx.pure.address(address)],
    });
    const r = await client.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });
    const ret = r?.results?.[0]?.returnValues?.[0];
    if (ret && ret[0]) return ret[0][0] === 1;
  } catch (_) {}
  return false;
}

async function refreshEligibility() {
  if (!currentAccount) {
    eligibility = null;
    renderClaim();
    return;
  }
  checking = true;
  renderClaim();
  const addr = currentAccount.address;
  try {
    const chrs = await getOwnedChronicles(addr);
    const byBattle = {};
    for (const c of chrs) {
      if (
        CFG.requiredBattles.includes(c.battle) &&
        c.player === addr &&
        !byBattle[c.battle]
      )
        byBattle[c.battle] = c.id;
    }
    const missing = CFG.requiredBattles.filter((b) => !byBattle[b]);
    const claimed = await hasClaimed(addr);
    eligibility = { byBattle, missing, claimed };
  } catch (e) {
    console.error(e);
    eligibility = null;
    toast("查詢資格失敗，請稍後重試。", true);
  } finally {
    checking = false;
    renderClaim();
  }
}

function renderClaim() {
  CFG.requiredBattles.forEach((b) => {
    const li = checklist?.querySelector(`[data-battle="${b}"]`);
    if (!li) return;
    const ok = eligibility?.byBattle?.[b];
    li.classList.toggle("done", !!ok);
    const mark = li.querySelector(".mark");
    if (mark) mark.textContent = ok ? "✓" : "○";
  });

  if (!claimBtn) return;
  if (!currentAccount) {
    statusBox.textContent = "連接錢包以查詢領取資格。";
    claimBtn.disabled = true;
    claimBtn.textContent = "連接錢包";
    return;
  }
  if (checking) {
    statusBox.textContent = "查詢鏈上資格中…";
    claimBtn.disabled = true;
    claimBtn.textContent = "查詢中…";
    return;
  }
  if (eligibility?.claimed) {
    statusBox.textContent = "你已領取過這份禮物（每錢包限一次）。";
    claimBtn.disabled = true;
    claimBtn.textContent = "已領取";
    return;
  }
  if (eligibility?.missing?.length) {
    statusBox.innerHTML = `尚缺戰役 ${eligibility.missing.join(
      "、"
    )} 的 Chronicle。先到 <a href="${CFG.playUrl}" target="_blank" rel="noopener">play.conssswars.com</a> 親手打通三關。`;
    claimBtn.disabled = true;
    claimBtn.textContent = "資格未達成";
    return;
  }
  statusBox.textContent = "資格達成！可領取你的 1st Gift。";
  claimBtn.disabled = false;
  claimBtn.textContent = "領取 1st Gift ▸";
}

// ------------------------------------------------------------------ mint
claimBtn?.addEventListener("click", async () => {
  if (claimBtn.disabled) return;
  let account;
  try {
    account = await ensureAccount();
  } catch (_) {
    return;
  }
  // (re)confirm eligibility just before minting.
  await refreshEligibility();
  if (claimBtn.disabled) return;

  openModal(`
    <h3>正在領取…</h3>
    <div class="modal-spinner"></div>
    <p>請在錢包中確認交易，於 Sui 鏈鑄造你的禮物。</p>
    <p class="muted">${CFG.nftName} · Testnet</p>`);

  try {
    const digest = await mintGift(account);
    await refreshEligibility();
    showSuccess(digest);
  } catch (err) {
    console.error(err);
    openModal(`
      <h3 class="err">領取未完成</h3>
      <p>${humanError(err)}</p>
      <div class="modal-actions">
        <button class="modal-link solid" id="retryBtn">再試一次</button>
      </div>`);
    $("#retryBtn")?.addEventListener("click", () => {
      closeModal();
      claimBtn.click();
    });
  }
});

async function mintGift(account) {
  const e = eligibility;
  const tx = new Transaction();
  tx.moveCall({
    target: `${CFG.giftPackageId}::event_01_gift::mint`,
    arguments: [
      tx.object(CFG.mintCounter),
      tx.object(e.byBattle[1]),
      tx.object(e.byBattle[2]),
      tx.object(e.byBattle[3]),
      tx.object(CFG.clockId),
    ],
  });
  tx.setSender(account.address);

  const sae = currentWallet.features["sui:signAndExecuteTransaction"];
  if (sae) {
    const out = await sae.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: CFG.chain,
    });
    return out.digest;
  }
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
    <h3>禮物已領取！</h3>
    <img class="modal-art" src="${CFG.nftImage}" alt="${CFG.nftName}" />
    <p><b style="color:var(--gold-soft)">${CFG.nftName}</b><br/>已鑄造至你的錢包。</p>
    <div class="modal-actions">
      <a class="modal-link solid" href="${url}" target="_blank" rel="noopener">在瀏覽器查看交易 ▸</a>
    </div>
    <p class="muted" style="margin-top:14px">於 Sui Testnet · digest ${short(digest)}</p>`);
  toast(`領取成功！${CFG.nftName} 已入袋。`);
}

function humanError(err) {
  const m = (err && (err.message || String(err))) || "未知錯誤";
  if (/reject|cancel|denied|user/i.test(m)) return "交易已取消。隨時可以再次領取。";
  if (/insufficient|gas|balance/i.test(m))
    return "錢包餘額不足以支付 Gas。請至 Sui Testnet 水龍頭領取測試幣後再試。";
  if (/EAlreadyClaimed|claimed/i.test(m)) return "這個錢包已領取過了（每錢包限一次）。";
  if (/ENotOwner|ENotThreeBattles|EWrongBattles/i.test(m))
    return "資格未符合：需持有你親手打通戰役 1、2、3 的三張 Chronicle。";
  if (/EEventEnded|ended/i.test(m)) return "活動已結束，無法再領取。";
  return `發生錯誤：${m}`;
}

// ------------------------------------------------------------------ boot
renderClaim();

(function tryAutoConnect() {
  const wallets = availableWallets();
  for (const w of wallets) {
    if (w.accounts && w.accounts.length) {
      currentWallet = w;
      currentAccount = w.accounts[0];
      reflectConnected();
      refreshEligibility();
      break;
    }
  }
})();
