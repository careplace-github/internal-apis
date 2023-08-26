/**
 * 0 - One time
 * 1 - Weekly
 * 2 - Biweekly
 * 4 - Monthly
 */
type THomeCareOrderRecurrency = 0 | 1 | 2 | 4;

type THomeCareOrderStatus =
  | 'new'
  | 'declined'
  | 'cancelled'
  | 'accepted'
  | 'pending_payment'
  | 'active'
  | 'completed';

type THomeCareOrderScreeningVisitStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export { THomeCareOrderRecurrency, THomeCareOrderStatus, THomeCareOrderScreeningVisitStatus };
