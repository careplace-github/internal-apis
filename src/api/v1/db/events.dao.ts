import DAO from './DAO';
import { EventModel } from '../models';
import { IEventModel } from '../interfaces';

import { MONGODB_COLLECTION_EVENTS_NS } from '../../../config/constants/index';
import mongoose from 'mongoose';

/**
 * Class to manage the `Events` collection.
 */ export default class EventsDAO extends DAO<IEventModel> {
  constructor() {
    super(EventModel, MONGODB_COLLECTION_EVENTS_NS);
  }
}
