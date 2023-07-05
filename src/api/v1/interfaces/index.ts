/**
 * App Interfaces
 */
export type { ICaregiver, ICaregiverModel } from './app/caregiver.interface';
export type { IHealthUnit, IHealthUnitModel } from './app/health-unit.interface';
export type { ICollaborator, ICollaboratorModel } from './app/collaborator.interface';
export type { IEvent, IEventModel } from './app/event.interface';
export type { IEventSeries, IEventSeriesModel } from './app/event-series.interface';
export type { ICustomer, ICustomerModel } from './app/customer.interface';
export type { IHomeCareOrder, IHomeCareOrderModel } from './app/home-care-order.interface';
export type { IPatient, IPatientModel } from './app/patient.interface';
export type { IHealthUnitReview, IHealthUnitReviewModel } from './app/health-unit-review.interface';
export type { IService, IServiceModel } from './app/service.interface';

/**
 * Auth Interfaces
 */
export type { ICognitoUser } from './auth/cognito.interface';

/**
 * Misc Interfaces
 */
export type { IAddress } from './misc/address.interface';
export type { IDeletedDocument, IDeletedDocumentModel } from './misc/deleted-document.interface';
export type { IFile, IFileModel } from './misc/file.interface';
export type { ISettings } from './misc/settings.interface';
/**
 * Server Interfaces
 */
export type { IAPIResponse } from './server/api-response.interface';
export { IPopulateOption, IQueryListResponse } from './server/db.interface';
