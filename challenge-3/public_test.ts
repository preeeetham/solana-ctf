import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
// IDL Import
import { LogsOfTruth } from "logs_of_truth";

describe("Logs of Truth", () => {

  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.LogsOfTruth as anchor.Program<LogsOfTruth>;
  const wallet = provider.wallet as anchor.Wallet;

  console.log("Using Wallet:", wallet.publicKey.toBase58());

  it("find flag by verifying secret numbers", async () => {

    try {
    const SECRET_NUMBER = 100000 // ?;
        const sig = await program.methods
          .verifyNumber(new anchor.BN(SECRET_NUMBER))
          .accounts({
            signer: wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();
        console.log("Signature: ", sig);
    } catch (error) {
      console.log("Error: ", error.message);
    }
  });

}); 