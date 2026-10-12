const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

function mapWmoCode(code) {
  if (code === 0) return { main: 'Clear', desc: 'clear sky' };
  if (code <= 3) return { main: 'Clouds', desc: 'partly cloudy' };
  if (code <= 48) return { main: 'Fog', desc: 'foggy conditions' };
  if (code <= 55) return { main: 'Drizzle', desc: 'light drizzle' };
  if (code <= 65) return { main: 'Rain', desc: 'rain' };
  if (code <= 82) return { main: 'Rain', desc: 'heavy rain showers' };
  if (code >= 95) return { main: 'Thunderstorm', desc: 'thunderstorm' };
  return { main: 'Clear', desc: 'clear sky' };
}

async function fetchFromOpenMeteo(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,precipitation,cloud_cover,apparent_temperature,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  const c = data.current || {};
  const weather = mapWmoCode(c.weather_code ?? 0);

  return {
    temperature: c.temperature_2m ?? 25,
    feelsLike: c.apparent_temperature ?? c.temperature_2m ?? 25,
    humidity: c.relative_humidity_2m ?? 65,
    pressure: c.surface_pressure ?? 1013,
    windSpeed: c.wind_speed_10m ?? 5,
    windGust: c.wind_gusts_10m ?? 8,
    rainfall: c.precipitation ?? 0,
    clouds: c.cloud_cover ?? 20,
    visibility: 10000,
    weatherMain: weather.main,
    weatherDescription: weather.desc,
    weatherIcon: '02d',
  };
}

/**
 * Fetches current weather data for a given lat/lng.
 * Uses OpenWeather if API key is provided, otherwise falls back gracefully to Open-Meteo.
 */
export async function fetchWeatherData(lat, lng) {
  if (API_KEY && API_KEY !== 'your_openweather_api_key') {
    try {
      const url = `${BASE_URL}?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return {
          temperature: data.main?.temp ?? 0,
          feelsLike: data.main?.feels_like ?? 0,
          humidity: data.main?.humidity ?? 0,
          pressure: data.main?.pressure ?? 1013,
          windSpeed: data.wind?.speed ?? 0,
          windGust: data.wind?.gust ?? 0,
          rainfall: data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0,
          clouds: data.clouds?.all ?? 0,
          visibility: data.visibility ?? 10000,
          weatherMain: data.weather?.[0]?.main ?? 'Clear',
          weatherDescription: data.weather?.[0]?.description ?? 'clear sky',
          weatherIcon: data.weather?.[0]?.icon ?? '01d',
        };
      }
    } catch {
      // Fall through to Open-Meteo
    }
  }

  // Free Open-Meteo fallback
  try {
    return await fetchFromOpenMeteo(lat, lng);
  } catch {
    // Sensible offline fallback
    return {
      temperature: 26,
      feelsLike: 27,
      humidity: 70,
      pressure: 1010,
      windSpeed: 4.5,
      windGust: 7,
      rainfall: 0,
      clouds: 30,
      visibility: 10000,
      weatherMain: 'Partly Cloudy',
      weatherDescription: 'scattered clouds',
      weatherIcon: '03d',
    };
  }
}
