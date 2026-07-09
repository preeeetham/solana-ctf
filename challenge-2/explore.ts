import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new web3.PublicKey("4tzADDiVAKviEf1Yi7GDiKG21MmLPgwkjVtaGvtheVCy");

  console.log("Fetching signatures for address:", programId.toBase58());
  const signatures = await connection.getSignaturesForAddress(programId, { limit: 10 });
  console.log(`Found ${signatures.length} transactions:`);
  
  for (const sigInfo of signatures) {
    console.log(`\nSignature: ${sigInfo.signature}`);
    console.log(`Slot: ${sigInfo.slot}`);
    console.log(`Err: ${JSON.stringify(sigInfo.err)}`);
    console.log(`Memo: ${sigInfo.memo}`);
    
    // Fetch transaction details to see logs and accounts involved
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        console.log("Signers/Accounts involved:", tx.transaction.message.staticAccountKeys.map(k => k.toBase58()));
        console.log("Logs:");
        tx.meta?.logMessages?.forEach(log => console.log(`  ${log}`));
      }
    } catch (e) {
      console.log("Could not fetch transaction details:", e);
    }
  }
}

main().catch(err => console.error(err));
