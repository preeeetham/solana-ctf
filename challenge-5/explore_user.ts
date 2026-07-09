import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const userWallet = new web3.PublicKey("AGAk4JRMggFmAg3x5H9NqmJSayCc67irycUQHeQspZDY");

  console.log("Fetching signatures for user wallet:", userWallet.toBase58());
  const signatures = await connection.getSignaturesForAddress(userWallet, { limit: 50 });
  console.log(`Found ${signatures.length} transactions:`);

  for (const sigInfo of signatures) {
    console.log(`\nSignature: ${sigInfo.signature} | Slot: ${sigInfo.slot} | Err: ${JSON.stringify(sigInfo.err)}`);
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        console.log("All accounts involved:", tx.transaction.message.staticAccountKeys.map(k => k.toBase58()));
        console.log("Logs:");
        tx.meta?.logMessages?.forEach(log => console.log(`  ${log}`));
      }
    } catch (e) {
      console.log("Error fetching tx:", e);
    }
  }
}

main().catch(err => console.error(err));
