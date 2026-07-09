import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import { idl } from "wrap_it_up.json";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";

describe("wrap_it_up_guys", () => {

    const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
    // get your wallet any way you want
    const user = anchor.getProvider().wallet;

    const provider = new AnchorProvider(connection, user, {});
    setProvider(provider);

    const program = new Program(idl);


    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // Derive the mint PDA first
    const [mintPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("flag_mint"), user.publicKey.toBuffer()],
        program.programId
    );

    // Then derive the metadata PDA using the mint PDA
    const [metadataPda] = web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mintPda.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );


    it("attempt", async () => {
        // attempt the ctf
    });
});
