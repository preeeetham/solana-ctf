async function main() {
  const url = "https://solana-ctf.onrender.com/";
  
  // Format should be YYYY-MM-DD for input type="date"
  const dateStr = "2006-07-12";
  console.log(`Submitting POST request with date: ${dateStr}...`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      date: dateStr,
    }),
  });

  const html = await response.text();
  console.log("\nResponse HTML Status:", response.status);

  // Print any text that looks like a flag or messages in the HTML
  if (html.includes("ST_FLAG") || html.includes("flag")) {
    console.log("Flag found in response!");
    const regex = /ST_FLAG\{[^\}]+\}/;
    const match = html.match(regex);
    if (match) {
      console.log("Found Flag:", match[0]);
    } else {
      console.log("HTML response contains flag references but could not match regex. Full HTML output:");
      console.log(html);
    }
  } else {
    console.log("No flag found in HTML response. Outputting body snippet:");
    console.log(html);
  }
}

main().catch(err => console.error("Error:", err));
