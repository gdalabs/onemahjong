module onemahjong::game {
    use one::object::{Self, UID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    use one::event;
    use one::clock::{Self, Clock};
    use std::string::{Self, String};

    // ============ Error codes ============
    const E_NOT_PLAYER: u64 = 1;

    // ============ Structs ============

    /// Player's on-chain profile and stats
    struct PlayerProfile has key, store {
        id: UID,
        owner: address,
        total_games: u64,
        wins: u64,
        losses: u64,
        highest_score: u64,
    }

    /// Game result recorded on-chain
    struct GameResult has key, store {
        id: UID,
        player: address,
        score: u64,
        winning_hand: String,
        yaku_name: String,
        timestamp_ms: u64,
    }

    /// Yaku (winning hand) NFT — collectible achievement
    struct YakuNFT has key, store {
        id: UID,
        name: String,
        description: String,
        han: u64,
        player: address,
        game_id: u64,
        timestamp_ms: u64,
    }

    // ============ Events ============

    struct GameFinished has copy, drop {
        player: address,
        score: u64,
        yaku_name: String,
    }

    struct YakuMinted has copy, drop {
        player: address,
        yaku_name: String,
        han: u64,
    }

    // ============ Functions ============

    /// Create a new player profile
    public entry fun create_profile(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let profile = PlayerProfile {
            id: object::new(ctx),
            owner: sender,
            total_games: 0,
            wins: 0,
            losses: 0,
            highest_score: 0,
        };
        transfer::transfer(profile, sender);
    }

    /// Record a game result and mint yaku NFT
    public entry fun record_game(
        profile: &mut PlayerProfile,
        score: u64,
        winning_hand: vector<u8>,
        yaku_name: vector<u8>,
        han: u64,
        won: bool,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(profile.owner == sender, E_NOT_PLAYER);

        let timestamp = clock::timestamp_ms(clock);
        let yaku_str = string::utf8(yaku_name);
        let hand_str = string::utf8(winning_hand);

        // Update profile stats
        profile.total_games = profile.total_games + 1;
        if (won) {
            profile.wins = profile.wins + 1;
            if (score > profile.highest_score) {
                profile.highest_score = score;
            };
        } else {
            profile.losses = profile.losses + 1;
        };

        // Create game result
        let result = GameResult {
            id: object::new(ctx),
            player: sender,
            score,
            winning_hand: hand_str,
            yaku_name: yaku_str,
            timestamp_ms: timestamp,
        };
        transfer::transfer(result, sender);

        // Emit event
        event::emit(GameFinished {
            player: sender,
            score,
            yaku_name: string::utf8(yaku_name),
        });

        // Mint yaku NFT if player won
        if (won && han > 0) {
            let nft = YakuNFT {
                id: object::new(ctx),
                name: string::utf8(yaku_name),
                description: string::utf8(b"OneMahjong Yaku Achievement"),
                han,
                player: sender,
                game_id: profile.total_games,
                timestamp_ms: timestamp,
            };
            transfer::transfer(nft, sender);

            event::emit(YakuMinted {
                player: sender,
                yaku_name: string::utf8(yaku_name),
                han,
            });
        };
    }
}
