export interface DailyWeather { tempMaxC: number; tempMinC: number; precipitationMm: number }

export class WeatherUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "WeatherUnavailable"; }
}

export interface WeatherPort {
  /** Historical (or forecast, for future-dated) daily weather at a point. Returns null if the provider has no data for that date. */
  historical(input: { lat: number; lon: number; date: string }): Promise<DailyWeather | null>;
}
