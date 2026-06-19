import { asyncHandler } from "../utils/asyncHandler.js";
import { notificationService } from "../services/notificationService.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === "true";
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  const notifications = await notificationService.getForUser(req.user.id, {
    unreadOnly,
    limit,
  });

  res.json(notifications);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id);
  res.json({ message: "Notification marked as read" });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ message: "Notifications marked as read" });
});
