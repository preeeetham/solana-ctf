import * as fs from "fs";
import * as path from "path";
import bs58 from "bs58";

const nacl = require("tweetnacl");

const publicKeyBase58 = "BzUry6FjNZ8YCsxWbJoLtkrFSLKGAr3iaoa1xiEj7ASd";
const publicKeyBytes = bs58.decode(publicKeyBase58);

async function main() {
  const filePath = path.join(__dirname, "sigdump.txt");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  console.log(`Searching through ${lines.length} signatures...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split("::");
    if (parts.length !== 2) continue;
    const [left, right] = parts;
    if (!left || !right) continue;

    try {
      const signature = bs58.decode(left);
      const message = Buffer.from(right, "base64");

      const isValid = nacl.sign.detached.verify(message, signature, publicKeyBytes);
      if (isValid) {
        console.log(`\n[SUCCESS] Found valid signature at line ${i + 1}!`);
        console.log("Signature (base58):", left);
        console.log("Message (base64):", right);
        console.log("Message (UTF-8):", message.toString("utf-8"));
        console.log("Message (Hex):", message.toString("hex"));
      }
    } catch (err: any) {
      // Ignore errors
    }
  }
}

main().catch(err => console.error(err));
