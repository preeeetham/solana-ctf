import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Load the bo1t keypair
  const walletPath = path.join(__dirname, "bo1tK1o19JqSDUotT3xFuTDtUt45sGvNZXKnP3eexMF.json");
  const walletSecret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = web3.Keypair.fromSecretKey(new Uint8Array(walletSecret));
  console.log("Using solver wallet:", keypair.publicKey.toBase58());

  // Setup Anchor provider
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new web3.PublicKey("4tzADDiVAKviEf1Yi7GDiKG21MmLPgwkjVtaGvtheVCy");
  
  // Load IDL
  const idlPath = path.join(__dirname, "good_first_impression.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Cast program to any
  const program = new anchor.Program(idl, provider) as any;

  console.log("Sending getFlag transaction...");
  const txSig = await program.methods
    .getFlag()
    .accounts({
      signer: keypair.publicKey,
    })
    .rpc();

  console.log("Transaction Signature:", txSig);

  // Fetch transaction details to print logs
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
