import DAO from '../../common/db/DAO';
import { EventModel } from '../models';
import { IEventDocument } from '../interfaces';

import { MONGODB_COLLECTION_EVENTS_NS } from '../../../config/constants/index';
import mongoose from 'mongoose';

/**
 * Class to manage the `Events` collection.
 */ export default class EventsDAO extends DAO<IEventDocument> {
  constructor() {
    super(EventModel, MONGODB_COLLECTION_EVENTS_NS);
  }
}
