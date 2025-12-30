
export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  type: 'OUTGOING' | 'INCOMING' | 'ERROR';
  message: string;
  details?: any;
}

type LogListener = (log: TelemetryLog) => void;
const listeners: LogListener[] = [];

// Broadcast log to listeners
const logTelemetry = (type: 'OUTGOING' | 'INCOMING' | 'ERROR', message: string, details?: any) => {
  const log: TelemetryLog = {
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    type,
    message,
    details
  };
  listeners.forEach(l => l(log));
};

export const subscribeToLogs = (listener: LogListener) => {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
};

// Using a CORS proxy is necessary for browser-based API calls to Datadog 
// because standard Datadog API endpoints do not support Cross-Origin Resource Sharing (CORS) from browsers.
// valid for hackathon/demo purposes.
const PROXY_URL = 'https://corsproxy.io/?';

const getHeaders = (config: DatadogConfig) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'DD-API-KEY': config.apiKey,
    'DD-APPLICATION-KEY': config.appKey,
  };
};

export const getStoredConfig = (): DatadogConfig | null => {
  const apiKey = localStorage.getItem('vanguard_dd_api_key');
  const appKey = localStorage.getItem('vanguard_dd_app_key');
  const site = localStorage.getItem('vanguard_dd_site') || 'datadoghq.eu';

  if (apiKey && appKey) {
    return { apiKey, appKey, site };
  }
  return null;
};

export const saveConfig = (config: DatadogConfig) => {
  localStorage.setItem('vanguard_dd_api_key', config.apiKey);
  localStorage.setItem('vanguard_dd_app_key', config.appKey);
  localStorage.setItem('vanguard_dd_site', config.site);
};

export const sendMetric = async (metricName: string, value: number, tags: string[] = []) => {
  const config = getStoredConfig();
  if (!config) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const body = {
    series: [
      {
        metric: metricName,
        points: [[timestamp, value]],
        type: 'gauge',
        tags: ['app:vanguard', 'env:production', ...tags]
      }
    ]
  };

  logTelemetry('OUTGOING', `Sending Metric: ${metricName}`, { value, tags });

  try {
    const targetUrl = `https://api.${config.site}/api/v1/series`;
    const response = await fetch(`${PROXY_URL}${targetUrl}`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
        logTelemetry('INCOMING', `Metric Accepted (${response.status})`);
    } else {
        logTelemetry('ERROR', `Metric Failed (${response.status})`, response.statusText);
    }
  } catch (e: any) {
    logTelemetry('ERROR', 'Metric Network Error', e.message);
    console.error('Datadog Metric Error', e);
  }
};

export const sendEvent = async (title: string, text: string, alertType: 'info' | 'warning' | 'error' | 'success' = 'info') => {
  const config = getStoredConfig();
  if (!config) return;

  const body = {
    title: title,
    text: text,
    alert_type: alertType,
    tags: ['app:vanguard', 'source:browser']
  };

  logTelemetry('OUTGOING', `Sending Event: ${title}`, { alertType });

  try {
    const targetUrl = `https://api.${config.site}/api/v1/events`;
    const response = await fetch(`${PROXY_URL}${targetUrl}`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
        logTelemetry('INCOMING', `Event Created (${response.status})`);
    } else {
        logTelemetry('ERROR', `Event Failed (${response.status})`, response.statusText);
    }
  } catch (e: any) {
    logTelemetry('ERROR', 'Event Network Error', e.message);
    console.error('Datadog Event Error', e);
  }
};

export const testConnection = async (config: DatadogConfig): Promise<boolean> => {
  logTelemetry('OUTGOING', 'Testing API Connection...');
  try {
    const targetUrl = `https://api.${config.site}/api/v1/validate`;
    const response = await fetch(`${PROXY_URL}${targetUrl}`, {
      method: 'GET',
      headers: { 'DD-API-KEY': config.apiKey }
    });
    
    if (response.ok) {
        logTelemetry('INCOMING', 'Connection Validated (200 OK)');
        return true;
    } else {
        logTelemetry('ERROR', `Validation Failed (${response.status})`);
        return false;
    }
  } catch (e: any) {
    logTelemetry('ERROR', 'Connection Test Error', e.message);
    console.error("Connection Test Error:", e);
    return false;
  }
};
