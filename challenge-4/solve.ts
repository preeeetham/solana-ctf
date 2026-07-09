import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Load our wallet keypair
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

  const programId = new web3.PublicKey("6V3rGaqVZakNJtvCFAHpz77LWgyBVf4uPSESDnh7dwsn");
  
  // Load IDL
  const idlPath = path.join(__dirname, "the_birthday_seed.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Cast program to any
  const program = new anchor.Program(idl, provider) as any;

  // Solana Mainnet Beta genesis block timestamp
  const seedHint = new anchor.BN(1584368940);
  console.log("Using seedHint:", seedHint.toString());

  // Manually derive the PDA to pass to the accounts list
  const [vaultPda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      seedHint.toArrayLike(Buffer, "le", 8)
    ],
    programId
  );
  console.log("Derived Vault PDA:", vaultPda.toBase58());

  // Try to fetch the vault account data to see if the flag is stored in it
  console.log("\nFetching vault account data...");
  console.log("Available accounts on program.account:", Object.keys(program.account || {}));
  
  let vaultData: any;
  if (program.account.vault) {
    vaultData = await program.account.vault.fetch(vaultPda);
  } else if (program.account.Vault) {
    vaultData = await program.account.Vault.fetch(vaultPda);
  } else {
    // Fallback: decode raw account info
    const accountInfo = await connection.getAccountInfo(vaultPda);
    if (accountInfo) {
      console.log("Raw account data length:", accountInfo.data.length);
      // The first 8 bytes is discriminator
      const flagBytes = accountInfo.data.subarray(8);
      // Decode Anchor string layout:
      // First 4 bytes is length of the string
      const strLen = flagBytes.readUInt32LE(0);
      const flagStr = flagBytes.subarray(4, 4 + strLen).toString("utf-8");
      console.log("Parsed string from raw data:", flagStr);
    }
  }

  if (vaultData) {
    console.log("Vault Data:", JSON.stringify(vaultData, null, 2));
  }
}

main().catch((err) => {
  console.error("Unhandle exception:", err);
});
