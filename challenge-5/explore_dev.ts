import * as web3 from "@solana/web3.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const devWallet = new web3.PublicKey("dev2JBjyB5CshoGsiJCwzdmJYiEUwAXMdqDR7txoFBJ");

  console.log("Fetching signatures for dev wallet:", devWallet.toBase58());
  const signatures = await connection.getSignaturesForAddress(devWallet, { limit: 150 });
  console.log(`Found ${signatures.length} transactions.`);

  const programIds = new Set<string>();

  for (let i = 0; i < signatures.length; i++) {
    const sigInfo = signatures[i];
    await delay(300); // 300ms delay to avoid rate limiting
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        // Collect all accounts except the dev wallet and system program
        tx.transaction.message.staticAccountKeys.forEach((key) => {
          const keyStr = key.toBase58();
          // Program IDs are usually executable or have transaction logs invoking them
          if (
            keyStr !== devWallet.toBase58() && 
            keyStr !== "11111111111111111111111111111111" &&
            keyStr !== "ComputeBudget111111111111111111111111111111" &&
            keyStr !== "BPFLoaderUpgradeab1e11111111111111111111111"
          ) {
            programIds.add(keyStr);
          }
        });

        // Let's also print logs if we see program invokations of interest
        const logs = tx.meta?.logMessages;
        if (logs) {
          logs.forEach((log) => {
            if (log.includes("invoke") && !log.includes("11111111111111111111111111111111")) {
              console.log(`[Tx: ${sigInfo.signature.substring(0, 10)}...] Log: ${log}`);
            }
          });
        }
      }
    } catch (e: any) {
      console.log(`Error at index ${i}:`, e.message || e);
    }
  }

  console.log("\nAll candidate accounts/programs:");
  console.log(Array.from(programIds));
}

main().catch(err => console.error(err));
