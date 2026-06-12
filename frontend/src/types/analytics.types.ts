export interface DailyViewCount {
  date: string;
  views: number;
}

export interface LandlordAnalyticsResponse {
  totalViews: number;
  totalMessages: number;
  totalDeposits: number;
  viewsOverTime: DailyViewCount[];
}
