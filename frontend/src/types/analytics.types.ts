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

export interface ConversionFunnelDto {
  totalViews: number;
  totalChats: number;
  totalDeposits: number;
  successfulDeals: number;
}

export interface MonthlyRevenueDto {
  year: number;
  month: number;
  revenue: number;
  depositCount: number;
}

export interface AdminFinancialSummaryDto {
  totalRevenue: number;
  totalTransactions: number;
  activeLandlords: number;
  platformFee: number;
}

export interface TopLandlordDto {
  landlordId: number;
  displayName: string;
  revenue: number;
  dealCount: number;
}
