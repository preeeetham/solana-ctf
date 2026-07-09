import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new web3.PublicKey("6V3rGaqVZakNJtvCFAHpz77LWgyBVf4uPSESDnh7dwsn");

  console.log("Fetching signatures for address:", programId.toBase58());
  const signatures = await connection.getSignaturesForAddress(programId, { limit: 100 });
  console.log(`Found ${signatures.length} transactions:`);
  
  let successCount = 0;
  for (const sigInfo of signatures) {
    if (sigInfo.err === null) {
      successCount++;
      console.log(`\nSuccessful Signature: ${sigInfo.signature}`);
      console.log(`Slot: ${sigInfo.slot}`);
      try {
        const tx = await connection.getTransaction(sigInfo.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        if (tx) {
          console.log("Logs:");
          tx.meta?.logMessages?.forEach(log => console.log(`  ${log}`));

          // Decode instruction data
          const compiledInstructions = tx.transaction.message.compiledInstructions;
          for (const inst of compiledInstructions) {
            const data = Buffer.from(inst.data);
            if (data.length >= 8) {
              const discriminator = data.subarray(0, 8);
              const argData = data.subarray(8);
              if (argData.length === 8) {
                const value = argData.readBigUInt64LE();
                console.log(`Decoded u64 seedHint: ${value.toString()} (${value.toString(16)} hex)`);
              }
            }
          }
        }
      } catch (e) {
        console.log("Could not fetch transaction details:", e);
      }
    }
  }
  console.log(`\nScan finished. Total successful transactions found: ${successCount}`);
}

main().catch(err => console.error(err));
