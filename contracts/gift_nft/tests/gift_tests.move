#[test_only]
module gift_nft::gift_tests;

use gift_nft::gift::{Self, MintCounter};
use chronicle::chronicle::{Self, ChronicleRegistry};
use sui::clock;
use sui::test_scenario as ts;

const PLAYER: address = @0xA11CE;

fun mint_chronicle(reg: &mut ChronicleRegistry, battle: u8, clk: &clock::Clock, sc: &mut ts::Scenario): chronicle::Chronicle {
    chronicle::mint_for_testing(reg, battle, 1, 50, b"blob", clk, ts::ctx(sc))
}

#[test]
fun mint_gift_requires_three_battles_and_one_per_wallet() {
    let mut sc = ts::begin(PLAYER);
    chronicle::init_for_testing(ts::ctx(&mut sc));
    gift::init_for_testing(ts::ctx(&mut sc));

    ts::next_tx(&mut sc, PLAYER);
    let mut creg = ts::take_shared<ChronicleRegistry>(&sc);
    let mut counter = ts::take_shared<MintCounter>(&sc);
    let clk = clock::create_for_testing(ts::ctx(&mut sc));

    let c1 = mint_chronicle(&mut creg, 1, &clk, &mut sc);
    let c2 = mint_chronicle(&mut creg, 2, &clk, &mut sc);
    let c3 = mint_chronicle(&mut creg, 3, &clk, &mut sc);

    gift::mint(&mut counter, &c1, &c2, &c3, ts::ctx(&mut sc));
    assert!(gift::total_minted(&counter) == 1, 1);
    assert!(gift::has_claimed(&counter, PLAYER), 2);
    assert!(gift::version(&counter) == 1 && !gift::is_paused(&counter), 3);

    chronicle::destroy_for_testing(c1);
    chronicle::destroy_for_testing(c2);
    chronicle::destroy_for_testing(c3);
    clock::destroy_for_testing(clk);
    ts::return_shared(creg);
    ts::return_shared(counter);
    ts::end(sc);
}

#[test]
#[expected_failure(abort_code = gift::ENotThreeBattles)]
fun rejects_when_battles_not_distinct() {
    let mut sc = ts::begin(PLAYER);
    chronicle::init_for_testing(ts::ctx(&mut sc));
    gift::init_for_testing(ts::ctx(&mut sc));

    ts::next_tx(&mut sc, PLAYER);
    let mut creg = ts::take_shared<ChronicleRegistry>(&sc);
    let mut counter = ts::take_shared<MintCounter>(&sc);
    let clk = clock::create_for_testing(ts::ctx(&mut sc));

    let c1 = mint_chronicle(&mut creg, 1, &clk, &mut sc);
    let c2 = mint_chronicle(&mut creg, 1, &clk, &mut sc); // same battle as c1
    let c3 = mint_chronicle(&mut creg, 2, &clk, &mut sc);

    gift::mint(&mut counter, &c1, &c2, &c3, ts::ctx(&mut sc)); // aborts ENotThreeBattles

    chronicle::destroy_for_testing(c1);
    chronicle::destroy_for_testing(c2);
    chronicle::destroy_for_testing(c3);
    clock::destroy_for_testing(clk);
    ts::return_shared(creg);
    ts::return_shared(counter);
    ts::end(sc);
}

#[test]
#[expected_failure(abort_code = gift::EAlreadyClaimed)]
fun rejects_second_claim_same_wallet() {
    let mut sc = ts::begin(PLAYER);
    chronicle::init_for_testing(ts::ctx(&mut sc));
    gift::init_for_testing(ts::ctx(&mut sc));

    ts::next_tx(&mut sc, PLAYER);
    let mut creg = ts::take_shared<ChronicleRegistry>(&sc);
    let mut counter = ts::take_shared<MintCounter>(&sc);
    let clk = clock::create_for_testing(ts::ctx(&mut sc));

    let c1 = mint_chronicle(&mut creg, 1, &clk, &mut sc);
    let c2 = mint_chronicle(&mut creg, 2, &clk, &mut sc);
    let c3 = mint_chronicle(&mut creg, 3, &clk, &mut sc);

    gift::mint(&mut counter, &c1, &c2, &c3, ts::ctx(&mut sc));
    ts::next_tx(&mut sc, PLAYER);
    gift::mint(&mut counter, &c1, &c2, &c3, ts::ctx(&mut sc)); // aborts EAlreadyClaimed

    chronicle::destroy_for_testing(c1);
    chronicle::destroy_for_testing(c2);
    chronicle::destroy_for_testing(c3);
    clock::destroy_for_testing(clk);
    ts::return_shared(creg);
    ts::return_shared(counter);
    ts::end(sc);
}
