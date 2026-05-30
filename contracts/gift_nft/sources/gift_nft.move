/// ConSSS Wars — Echoes of Chainoa
/// Official limited-time event: "1st Gift" treasure-chest NFT.
///
/// Anyone may open a treasure chest on the event page to mint a
/// `ConSSS Wars - 1st Gift` NFT to their own wallet. A shared
/// `MintCounter` assigns each gift a sequential edition number.
module gift_nft::gift;

use std::string::{Self, String};
use sui::display;
use sui::event;
use sui::package;

/// The collectible gift NFT minted by opening a treasure chest.
public struct Gift has key, store {
    id: UID,
    /// Display name, e.g. "ConSSS Wars - 1st Gift".
    name: String,
    /// Flavor description shown in wallets / explorers.
    description: String,
    /// Image shown in wallets / marketplaces.
    image_url: String,
    /// Sequential edition number (1, 2, 3, ...).
    edition: u64,
}

/// Shared object tracking how many gifts have been minted.
public struct MintCounter has key {
    id: UID,
    minted: u64,
}

/// One-time witness for claiming the `Publisher` and setting up `Display`.
public struct GIFT has drop {}

/// Emitted on every successful mint.
public struct GiftMinted has copy, drop {
    edition: u64,
    recipient: address,
}

const NAME: vector<u8> = b"ConSSS Wars - 1st Gift";
const DESCRIPTION: vector<u8> =
    b"Official limited-time event reward of ConSSS Wars: Echoes of Chainoa. A treasure chest opened by the heroes of Chainoa.";
const IMAGE_URL: vector<u8> =
    b"https://raw.githubusercontent.com/ConsssLabs/public-assets/main/consss-first-gift/consss-1st-gift.png";
const PROJECT_URL: vector<u8> = b"https://conssswars.com/";

fun init(otw: GIFT, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    let mut disp = display::new<Gift>(&publisher, ctx);
    disp.add(string::utf8(b"name"), string::utf8(b"{name} #{edition}"));
    disp.add(string::utf8(b"description"), string::utf8(b"{description}"));
    disp.add(string::utf8(b"image_url"), string::utf8(b"{image_url}"));
    disp.add(string::utf8(b"project_url"), string::utf8(PROJECT_URL));
    disp.add(string::utf8(b"creator"), string::utf8(b"ConSSS Labs"));
    disp.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(disp, ctx.sender());

    transfer::share_object(MintCounter { id: object::new(ctx), minted: 0 });
}

/// Open a treasure chest: mint a 1st Gift NFT to the caller.
public fun mint(counter: &mut MintCounter, ctx: &mut TxContext) {
    counter.minted = counter.minted + 1;
    let edition = counter.minted;

    let gift = Gift {
        id: object::new(ctx),
        name: string::utf8(NAME),
        description: string::utf8(DESCRIPTION),
        image_url: string::utf8(IMAGE_URL),
        edition,
    };

    event::emit(GiftMinted { edition, recipient: ctx.sender() });
    transfer::public_transfer(gift, ctx.sender());
}

/// Total number of gifts minted so far.
public fun total_minted(counter: &MintCounter): u64 {
    counter.minted
}
