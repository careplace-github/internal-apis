import DAO from './DAO';
import { EventSeriesModel } from '../models';
import { IEventSeriesModel } from '../interfaces';
import { MONGODB_COLLECTION_EVENTS_SERIES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Event Series` collection.
 */
export default class EventsSeriesDAO extends DAO<IEventSeriesModel> {
  constructor() {
    super(EventSeriesModel, MONGODB_COLLECTION_EVENTS_SERIES_NS);
  }
}
