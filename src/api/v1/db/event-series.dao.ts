import DAO from '../../common/db/DAO';
import { EventSeriesModel } from '../models';
import { IEventSeriesDocument } from '../interfaces';
import { MONGODB_COLLECTION_EVENT_SERIES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Event Series` collection.
 */
export default class EventsSeriesDAO extends DAO<IEventSeriesDocument> {
  constructor() {
    super(EventSeriesModel, MONGODB_COLLECTION_EVENT_SERIES_NS);
  }
}
