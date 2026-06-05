// ConSSS Wars: Echoes of Chainoa · Official limited-time event
// Wallet connect + on-chain mint of "ConSSS Wars - 1st Gift" on Sui.
//
// Eligibility (enforced on-chain by event_01_gift::mint): the connected wallet
// must hold Chronicles IT EARNED (player == caller) for battles 1, 2 and 3, and
// may mint exactly one Gift while the event is open.

import { getWallets } from "https://esm.sh/@mysten/wallet-standard@0.14.5";
import { Transaction } from "https://esm.sh/@mysten/sui@1.30.4/transactions";
import { SuiClient, getFullnodeUrl } from "https://esm.sh/@mysten/sui@1.30.4/client";

// ---- on-chain config -------------------------------------------------------
// Flip NETWORK to "mainnet" AFTER the mainnet contract launch and fill the
// mainnet ids below. Everything else (net pill, RPC, chain) derives from this.
const NETWORK = "mainnet";
const NETWORKS = {
  testnet: {
    chain: "sui:testnet",
    giftPackageId: "0xede0b0a01f32fffa02482cca4fbfe4d4170da5c165159462b86419287e8738fa",
    mintCounter: "0x2973e09707b78c2358d3ebbd976f5507b270bab4a19c01935e4bbf3e0b970d1a",
    chroniclePackageId: "0xe6d697993e777535844f7916be78e9a76de0cb14448cb6db4a34893190b87e60",
  },
  mainnet: {
    chain: "sui:mainnet",
    giftPackageId: "0xd1ed457cb4f1bb209c09a094f772472db15c115a29eb5995b7cb2a2313227896",
    mintCounter: "0x7c15f5391cd1baf53bc3280ac3f75331c5abe027a370eedb39ac9d7f301890a9",
    chroniclePackageId: "0x5760b2685d41bd45e2991dedc242e866b1aca9ff3c3a5e193445751c2b8dfe4b",
  },
};
const CFG = {
  network: NETWORK,
  clockId: "0x6",
  requiredBattles: [1, 2, 3],
  nftName: "ConSSS Wars - 1st Gift",
  nftImage: "consss_1st_gift.png",
  playUrl: "https://play.conssswars.com",
  ...NETWORKS[NETWORK],
};
const chronicleType = `${CFG.chroniclePackageId}::chronicle::Chronicle`;
const client = new SuiClient({ url: getFullnodeUrl(CFG.network) });

// ---- i18n ------------------------------------------------------------------
const STR = {
  zh: {
    "lang.other": "EN",
    "nav.play": "遊玩",
    "nav.site": "官網",
    "wallet.connect": "連接錢包",
    "hero.kicker": "官方限時活動",
    "hero.lede": "這是《Echoes of Chainoa 鏈州英雄傳：鏈之迴響》的官方限時活動。親手打通三場戰役的英雄，皆可於 Sui 鏈領取專屬的 ConSSS Wars - 1st Gift。每個錢包限領一次。",
    "reward.kicker": "活動獎勵",
    "reward.desc": "鏈州的第一份禮物 —— 僅頒予親手打通戰役 1、2、3 的英雄。於 Sui 鏈鑄造後永久歸於你的錢包。",
    "check.b1": "戰役一 Chronicle",
    "check.b2": "戰役二 Chronicle",
    "check.b3": "戰役三 Chronicle",
    "chest.prompt": "選擇一個寶箱開啟（兩個都會開出同一份禮物）",
    "powered": "技術支援",
    "status.connect": "連接錢包以查詢領取資格。",
    "status.checking": "查詢鏈上資格中…",
    "status.claimed": "你已領取過這份禮物（每錢包限一次）。",
    "status.missing": "尚缺戰役 {b} 的 Chronicle。先到 play.conssswars.com 親手打通三關。",
    "status.ready": "資格達成！點任一寶箱領取你的 1st Gift。",
    "status.fail": "查詢資格失敗，請稍後重試。",
    "toast.connected": "已連接 {w} · {a}",
    "toast.disconnect": "已斷開錢包連接",
    "toast.success": "領取成功！ConSSS Wars - 1st Gift 已入袋。",
    "modal.opening": "正在領取…",
    "modal.confirm": "請在錢包中確認交易，於 Sui 鏈鑄造你的禮物。",
    "modal.success": "禮物已領取！",
    "modal.minted": "已鑄造至你的錢包。",
    "modal.viewtx": "在瀏覽器查看交易 ▸",
    "modal.failTitle": "領取未完成",
    "modal.retry": "再試一次",
    "modal.noWallet": "找不到 Sui 錢包",
    "modal.noWalletBody": "請先安裝支援 Sui 的錢包以參與活動。",
    "modal.getSlush": "取得 Slush 錢包",
    "modal.installRefresh": "安裝後請重新整理本頁。",
    "modal.pickWallet": "選擇錢包",
    "err.cancel": "交易已取消。隨時可以再次領取。",
    "err.gas": "錢包餘額不足以支付 Gas。請至 Sui 水龍頭領取後再試。",
    "err.claimed": "這個錢包已領取過了（每錢包限一次）。",
    "err.notqual": "資格未符合：需持有你親手打通戰役 1、2、3 的三張 Chronicle。",
    "err.ended": "活動已結束，無法再領取。",
  },
  en: {
    "lang.other": "中",
    "nav.play": "Play",
    "nav.site": "Site",
    "wallet.connect": "Connect Wallet",
    "hero.kicker": "Official Limited-Time Event",
    "hero.lede": "The official limited-time event for 《ConSSS Wars: Echoes of Chainoa》. Heroes who personally clear all three battles can claim their own ConSSS Wars - 1st Gift on Sui. One mint per wallet.",
    "reward.kicker": "Event Reward",
    "reward.desc": "The first gift of Chainoa — granted only to heroes who personally cleared battles 1, 2 and 3. Once minted on Sui, it's yours forever.",
    "check.b1": "Battle 1 Chronicle",
    "check.b2": "Battle 2 Chronicle",
    "check.b3": "Battle 3 Chronicle",
    "chest.prompt": "Pick a chest to open (both open the same gift)",
    "powered": "Powered by",
    "status.connect": "Connect your wallet to check eligibility.",
    "status.checking": "Checking on-chain eligibility…",
    "status.claimed": "You've already claimed this gift (one per wallet).",
    "status.missing": "Missing the battle {b} Chronicle. Clear all three at play.conssswars.com first.",
    "status.ready": "Eligible! Open any chest to claim your 1st Gift.",
    "status.fail": "Eligibility check failed, please retry.",
    "toast.connected": "Connected {w} · {a}",
    "toast.disconnect": "Wallet disconnected",
    "toast.success": "Claimed! ConSSS Wars - 1st Gift is yours.",
    "modal.opening": "Claiming…",
    "modal.confirm": "Confirm the transaction in your wallet to mint on Sui.",
    "modal.success": "Gift claimed!",
    "modal.minted": "minted to your wallet.",
    "modal.viewtx": "View transaction ▸",
    "modal.failTitle": "Claim incomplete",
    "modal.retry": "Try again",
    "modal.noWallet": "No Sui wallet found",
    "modal.noWalletBody": "Install a Sui-compatible wallet to join the event.",
    "modal.getSlush": "Get Slush Wallet",
    "modal.installRefresh": "Refresh this page after installing.",
    "modal.pickWallet": "Choose a wallet",
    "err.cancel": "Transaction cancelled. You can claim again anytime.",
    "err.gas": "Insufficient gas. Top up from a Sui faucet and retry.",
    "err.claimed": "This wallet has already claimed (one per wallet).",
    "err.notqual": "Not eligible: hold the three Chronicles you earned for battles 1, 2 and 3.",
    "err.ended": "The event has ended.",
  },
};
let lang = (typeof localStorage !== "undefined" && localStorage.getItem("consss_lang") === "en") ? "en" : "zh";
function t(key, vars) {
  let s = (STR[lang] && STR[lang][key]) || STR.zh[key] || key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// ---- state -----------------------------------------------------------------
let currentWallet = null;
let currentAccount = null;
let eligibility = null; // { byBattle:{1,2,3}, missing:[], claimed:bool }
let checking = false;

// ---- dom -------------------------------------------------------------------
const $ = (s) => document.querySelector(s);
const walletBtn = $("#walletBtn");
const langBtn = $("#langBtn");
const statusBox = $("#claimStatus");
const checklist = $("#checklist");
const chestRow = $("#chestRow");
const modal = $("#modal");
const modalBody = $("#modalBody");
const modalClose = $("#modalClose");
const toastEl = $("#toast");

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
let toastTimer;
function toast(msg, isErr = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle("err", isErr);
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 4200);
}
function openModal(html) { modalBody.innerHTML = html; modal.hidden = false; }
function closeModal() { modal.hidden = true; }
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

// ---- i18n apply ------------------------------------------------------------
function applyI18n() {
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  if (langBtn) langBtn.textContent = t("lang.other");
  if (!currentAccount && walletBtn) walletBtn.textContent = t("wallet.connect");
  renderClaim();
}
langBtn?.addEventListener("click", () => {
  lang = lang === "en" ? "zh" : "en";
  try { localStorage.setItem("consss_lang", lang); } catch (_) {}
  applyI18n();
});

// ---- wallet ----------------------------------------------------------------
function availableWallets() {
  return getWallets().get().filter(
    (w) => w.features["standard:connect"] &&
      (w.features["sui:signAndExecuteTransaction"] || w.features["sui:signTransaction"])
  );
}
async function connect(wallet) {
  const res = await wallet.features["standard:connect"].connect();
  const accounts = res?.accounts || wallet.accounts || [];
  if (!accounts.length) throw new Error("no-account");
  currentWallet = wallet;
  currentAccount = accounts[0];
  reflectConnected();
  toast(t("toast.connected", { w: wallet.name, a: short(currentAccount.address) }));
  refreshEligibility();
  return currentAccount;
}
function reflectConnected() {
  if (currentAccount) {
    walletBtn.textContent = short(currentAccount.address);
    walletBtn.classList.add("connected");
  } else {
    walletBtn.textContent = t("wallet.connect");
    walletBtn.classList.remove("connected");
  }
}
function chooseAndConnect() {
  return new Promise((resolve, reject) => {
    const wallets = availableWallets();
    if (wallets.length === 0) {
      openModal(`<h3>${t("modal.noWallet")}</h3><p>${t("modal.noWalletBody")}</p>
        <div class="modal-actions"><a class="modal-link solid" href="https://slush.app/" target="_blank" rel="noopener">${t("modal.getSlush")}</a></div>
        <p class="muted" style="margin-top:14px">${t("modal.installRefresh")}</p>`);
      reject(new Error("no-wallet")); return;
    }
    if (wallets.length === 1) { connect(wallets[0]).then(resolve).catch(reject); return; }
    const items = wallets.map((w, i) => `<button class="wallet-opt" data-i="${i}">${w.icon ? `<img src="${w.icon}" alt=""/>` : ""}<span>${w.name}</span></button>`).join("");
    openModal(`<h3>${t("modal.pickWallet")}</h3><div class="wallet-list">${items}</div>`);
    modalBody.querySelectorAll(".wallet-opt").forEach((b) => {
      b.addEventListener("click", () => {
        connect(wallets[Number(b.dataset.i)]).then((acc) => { closeModal(); resolve(acc); }).catch((e) => { toast(e.message || "connect failed", true); reject(e); });
      });
    });
  });
}
walletBtn.addEventListener("click", async () => {
  if (currentAccount) {
    try { await currentWallet?.features["standard:disconnect"]?.disconnect(); } catch (_) {}
    currentWallet = null; currentAccount = null; eligibility = null;
    reflectConnected(); renderClaim(); toast(t("toast.disconnect")); return;
  }
  try { await chooseAndConnect(); } catch (_) {}
});
async function ensureAccount() {
  if (currentAccount && currentWallet) return currentAccount;
  return chooseAndConnect();
}

// ---- eligibility -----------------------------------------------------------
async function getOwnedChronicles(address) {
  const out = []; let cursor = null;
  for (;;) {
    const page = await client.getOwnedObjects({
      owner: address, filter: { StructType: chronicleType }, options: { showContent: true }, cursor, limit: 50,
    });
    for (const it of page.data || []) {
      const f = it.data?.content?.fields;
      if (f) out.push({ id: it.data.objectId, battle: Number(f.battle_id), player: String(f.player || "") });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
async function hasClaimed(address) {
  try {
    const tx = new Transaction();
    tx.moveCall({ target: `${CFG.giftPackageId}::event_01_gift::has_claimed`, arguments: [tx.object(CFG.mintCounter), tx.pure.address(address)] });
    const r = await client.devInspectTransactionBlock({ sender: address, transactionBlock: tx });
    const ret = r?.results?.[0]?.returnValues?.[0];
    if (ret && ret[0]) return ret[0][0] === 1;
  } catch (_) {}
  return false;
}
async function refreshEligibility() {
  if (!currentAccount) { eligibility = null; renderClaim(); return; }
  checking = true; renderClaim();
  const addr = currentAccount.address;
  try {
    const chrs = await getOwnedChronicles(addr);
    const byBattle = {};
    for (const c of chrs) {
      if (CFG.requiredBattles.includes(c.battle) && c.player === addr && !byBattle[c.battle]) byBattle[c.battle] = c.id;
    }
    const missing = CFG.requiredBattles.filter((b) => !byBattle[b]);
    const claimed = await hasClaimed(addr);
    eligibility = { byBattle, missing, claimed };
  } catch (e) {
    console.error(e); eligibility = null; toast(t("status.fail"), true);
  } finally { checking = false; renderClaim(); }
}
function isEligible() { return eligibility && !eligibility.claimed && eligibility.missing.length === 0; }

function renderClaim() {
  CFG.requiredBattles.forEach((b) => {
    const li = checklist?.querySelector(`[data-battle="${b}"]`);
    if (!li) return;
    const ok = eligibility?.byBattle?.[b];
    li.classList.toggle("done", !!ok);
    const mark = li.querySelector(".mark");
    if (mark) mark.textContent = ok ? "✓" : "○";
  });
  if (!statusBox) return;
  if (!currentAccount) statusBox.textContent = t("status.connect");
  else if (checking) statusBox.textContent = t("status.checking");
  else if (eligibility?.claimed) statusBox.textContent = t("status.claimed");
  else if (eligibility?.missing?.length) statusBox.innerHTML = t("status.missing", { b: eligibility.missing.join("、") }).replace("play.conssswars.com", `<a href="${CFG.playUrl}" target="_blank" rel="noopener">play.conssswars.com</a>`);
  else statusBox.textContent = t("status.ready");
  // chests dim when not eligible (still clickable → guides the user)
  if (chestRow) chestRow.classList.toggle("locked", !isEligible());
}

// ---- chest open / mint -----------------------------------------------------
chestRow?.addEventListener("click", (e) => {
  const chest = e.target.closest(".chest");
  if (chest) onChestOpen();
});
async function onChestOpen() {
  let account;
  try { account = await ensureAccount(); } catch (_) { return; }
  await refreshEligibility();
  if (!isEligible()) {
    if (eligibility?.claimed) toast(t("status.claimed"), true);
    else if (eligibility?.missing?.length) toast(t("status.missing", { b: eligibility.missing.join(lang === "en" ? ", " : "、") }), true);
    return;
  }
  openModal(`<h3>${t("modal.opening")}</h3><div class="modal-spinner"></div><p>${t("modal.confirm")}</p><p class="muted">${CFG.nftName} · ${CFG.network}</p>`);
  try {
    const digest = await mintGift(account);
    await refreshEligibility();
    showSuccess(digest);
  } catch (err) {
    console.error(err);
    openModal(`<h3 class="err">${t("modal.failTitle")}</h3><p>${humanError(err)}</p><div class="modal-actions"><button class="modal-link solid" id="retryBtn">${t("modal.retry")}</button></div>`);
    $("#retryBtn")?.addEventListener("click", () => { closeModal(); onChestOpen(); });
  }
}
async function mintGift(account) {
  const e = eligibility;
  const tx = new Transaction();
  tx.moveCall({
    target: `${CFG.giftPackageId}::event_01_gift::mint`,
    arguments: [tx.object(CFG.mintCounter), tx.object(e.byBattle[1]), tx.object(e.byBattle[2]), tx.object(e.byBattle[3]), tx.object(CFG.clockId)],
  });
  tx.setSender(account.address);
  const sae = currentWallet.features["sui:signAndExecuteTransaction"];
  if (sae) { const out = await sae.signAndExecuteTransaction({ transaction: tx, account, chain: CFG.chain }); return out.digest; }
  const st = currentWallet.features["sui:signTransaction"];
  const { bytes, signature } = await st.signTransaction({ transaction: tx, account, chain: CFG.chain });
  const res = await client.executeTransactionBlock({ transactionBlock: bytes, signature, options: { showEffects: true } });
  return res.digest;
}
function showSuccess(digest) {
  const url = `https://suiscan.xyz/${CFG.network}/tx/${digest}`;
  openModal(`<h3>${t("modal.success")}</h3>
    <img class="modal-art" src="${CFG.nftImage}" alt="${CFG.nftName}" />
    <p><b style="color:var(--gold)">${CFG.nftName}</b><br/>${t("modal.minted")}</p>
    <div class="modal-actions"><a class="modal-link solid" href="${url}" target="_blank" rel="noopener">${t("modal.viewtx")}</a></div>
    <p class="muted" style="margin-top:14px">Sui ${CFG.network} · digest ${short(digest)}</p>`);
  toast(t("toast.success"));
}
function humanError(err) {
  const m = (err && (err.message || String(err))) || "error";
  if (/reject|cancel|denied|user/i.test(m)) return t("err.cancel");
  if (/insufficient|gas|balance/i.test(m)) return t("err.gas");
  if (/EAlreadyClaimed|claimed/i.test(m)) return t("err.claimed");
  if (/ENotOwner|ENotThreeBattles|EWrongBattles/i.test(m)) return t("err.notqual");
  if (/EEventEnded|ended/i.test(m)) return t("err.ended");
  return m;
}

// ---- boot ------------------------------------------------------------------
const netPill = $("#netPill");
if (netPill) netPill.textContent = "Sui · " + CFG.network.charAt(0).toUpperCase() + CFG.network.slice(1);
applyI18n();
(function tryAutoConnect() {
  for (const w of availableWallets()) {
    if (w.accounts && w.accounts.length) {
      currentWallet = w; currentAccount = w.accounts[0];
      reflectConnected(); refreshEligibility(); break;
    }
  }
})();
