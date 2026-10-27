import AuditLog from '../models/AuditLog.js';

export async function writeAudit(request, { action, resourceType, resourceId, details = {} }) {
  await AuditLog.create({
    actor: request.user?._id || null,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: request.ip || '',
  });
}
