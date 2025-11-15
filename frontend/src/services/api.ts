const API_BASE_URL = '/api';

export interface DailyStat {
  day_utc: string;
  total_events: number;
}

export interface TopLabel {
  label: string;
  total_events: number;
}

export interface Event {
  id: number;
  device_id: string;
  ts: string;
  label: string;
  confidence: number;
  duration_ms: number | null;
  created_at: string;
}

export interface EventDetail extends Event {
  alt_labels: string[];
  sample_rate: number | null;
  rms_energy: number | null;
  peak_amplitude: number | null;
  clipping: boolean | null;
  snr_db: number | null;
  mfcc_summary: any;
  device_meta: any;
  proc_stats: any;
  raw_payload: any;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

export interface Device {
  device_id: string;
  name: string;
  timezone: string;
  created_at: string;
}

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDailyStats(deviceId?: string, days: number = 7): Promise<DailyStat[]> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    params.append('days', days.toString());
    return this.fetch<DailyStat[]>(`/stats/daily?${params.toString()}`);
  }

  async getTopLabels(deviceId?: string, days: number = 7, limit: number = 5): Promise<TopLabel[]> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    params.append('days', days.toString());
    params.append('limit', limit.toString());
    return this.fetch<TopLabel[]>(`/stats/top-labels?${params.toString()}`);
  }

  async getEvents(
    deviceId?: string,
    label?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<EventsResponse> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    if (label) params.append('label', label);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    return this.fetch<EventsResponse>(`/events?${params.toString()}`);
  }

  async getEventById(id: number): Promise<EventDetail> {
    return this.fetch<EventDetail>(`/events/${id}`);
  }

  async getDevices(): Promise<Device[]> {
    return this.fetch<Device[]>('/devices');
  }
}

export const apiService = new ApiService();

