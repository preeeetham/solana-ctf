// Vault initialization instruction is not required for this challenge hence not included in the source code

use anchor_lang::prelude::*;

declare_id!("As9phEyQ89EecwUXtcVuJcwsvF2vspa7Je8qha7cDS25");

#[program]
mod ghost_admin {
    use super::*;

    pub fn admin_withdraw(ctx: Context<AdminWithdraw>) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.vault.admin,
            ErrorCode::Unauthorized
        );
                
        msg!("Withdrawal successful! ST_FLAG{$$$$$$$$$$$$$$$}");
        Ok(())
    }
}


#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    pub admin: UncheckedAccount<'info>,

    #[account(
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
}

#[account]
pub struct Vault {
    pub admin: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Only the admin can reveal the flag")]
    Unauthorized,
} 