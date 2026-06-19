import { adminAnalyticsService } from "../services/adminAnalyticsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminAnalyticsService.getDashboard(req.query.range);
  res.json(analytics);
});
