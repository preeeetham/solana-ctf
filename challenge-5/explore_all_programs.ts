import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const userWallet = new web3.PublicKey("AGAk4JRMggFmAg3x5H9NqmJSayCc67irycUQHeQspZDY");

  console.log("Fetching signatures for user wallet:", userWallet.toBase58());
  const signatures = await connection.getSignaturesForAddress(userWallet, { limit: 500 });
  console.log(`Found ${signatures.length} transactions.`);

  const programIds = new Set<string>();

  for (const sigInfo of signatures) {
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        tx.transaction.message.staticAccountKeys.forEach((key, idx) => {
          // If the index is listed in the compiled instructions as a program ID, or just check all keys:
          programIds.add(key.toBase58());
        });
      }
    } catch (e) {
      // Ignore individual errors or rate limits, just keep going
    }
  }

  console.log("\nAll unique accounts/programs interacted with by user wallet:");
  console.log(Array.from(programIds));
}

main().catch(err => console.error(err));
