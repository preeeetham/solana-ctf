import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = new web3.PublicKey("cshNEa1e9jupYHodbvNCGZEns9KorxwzSu9QS7Qc94s");

  console.log("Fetching signatures for solver wallet:", wallet.toBase58());
  const signatures = await connection.getSignaturesForAddress(wallet, { limit: 10 });
  console.log(`Found ${signatures.length} transactions:`);

  for (const sigInfo of signatures) {
    console.log(`\nSignature: ${sigInfo.signature} | Slot: ${sigInfo.slot}`);
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
