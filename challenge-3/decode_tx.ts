import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Signatures of interest:
  const sigs = [
    { name: "Part 1 (ST_FLAG{1sol_)", sig: "5Fsj5V4JzibLGRbcfJb6d9V4d8xgeUdYu8yFt9VL7rgMrXtEWyvQS3Y4tSqgBxT1GD5ZdS9NqKypQCqeX1nJFhEF" },
    { name: "Part 2 (2sol_3sol_)", sig: "NN3oEEscmcjae8xswZdtBvbvC6kpSQC3XQsyczDuHibFFaeethqM2r6SEpkwMCecNQdMgB8enhqjaiGLQX8bmqw" },
    { name: "Part 3 (truth})", sig: "48DFWwR4etGiQ7HGE3cVbrrpgegqdPFo2eoRXkWkJcdHj86sodEhLMBdDgGNdbNmHBAhGJnBjynwd5G52wxeSmAr" }
  ];

  for (const item of sigs) {
    console.log(`\nFetching transaction for ${item.name}...`);
    const tx = await connection.getTransaction(item.sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });

    if (tx) {
      // Find the compiled instructions
      const compiledInstructions = tx.transaction.message.compiledInstructions;
      for (const inst of compiledInstructions) {
        const data = Buffer.from(inst.data);
        console.log("Raw Instruction Data (hex):", data.toString("hex"));
        // Anchor instruction layout:
        // Bytes 0-7: Instruction discriminator
        // Bytes 8+: Arguments
        if (data.length >= 8) {
          const discriminator = data.subarray(0, 8);
          console.log("Discriminator (hex):", discriminator.toString("hex"));
          const argData = data.subarray(8);
          console.log("Arguments Data (hex):", argData.toString("hex"));
          if (argData.length === 8) {
            // It's a u64 (8 bytes)
            // read as Little Endian
            const value = argData.readBigUInt64LE();
            console.log(`Decoded u64 value: ${value.toString()} (${value.toString(16)} hex)`);
          } else {
            console.log(`Arguments length: ${argData.length}`);
          }
        }
      }
    }
  }
}

main().catch(err => console.error(err));
