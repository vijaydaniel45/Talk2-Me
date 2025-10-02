import fetch from "node-fetch";

export default async function handler({ input }) {
  const city = input.city || "New York"; // default city

  if (!process.env.OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY is not set in .env");
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) {
    return `Could not fetch weather for ${city}.`;
  }

  const data = await res.json();
  const temp = data.main.temp;
  const desc = data.weather[0].description;

  return `The current weather in ${city} is ${temp}°C with ${desc}.`;
}

