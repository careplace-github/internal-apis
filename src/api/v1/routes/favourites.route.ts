// Import the express module
import Router from 'express';
import express from 'express';
import { AuthenticationGuard, ClientGuard } from 'src/packages/middlewares';
import FavouritesController from '../controllers/favourites.controller';

const router = express.Router();

router
  .route('/favourites')
  .post(AuthenticationGuard, ClientGuard('business'), FavouritesController.createFavourite)
  .get(AuthenticationGuard, ClientGuard('business'), FavouritesController.listFavourites);
router
  .route('/favourites/:id')
  .get(AuthenticationGuard, ClientGuard('business'), FavouritesController.retrieveFavourite)
  .put(AuthenticationGuard, ClientGuard('business'), FavouritesController.updateFavourite)
  .delete(
    AuthenticationGuard,
    FavouritesController.deleteFavourite
  );

export default router;
