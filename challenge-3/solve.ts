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

  const programId = new web3.PublicKey("5zzgo53dmRCCwrxX3q7UDmssW26Gh4f7Y8J2mEE7Rvds");
  
  // Load IDL
  const idlPath = path.join(__dirname, "logs_of_truth.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Cast program to any
  const program = new anchor.Program(idl, provider) as any;

  const inputs = [
    new anchor.BN(1000000000), // 1 SOL in lamports
    new anchor.BN(2000000000), // 2 SOL in lamports
    new anchor.BN(3000000000)  // 3 SOL in lamports
  ];

  let fullFlag = "";

  for (let i = 0; i < inputs.length; i++) {
    const inputVal = inputs[i];
    console.log(`\nSending verifyNumber transaction for input: ${inputVal.toString()}...`);
    try {
      const txSig = await program.methods
        .verifyNumber(inputVal)
        .accounts({
          signer: keypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Transaction Signature: ${txSig}`);

      // Fetch transaction details to print logs
      const txDetails = await connection.getTransaction(txSig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (txDetails?.meta?.logMessages) {
        txDetails.meta.logMessages.forEach((log) => {
          console.log(`  ${log}`);
          // Reconstruct the flag from program logs
          // Valid outputs will contain "ST_FLAG{", "sol_", or "truth}"
          if (log.includes("ST_FLAG{") || log.includes("sol_") || log.includes("truth}")) {
            const matches = log.match(/Program log: (.*)/);
            if (matches && matches[1]) {
              fullFlag += matches[1];
            }
          }
        });
      }
    } catch (err: any) {
      console.error(`Error for input ${inputVal.toString()}:`, err.message);
    }
  }

  console.log("\n====================================");
  console.log("Reconstructed Flag:", fullFlag);
  console.log("====================================");
}

main().catch((err) => {
  console.error("Execution failed:", err);
});
