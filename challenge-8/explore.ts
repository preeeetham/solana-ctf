import * as web3 from "@solana/web3.js";

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new web3.PublicKey("FAccpSFtsnc1Msmc5TokmK55dokxTjUsbQjckxmZ7JZJ");

  console.log("Fetching program accounts for:", programId.toBase58());
  const accounts = await connection.getProgramAccounts(programId);
  console.log(`Found ${accounts.length} accounts.\n`);

  for (const acc of accounts) {
    const data = acc.account.data;
    if (data.length < 8 + 32 + 4) {
      console.log(`Account ${acc.pubkey.toBase58()} has invalid data length: ${data.length}`);
      continue;
    }

    const flagBytes = data.subarray(8, 8 + 32);
    const index = data.readUInt32LE(8 + 32);

    // Convert flag bytes to string, filtering out null characters
    const flagStr = flagBytes.toString("utf8").replace(/\0/g, "");

    if (flagStr.includes("ST_FLAG") || flagStr.includes("ST_")) {
      console.log(`[FOUND NEEDLE] Index: ${index} | PDA: ${acc.pubkey.toBase58()} | Flag: "${flagStr}"`);
    }
  }
}

main().catch(err => console.error(err));
