import mongoose from 'mongoose';
import DAO from './DAO';
import { EventModel } from '../models';
import { IEventDocument } from '../interfaces';

import { MONGODB_COLLECTION_EVENTS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Events` collection.
 */ export default class EventsDAO extends DAO<IEventDocument> {
  constructor() {
    super(EventModel, MONGODB_COLLECTION_EVENTS_NS);
  }
}
