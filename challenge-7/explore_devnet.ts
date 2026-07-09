import * as web3 from "@solana/web3.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const address = new web3.PublicKey("FuuoGANyKxN5x9hVaCunqNYK2Qoe51rkouFdGfmBH3d3");

  console.log("Fetching signatures for address:", address.toBase58());
  const signatures = await connection.getSignaturesForAddress(address, { limit: 20 });
  console.log(`Found ${signatures.length} transactions:\n`);

  for (const sigInfo of signatures) {
    console.log(`Signature: ${sigInfo.signature}`);
    console.log(`Slot: ${sigInfo.slot}`);
    if (sigInfo.blockTime) {
      const date = new Date(sigInfo.blockTime * 1000);
      console.log(`Block Time (Unix): ${sigInfo.blockTime}`);
      console.log(`Block Date (UTC): ${date.toUTCString()}`);
      console.log(`Block Date (Local): ${date.toLocaleString()}`);
    }
    console.log(`Memo: ${sigInfo.memo}`);
    
    await delay(500); // delay to avoid rate limit
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        console.log("Logs:");
        tx.meta?.logMessages?.forEach(log => console.log(`  ${log}`));

        // Print instructions detail
        tx.transaction.message.compiledInstructions.forEach((inst, idx) => {
          const programId = tx.transaction.message.staticAccountKeys[inst.programIdIndex]?.toBase58();
          console.log(`  Instruction #${idx} Program: ${programId}`);
          console.log(`  Instruction #${idx} Data (Hex): ${Buffer.from(inst.data).toString("hex")}`);
          console.log(`  Instruction #${idx} Data (UTF-8): ${Buffer.from(inst.data).toString("utf-8").replace(/[^\x20-\x7E]/g, '')}`);
        });
      }
    } catch (e: any) {
      console.log("Error fetching transaction details:", e.message || e);
    }
    console.log("----------------------------------------------------------------------\n");
  }
}

main().catch(err => console.error(err));
