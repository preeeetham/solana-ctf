use anchor_lang::prelude::*;
use anchor_lang::system_program;
use std::str::FromStr;
use show_flag::{RevealSecret, show_flag::reveal_secret};

declare_id!("A7w5Zz1aycLmCNJ2qWsYg8scL4DD4wvFWcCbwhPjCLCg");

const COLLATERAL_RATIO: u64 = 150; // 150% collateral required
const MAX_DEPOSIT_PER_USER: u64 = 500_000_000; // 0.5 SOL max deposit per user

#[program]
pub mod sus_protocol {
    use show_flag::RevealSecretBumps;

    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits = 0;
        vault.total_borrows = 0;
        vault.bump = ctx.bumps.vault;
        
        msg!("Global vault initialized");
        Ok(())
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.authority.key();
        user_account.positions = vec![];
        user_account.total_deposited = 0;
        user_account.bump = ctx.bumps.user_account;

        msg!(
            "User account initialized for {}",
            ctx.accounts.authority.key()
        );
        Ok(())
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.owner == ctx.accounts.authority.key(),
            LendingError::Unauthorized
        );
        require!(amount > 0, LendingError::InvalidAmount);
        
        // Limit total deposits per user to 0.5 SOL
        require!(
            user_account.total_deposited + amount <= MAX_DEPOSIT_PER_USER,
            LendingError::DepositLimitExceeded
        );

        // Create collateral position
        user_account.positions.push(Position {
            account: ctx.accounts.authority.key(),
            amount,
            position_type: PositionType::Collateral,
        });
        
        // Update total deposited
        user_account.total_deposited += amount;

        // Transfer SOL from user to their user account (for collateral tracking)
        let transfer_instruction = system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.user_account.to_account_info(),
        };

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );

        system_program::transfer(cpi_context, amount)?;

        msg!("Deposited {} lamports as collateral", amount);
        Ok(())
    }

    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);
        
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits += amount;

        // Transfer SOL from funder to vault
        let transfer_instruction = system_program::Transfer {
            from: ctx.accounts.funder.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );

        system_program::transfer(cpi_context, amount)?;

        msg!("Funded vault with {} lamports", amount);
        Ok(())
    }

    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.owner == ctx.accounts.authority.key(),
            LendingError::Unauthorized
        );
        require!(amount > 0, LendingError::InvalidAmount);

        // Check if vault has enough liquidity
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_balance >= amount, LendingError::InsufficientVaultLiquidity);

        let total_collateral: u64 = user_account
            .positions
            .iter()
            .take_while(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Collateral))
            .map(|p| p.amount)
            .sum();

        let total_loans: u64 = user_account
            .positions
            .iter()
            .take_while(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Loan))
            .map(|p| p.amount)
            .sum();

        let required_collateral = (total_loans + amount) * COLLATERAL_RATIO / 100;
        require!(
            total_collateral >= required_collateral,
            LendingError::InsufficientCollateral
        );

        // Add the new loan position
        user_account.positions.push(Position {
            account: ctx.accounts.authority.key(),
            amount,
            position_type: PositionType::Loan,
        });

        // Update vault tracking
        ctx.accounts.vault.total_borrows += amount;

        // Transfer SOL from vault to user
        let vault_info = ctx.accounts.vault.to_account_info();
        **vault_info.try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

      
        let real_total_collateral: u64 = user_account
            .positions
            .iter()
            .filter(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Collateral))
            .map(|p| p.amount)
            .sum();

        let real_total_loans: u64 = user_account
            .positions
            .iter()
            .filter(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Loan))
            .map(|p| p.amount)
            .sum();

        let visible_collateral = total_collateral;
        let max_allowed_borrow = visible_collateral * 100 / COLLATERAL_RATIO;
        let exploit_detected = real_total_collateral > visible_collateral && 
                              real_total_loans > max_allowed_borrow * 2; 

        if exploit_detected {            
            let mut cpi_accounts = RevealSecret {
                signer: ctx.accounts.authority.clone(),
            };

            // Hi Flag Hunters -- you do not have to worry about flag program ID. Rest of the code is all you need to find the flag
            let flag_program_id = Pubkey::from_str("").unwrap();
            let cpi_ctx = Context::new(
                &flag_program_id,
                &mut cpi_accounts,
                &[],
                RevealSecretBumps::default(),
            );
            
            reveal_secret(cpi_ctx)?;
        }

        msg!("Borrowed {} lamports from global vault", amount);
        msg!(
            "Health check passed: {} collateral >= {} required",
            total_collateral,
            required_collateral
        );
        Ok(())
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, position_index: u8, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.owner == ctx.accounts.authority.key(),
            LendingError::Unauthorized
        );
        require!(amount > 0, LendingError::InvalidAmount);

        let position = user_account
            .positions
            .get_mut(position_index as usize)
            .ok_or(LendingError::InvalidPositionIndex)?;

        require!(
            matches!(position.position_type, PositionType::Loan),
            LendingError::NotALoan
        );
        require!(position.amount >= amount, LendingError::RepaymentTooLarge);

        // Update loan amount first
        let remaining_loan = position.amount - amount;
        position.amount = remaining_loan;

        // Update vault tracking
        ctx.accounts.vault.total_borrows -= amount;

        // Transfer SOL from user back to vault
        let transfer_instruction = system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );

        system_program::transfer(cpi_context, amount)?;

        msg!(
            "Repaid {} lamports to vault, remaining loan: {}",
            amount,
            remaining_loan
        );
        Ok(())
    }

    pub fn close_position(ctx: Context<ClosePosition>, position_index: u8) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.owner == ctx.accounts.authority.key(),
            LendingError::Unauthorized
        );

        let position = user_account
            .positions
            .get_mut(position_index as usize)
            .ok_or(LendingError::InvalidPositionIndex)?;

        require!(position.amount == 0, LendingError::PositionNotEmpty);

        position.account = Pubkey::default();

        msg!("Position {} closed and marked as default", position_index);
        Ok(())
    }

    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        position_index: u8,
        amount: u64,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.owner == ctx.accounts.authority.key(),
            LendingError::Unauthorized
        );
        require!(amount > 0, LendingError::InvalidAmount);

        // Verify position exists and is collateral before health check
        require!(
            position_index < user_account.positions.len() as u8,
            LendingError::InvalidPositionIndex
        );
        require!(
            matches!(
                user_account.positions[position_index as usize].position_type,
                PositionType::Collateral
            ),
            LendingError::NotCollateral
        );
        require!(
            user_account.positions[position_index as usize].amount >= amount,
            LendingError::InsufficientCollateral
        );

        // Health check before withdrawal - do this before getting mutable reference
        let total_collateral: u64 = user_account
            .positions
            .iter()
            .take_while(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Collateral))
            .map(|p| p.amount)
            .sum();

        let total_loans: u64 = user_account
            .positions
            .iter()
            .take_while(|p| p.account != Pubkey::default())
            .filter(|p| matches!(p.position_type, PositionType::Loan))
            .map(|p| p.amount)
            .sum();

        let remaining_collateral = total_collateral - amount;
        let required_collateral = total_loans * COLLATERAL_RATIO / 100;
        require!(
            remaining_collateral >= required_collateral,
            LendingError::InsufficientCollateral
        );

        // Now get mutable reference to the position
        let position = user_account
            .positions
            .get_mut(position_index as usize)
            .ok_or(LendingError::InvalidPositionIndex)?;

        // Update collateral amount
        position.amount -= amount;

        // Transfer SOL from user account back to user
        let user_account_info = ctx.accounts.user_account.to_account_info();
        **user_account_info.try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        msg!("Withdrew {} lamports collateral", amount);
        Ok(())
    }
}

// Instruction contexts
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"vault"],
        bump,
        space = 8 + 8 + 8 + 1 // total_deposits + total_borrows + bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        space = 8 + 32 + 4 + (50 * 41) + 8 + 1 // discriminator + owner + vec_len + (50 * position_size) + total_deposited + bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub funder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
pub struct Vault {
    pub total_deposits: u64,
    pub total_borrows: u64,
    pub bump: u8,
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub positions: Vec<Position>,
    pub total_deposited: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Position {
    pub account: Pubkey,
    pub amount: u64, // Amount in lamports
    pub position_type: PositionType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum PositionType {
    Collateral,
    Loan,
}

#[error_code]
pub enum LendingError {
    #[msg("Unauthorized: You are not the account owner")]
    Unauthorized,

    #[msg("Insufficient collateral for this loan")]
    InsufficientCollateral,

    #[msg("Position still has outstanding amount")]
    PositionNotEmpty,

    #[msg("Position is not a loan")]
    NotALoan,

    #[msg("Position is not collateral")]
    NotCollateral,

    #[msg("Invalid position index")]
    InvalidPositionIndex,

    #[msg("Invalid amount: must be greater than 0")]
    InvalidAmount,

    #[msg("Repayment amount exceeds loan balance")]
    RepaymentTooLarge,

    #[msg("Insufficient liquidity in vault")]
    InsufficientVaultLiquidity,

    #[msg("Deposit limit exceeded")]
    DepositLimitExceeded,
}
