
import { sendMetric, sendEvent } from './datadogService';

// --- API ENDPOINTS ---
const FLOOD_API = "https://environment.data.gov.uk/flood-monitoring/id/floods";
// Open-Meteo: Latitude/Longitude defaulting to London (Hackathon Context) if geo fails
const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast"; 
const QUAKE_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";

export interface EnvironmentalData {
  floodWarnings: number; // Count of severe warnings
  solarRadiation: number; // Watts/m2
  cloudCover: number; // %
  maxSeismicMag: number; // Magnitude
}

export const fetchEnvironmentalData = async (lat: number = 51.5074, lng: number = -0.1278): Promise<EnvironmentalData> => {
  const data: EnvironmentalData = {
    floodWarnings: 0,
    solarRadiation: 0,
    cloudCover: 0,
    maxSeismicMag: 0
  };

  // 1. Fetch Flood Data (UK Gov)
  try {
    const floodRes = await fetch(FLOOD_API);
    if (floodRes.ok) {
        const floodJson = await floodRes.json();
        // Count severity level 1 & 2 (Severe & Warning)
        const warnings = floodJson.items || [];
        // The API returns distinct objects. We just count total active flood alerts/warnings for the metric.
        data.floodWarnings = warnings.length;
        
        sendMetric('vanguard.flood_risk_level', data.floodWarnings);
        if (data.floodWarnings > 50) {
            sendEvent('FLOOD ALERT', `High number of flood warnings detected: ${data.floodWarnings}`, 'warning');
        }
    }
  } catch (e) {
    console.error("Flood API Error", e);
  }

  // 2. Fetch Weather/Solar (Open-Meteo)
  try {
    const weatherUrl = `${WEATHER_API_BASE}?latitude=${lat}&longitude=${lng}&current=cloud_cover,shortwave_radiation`;
    const weatherRes = await fetch(weatherUrl);
    if (weatherRes.ok) {
        const weatherJson = await weatherRes.json();
        data.cloudCover = weatherJson.current.cloud_cover || 0;
        data.solarRadiation = weatherJson.current.shortwave_radiation || 0;

        sendMetric('vanguard.solar_radiation', data.solarRadiation);
        sendMetric('vanguard.cloud_cover', data.cloudCover);
    }
  } catch (e) {
    console.error("Weather API Error", e);
  }

  // 3. Fetch Seismic Data (USGS)
  try {
    const quakeRes = await fetch(QUAKE_API);
    if (quakeRes.ok) {
        const quakeJson = await quakeRes.json();
        const features = quakeJson.features || [];
        let maxMag = 0;
        
        features.forEach((f: any) => {
            const mag = f.properties?.mag || 0;
            if (mag > maxMag) maxMag = mag;
        });
        
        data.maxSeismicMag = maxMag;
        sendMetric('vanguard.seismic_activity', maxMag);

        if (maxMag > 5.0) {
            sendEvent('SEISMIC ALERT', `Significant seismic activity detected: MAG ${maxMag}`, 'error');
        }
    }
  } catch (e) {
    console.error("Seismic API Error", e);
  }

  return data;
};
