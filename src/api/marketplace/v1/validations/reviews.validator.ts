import { HealthUnitReviewSchema } from '../../../../packages/models';
import { createModelValidator } from './model.validator';

const reviewValidator = createModelValidator(HealthUnitReviewSchema);

// Use the generated validation middleware functions
export const AddReviewValidator = reviewValidator;
export const UpdateReviewValidator = reviewValidator;
