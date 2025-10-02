import fetch from "node-fetch";

async function test() {
  const command = "ls"; // this would normally come from LLM
  try {
    const res = await fetch(`http://localhost:8000/execute?command=${encodeURIComponent(command)}`);
    const data = await res.json();
    console.log("Response from FastAPI:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

