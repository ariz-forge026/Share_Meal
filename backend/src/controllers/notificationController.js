import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import { parsePagination } from '../utils/location.js';

export async function listNotifications(request, response) {
  const { page, limit, skip } = parsePagination(request.query);
  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ recipient: request.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ recipient: request.user._id, readAt: null }),
    Notification.countDocuments({ recipient: request.user._id }),
  ]);
  response.json({ success: true, notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function markNotificationRead(request, response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: request.params.id, recipient: request.user._id },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!notification) throw new AppError(404, 'Notification was not found.');
  response.json({ success: true, notification });
}

export async function markAllNotificationsRead(request, response) {
  await Notification.updateMany({ recipient: request.user._id, readAt: null }, { $set: { readAt: new Date() } });
  response.json({ success: true });
}
