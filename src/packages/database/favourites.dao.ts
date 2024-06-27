import DAO from './DAO';
import { FavouriteModel } from '../models';
import { IFavouriteDocument } from '../interfaces';

import { MONGODB_COLLECTION_FAVOURITES_NS } from '../../config/constants/index';

/**
 * Class to manage the `Favourites` collection.
 */
export default class FavouritesDAO extends DAO<IFavouriteDocument> {
  constructor() {
    super(FavouriteModel, MONGODB_COLLECTION_FAVOURITES_NS);
  }
}
