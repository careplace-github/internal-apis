// App Interfaces
export type { ICaregiver, ICaregiverDocument } from './app/caregiver.interface';
export type { IHealthUnit, IHealthUnitDocument } from './app/health-unit.interface';
export { ICollaborator, ICollaboratorDocument } from './app/collaborator.interface';
export type { IEvent, IEventDocument } from './app/event.interface';
export type { IEventSeries, IEventSeriesDocument } from './app/event-series.interface';
export type { ICustomer, ICustomerDocument } from './app/customer.interface';
export type { IOrder, IOrderDocument } from './app/order.interface';
export type { IPatient, IPatientDocument } from './app/patient.interface';
export type {
  IHealthUnitReview,
  IHealthUnitReviewDocument,
} from './app/health-unit-review.interface';
export type { IService, IServiceDocument } from './app/service.interface';
export type { ILead, ILeadDocument } from './app/leads.interface';
export type { IAd, IAdDocument } from './app/ad.interface';

// Misc Interfaces
export type { IAddress } from './misc/address.interface';
export type { IBillingAddress } from './misc/billing-address.interface';
export type { IDeletedDocument, IDeletedDocumentDocument } from './misc/deleted-document.interface';
export type { IFile, IFileDocument } from './misc/file.interface';
export type { ISettings } from './misc/settings.interface';

// Server Interfaces
export type { IAPIResponse } from './server/api-response.interface';
export { IPopulateOption, IQueryListResponse } from './server/db.interface';

// Type Aliases
export * from './types';
