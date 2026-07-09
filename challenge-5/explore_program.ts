import * as web3 from "@solana/web3.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new web3.PublicKey("F2PY8AKbNuTe36RuVHpgnxunkQWqwWy2MEnSMsNX2VqD");

  console.log("Fetching signatures for program:", programId.toBase58());
  const signatures = await connection.getSignaturesForAddress(programId, { limit: 5 });
  console.log(`Found ${signatures.length} transactions:`);

  for (const sigInfo of signatures) {
    console.log(`\nSignature: ${sigInfo.signature} | Slot: ${sigInfo.slot} | Err: ${JSON.stringify(sigInfo.err)}`);
    await delay(1500); // 1.5s delay
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        console.log("Static Account Keys:", tx.transaction.message.staticAccountKeys.map(k => k.toBase58()));
        console.log("Logs:");
        tx.meta?.logMessages?.forEach(log => console.log(`  ${log}`));
      }
    } catch (e) {
      console.log("Error fetching tx:", e);
    }
  }
}

main().catch(err => console.error(err));
