use anchor_lang::prelude::*;

declare_id!("FAccpSFtsnc1Msmc5TokmK55dokxTjUsbQjckxmZ7JZJ");

#[program]
pub mod where_is_the_needle {
    use super::*;

    pub fn create_flag_account(
        ctx: Context<CreateFlagAccount>, 
        flag_data: String,
        index: u32,
    ) -> Result<()> {
        let flag_account = &mut ctx.accounts.flag_account;
        
        require!(flag_data.len() <= 32, ErrorCode::FlagTooLong);
        
        let mut padded_flag = [0u8; 32];
        let flag_bytes = flag_data.as_bytes();
        padded_flag[..flag_bytes.len()].copy_from_slice(flag_bytes);
        
        flag_account.flag = padded_flag;
        flag_account.index = index;
        
        msg!("Flag account {} created", index);
        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(flag_data: String, index: u32)]
pub struct CreateFlagAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [b"flag", index.to_le_bytes().as_ref()],
        bump,
        space = 8 + 32 + 4 // discriminator + flag (32 bytes) + index (4 bytes)
    )]
    pub flag_account: Account<'info, FlagAccount>,

    pub system_program: Program<'info, System>,
}



#[account]
pub struct FlagAccount {
    pub flag: [u8; 32],  // 32 byte flag field
    pub index: u32,      // Index for identification
}

#[error_code]
pub enum ErrorCode {
    #[msg("Flag data is too long (max 32 bytes)")]
    FlagTooLong,
} 