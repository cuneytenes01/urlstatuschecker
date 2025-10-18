export interface MonitoredUrl {
  id: string;
  url: string;
  name: string;
  lastStatusCode: number;
  lastCheckedAt: Date | null;
  isActive: boolean;
  responseTimeMs?: number;
}

export interface StatusCheck {
  id: string;
  urlId: string;
  statusCode: number;
  responseTimeMs: number;
  checkedAt: Date;
  errorMessage?: string;
}

export interface Alert {
  id: string;
  urlId: string;
  url: string;
  name: string;
  statusCode: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  screenshotUrl?: string;
  screenshotData?: string;
}
