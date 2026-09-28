import type { WeatherPort, DailyWeather } from "@/ports/weather";
import { WeatherUnavailable } from "@/ports/weather";

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const DAILY_FIELDS = "temperature_2m_max,temperature_2m_min,precipitation_sum";

function parseDaily(j: { daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[] } }): DailyWeather | null {
  const d = j.daily;
  const tempMaxC = d?.temperature_2m_max?.[0];
  const tempMinC = d?.temperature_2m_min?.[0];
  const precipitationMm = d?.precipitation_sum?.[0];
  if (tempMaxC == null || tempMinC == null || precipitationMm == null) return null;
  return { tempMaxC, tempMinC, precipitationMm };
}

/**
 * Open-Meteo is free and keyless. The archive endpoint covers 1940 onward but lags a few days
 * behind real time; the forecast endpoint's `past_days`/date range fills that recent gap. Every
 * submission's claimed date+GPS gets checked against one of the two, whichever has the data.
 */
export function openMeteoWeather(): WeatherPort {
  return {
    async historical({ lat, lon, date }) {
      for (const url of [ARCHIVE_URL, FORECAST_URL]) {
        let res: Response;
        try {
          res = await fetch(
            `${url}?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=${DAILY_FIELDS}&timezone=auto`,
            { signal: AbortSignal.timeout(8_000) }
          );
        } catch (e) {
          throw new WeatherUnavailable(`Open-Meteo unreachable: ${(e as Error).message}`);
        }
        if (!res.ok) continue; // archive rejects too-recent dates; try the forecast endpoint next
        const parsed = parseDaily(await res.json());
        if (parsed) return parsed;
      }
      return null;
    },
  };
}
