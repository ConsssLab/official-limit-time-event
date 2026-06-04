/// ConSSS Wars — Echoes of Chainoa
/// Official limited-time event: "1st Gift" treasure-chest NFT.
///
/// ELIGIBILITY (anti-spam): a wallet may mint exactly ONE gift, and only if it
/// HOLDS Chronicles from three DIFFERENT battles (i.e. has cleared battles 1, 2
/// and 3). Eligibility is proven on-chain by passing three `&Chronicle` of the
/// caller's own (Sui only lets an address use its own owned objects as inputs),
/// and the `Chronicle` type guarantees they were minted by the real chronicle
/// package (which is itself voucher-gated). One-per-wallet is tracked in the
/// shared `MintCounter`.
module gift_nft::gift;

use std::string::{Self, String};
use sui::display;
use sui::event;
use sui::package;
use sui::table::{Self, Table};
use chronicle::chronicle::{Self, Chronicle};

// ---------- Errors ----------

const EAlreadyClaimed: u64 = 1;
const ENotThreeBattles: u64 = 2;
const EWrongVersion: u64 = 3;
const EPaused: u64 = 4;
const EAlreadyMigrated: u64 = 5;

// ---------- Constants ----------

/// Code-version gate (see chronicle for the rationale).
const VERSION: u64 = 1;

const NAME: vector<u8> = b"ConSSS Wars - 1st Gift";
const DESCRIPTION: vector<u8> =
    b"Official limited-time event reward of ConSSS Wars: Echoes of Chainoa. A treasure chest opened by the heroes of Chainoa.";
// Served from the (renamed) ConsssLab org's public-assets.
const IMAGE_URL: vector<u8> =
    b"https://raw.githubusercontent.com/ConsssLab/public-assets/main/consss-first-gift/consss-1st-gift.png";
const PROJECT_URL: vector<u8> = b"https://conssswars.com/";

// ---------- Types ----------

/// The collectible gift NFT minted by opening a treasure chest.
public struct Gift has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    /// Sequential edition number (1, 2, 3, ...).
    edition: u64,
}

/// Admin capability: pause minting and migrate after an upgrade.
public struct GiftAdminCap has key, store {
    id: UID,
}

/// Shared object: edition counter + one-per-wallet tracking + version/pause gate.
public struct MintCounter has key {
    id: UID,
    version: u64,
    paused: bool,
    minted: u64,
    /// Wallets that have already claimed (one gift per wallet).
    claimed: Table<address, bool>,
}

/// One-time witness for claiming the `Publisher` and setting up `Display`.
public struct GIFT has drop {}

/// Emitted on every successful mint.
public struct GiftMinted has copy, drop {
    edition: u64,
    recipient: address,
}

// ---------- init ----------

fun init(otw: GIFT, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    let mut disp = display::new<Gift>(&publisher, ctx);
    disp.add(string::utf8(b"name"), string::utf8(b"{name} #{edition}"));
    disp.add(string::utf8(b"description"), string::utf8(b"{description}"));
    disp.add(string::utf8(b"image_url"), string::utf8(b"{image_url}"));
    disp.add(string::utf8(b"project_url"), string::utf8(PROJECT_URL));
    disp.add(string::utf8(b"creator"), string::utf8(b"ConsssLab"));
    disp.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(disp, ctx.sender());

    transfer::public_transfer(GiftAdminCap { id: object::new(ctx) }, ctx.sender());

    transfer::share_object(MintCounter {
        id: object::new(ctx),
        version: VERSION,
        paused: false,
        minted: 0,
        claimed: table::new<address, bool>(ctx),
    });
}

// ---------- Admin ----------

public entry fun set_paused(_admin: &GiftAdminCap, counter: &mut MintCounter, paused: bool) {
    assert!(counter.version == VERSION, EWrongVersion);
    counter.paused = paused;
}

public entry fun migrate(_admin: &GiftAdminCap, counter: &mut MintCounter) {
    assert!(counter.version < VERSION, EAlreadyMigrated);
    counter.version = VERSION;
}

fun assert_active(counter: &MintCounter) {
    assert!(counter.version == VERSION, EWrongVersion);
    assert!(!counter.paused, EPaused);
}

// ---------- Mint ----------

/// Open a treasure chest: mint a 1st Gift NFT to the caller.
///
/// Requires the caller to pass three Chronicles they OWN, covering three
/// distinct battles (cleared battles 1, 2 and 3), and to not have claimed before.
public fun mint(
    counter: &mut MintCounter,
    c1: &Chronicle,
    c2: &Chronicle,
    c3: &Chronicle,
    ctx: &mut TxContext,
) {
    assert_active(counter);

    let who = ctx.sender();
    assert!(!table::contains(&counter.claimed, who), EAlreadyClaimed);

    // Three distinct battles. Passing &Chronicle of owned objects proves the
    // caller holds them; the Chronicle type proves they came from the real
    // (voucher-gated) chronicle package. battle_id ∈ {1,2,3}, so "all distinct"
    // means the caller cleared all three battles.
    let b1 = chronicle::battle_id(c1);
    let b2 = chronicle::battle_id(c2);
    let b3 = chronicle::battle_id(c3);
    assert!(b1 != b2 && b1 != b3 && b2 != b3, ENotThreeBattles);

    table::add(&mut counter.claimed, who, true);
    counter.minted = counter.minted + 1;
    let edition = counter.minted;

    let gift = Gift {
        id: object::new(ctx),
        name: string::utf8(NAME),
        description: string::utf8(DESCRIPTION),
        image_url: string::utf8(IMAGE_URL),
        edition,
    };

    event::emit(GiftMinted { edition, recipient: who });
    transfer::public_transfer(gift, who);
}

// ---------- Read accessors ----------

public fun total_minted(counter: &MintCounter): u64 { counter.minted }
public fun has_claimed(counter: &MintCounter, who: address): bool {
    table::contains(&counter.claimed, who)
}
public fun version(counter: &MintCounter): u64 { counter.version }
public fun is_paused(counter: &MintCounter): bool { counter.paused }

// ---------- Test-only helpers ----------

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    transfer::public_transfer(GiftAdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::share_object(MintCounter {
        id: object::new(ctx),
        version: VERSION,
        paused: false,
        minted: 0,
        claimed: table::new<address, bool>(ctx),
    });
}
