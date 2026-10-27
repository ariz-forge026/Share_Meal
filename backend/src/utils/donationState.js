import AppError from './AppError.js';

const transitions = {
  available: ['requested', 'cancelled', 'expired'],
  requested: ['available', 'accepted', 'cancelled', 'expired'],
  accepted: ['pickup_scheduled', 'expired'],
  pickup_scheduled: ['collected', 'expired'],
  collected: ['completed'],
  distributed: ['completed'],
  completed: [],
  cancelled: [],
  expired: [],
};

export function canTransitionDonation(from, to) {
  return transitions[from]?.includes(to) ?? false;
}

export function assertDonationTransition(from, to) {
  if (!canTransitionDonation(from, to)) {
    throw new AppError(409, `Donation cannot move from ${from} to ${to}.`);
  }
}
