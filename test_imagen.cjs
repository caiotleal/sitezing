const fs = require('fs');
const keyLine = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.includes('GEMINI_KEY'));
const key = keyLine ? keyLine.split('=')[1].trim() : '';
async function test() {
  const refinedPrompt = "A cat";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;
  console.log("Fetching:", url);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: refinedPrompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      })
    });
    console.log("Status:", response.status);
    console.log("Ok:", response.ok);
    const text = await response.text();
    console.log("Body:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}
test();
