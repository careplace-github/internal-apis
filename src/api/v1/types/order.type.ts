export type OrderRecurrency = 0 | 1 | 2 | 4;

export type OrderStatus =
  | 'new'
  | 'declined'
  | 'cancelled'
  | 'accepted'
  | 'pending_payment'
  | 'active'
  | 'completed';

export type OrderScreeningVisitStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

import { OrderModel } from '../models';
export type OrderModelType = typeof OrderModel;
