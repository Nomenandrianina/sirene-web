import { post } from './base';

export interface FinalWeatherEntry {
  type:     "GUST" | "WINDIRNAME" | "WINDSPD" | "WVHGT" | "COLOR" | "ALERT";
  date:     string;
  day_part: "AM" | "PM";
  result:   any;
}

export interface WeatherResponse {
  final_weather: FinalWeatherEntry[];
  arome:         Record<string, any>;
}

export const weatherApi = {
  // POST /weathers/:villageId  — fetch ou cache du jour
  fetchByVillage: (villageId: number) =>
    post<WeatherResponse[]>(`/weathers/${villageId}`, {}),
};