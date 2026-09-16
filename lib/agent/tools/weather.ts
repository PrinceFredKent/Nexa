import { tool, jsonSchema } from 'ai';

interface WeatherParams {
  location?: string;
  latitude?: number;
  longitude?: number;
}

export const weatherTool = tool({
  description:
    'Get current live weather conditions and short-term forecast for any location or city. If location is omitted, uses the user current location.',
  parameters: jsonSchema<WeatherParams>({
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City, location, or country name (e.g. "Kampala", "London", "Tokyo").',
      },
      latitude: {
        type: 'number',
        description: 'Latitude coordinates if available',
      },
      longitude: {
        type: 'number',
        description: 'Longitude coordinates if available',
      },
    },
    required: [],
    additionalProperties: false,
  }),
  execute: async ({ location = 'Kampala, Uganda', latitude, longitude }) => {
    try {
      let lat = latitude;
      let lon = longitude;
      let resolvedName = location;

      // Geocode if coordinates not provided
      if (lat === undefined || lon === undefined) {
        const geoQuery = encodeURIComponent(location.split(',')[0].trim());
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${geoQuery}&count=1&language=en&format=json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!geoRes.ok) {
          return { error: `Could not geocode location "${location}".` };
        }
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          return { error: `Location "${location}" not found.` };
        }
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        resolvedName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!weatherRes.ok) {
        return { error: 'Failed to retrieve weather data from provider.' };
      }

      const data = await weatherRes.json();
      const current = data.current;
      const daily = data.daily;

      // Weather code descriptions
      const weatherCodes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
      };

      const weatherDesc = weatherCodes[current.weather_code] || 'Variable conditions';

      return {
        location: resolvedName,
        coordinates: { latitude: lat, longitude: lon },
        timezone: data.timezone,
        current: {
          temperature: `${current.temperature_2m}°C`,
          apparentTemperature: `${current.apparent_temperature}°C`,
          condition: weatherDesc,
          humidity: `${current.relative_humidity_2m}%`,
          windSpeed: `${current.wind_speed_10m} km/h`,
          precipitation: `${current.precipitation} mm`,
        },
        forecast: daily?.time?.slice(0, 3).map((date: string, i: number) => ({
          date,
          maxTemp: `${daily.temperature_2m_max[i]}°C`,
          minTemp: `${daily.temperature_2m_min[i]}°C`,
          condition: weatherCodes[daily.weather_code[i]] || 'Clear/Clouds',
          rainProbability: `${daily.precipitation_probability_max[i]}%`,
        })),
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Weather lookup failed',
      };
    }
  },
});
