import ContactMessage from '../models/ContactMessage.js';

export async function createContactMessage(request, response) {
  const message = await ContactMessage.create({
    name: request.body.name,
    email: request.body.email,
    message: request.body.message,
  });
  response.status(201).json({ success: true, message: 'Your message has been received.' });
}

export async function listContactMessages(request, response) {
  const page = Number(request.query.page || 1);
  const limit = Number(request.query.limit || 20);
  const filter = request.query.status ? { status: request.query.status } : {};
  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  response.json({ success: true, messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
