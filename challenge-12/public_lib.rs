use anchor_lang::prelude::*;

declare_id!("Adom7b6AmcmaPPLsB5bz8KZYN5NfuqYWeHLQ9jYeWBbY");


const EXPECTED_HASHES: [[u32; 4]; 17] = [
    [0x037343fa, 0x11880907, 0x7060fd97, 0x1fb6ecea], 
    [0xea9d49ce, 0x11cecf30, 0x5de84f8f, 0x837e22a0], 
    [0xbad8e326, 0x13939fc3, 0x02a684d5, 0x4d54d75b], 
    [0xb5f46b4b, 0x72087731, 0xe68c32d4, 0x2756ef9b], 
    [0xa9f8a04a, 0x0f5c5afd, 0xbbaad177, 0xa2b0586c], 
    [0x31f9f2c6, 0x755f9033, 0xcc024bda, 0x6ab69ac1], 
    [0xac5b2d1b, 0xc7a51b04, 0x11792006, 0x12b11170], 
    [0xccd90ec0, 0xb0c9c354, 0xb91e7d91, 0x70a27bca], 
    [0x37828bc9, 0xc0af7315, 0x5d817585, 0xc4eaf590], 
    [0xf505800a, 0x70d64b59, 0x618cf841, 0x46261996], 
    [0x43a020ea, 0x68518fc0, 0xf49f40d4, 0xe2324f14], 
    [0xdd2d0141, 0x324023e9, 0xba88254f, 0x86868757], 
    [0x6b5bc05d, 0xf61dd2d3, 0x5c0411ab, 0xaef23863], 
    [0x57db7763, 0x75f32937, 0xed273fbe, 0x444a05e6], 
    [0xf8b9c1f4, 0x20e3b572, 0x565f714b, 0x816ad93e], 
    [0xa0a213ad, 0x64b7a47c, 0x0cdc5929, 0xb60a744c], 
    [0x9e872f32, 0xd1683f71, 0xc8a8df32, 0x251d2f11], 
];

#[program]
pub mod voucher_roulette {
    use super::*;

    pub fn redeem_code(_ctx: Context<Redeem>, code: String) -> Result<()> {
        require!(code.len() == 17, ErrorCode::WrongLength);

        // Check each character position individually
        for (i, ch) in code.chars().enumerate() {
            // Create a string with the character and its position for hashing
            let hash_input = format!("{}{}", ch, i);
            let hash = md5::compute(hash_input.as_bytes());
            let hash_u32s = hash_to_u32_array(hash.0);

            // Compare against expected hash for this position
            if hash_u32s != EXPECTED_HASHES[i] {
                return Err(get_flag_error(i).into());
            }
        }

        msg!("🎉 Voucher accepted! You found the correct flag!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    pub signer: Signer<'info>,
}

// Convert MD5 hash bytes to u32 array for comparison
fn hash_to_u32_array(hash_bytes: [u8; 16]) -> [u32; 4] {
    let mut result = [0u32; 4];
    for i in 0..4 {
        result[i] = u32::from_le_bytes([
            hash_bytes[i * 4],
            hash_bytes[i * 4 + 1],
            hash_bytes[i * 4 + 2],
            hash_bytes[i * 4 + 3],
        ]);
    }
    result
}