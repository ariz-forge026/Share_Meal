import Notification from '../models/Notification.js';

export async function notify(recipient, { type, message, resourceType, resourceId }) {
  if (!recipient) return;
  await Notification.create({ recipient, type, message, resourceType, resourceId });
}
