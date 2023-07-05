import { CompanyReviewSchema } from '../models';
import { createModelValidator } from './model.validator';

const reviewValidator = createModelValidator(CompanyReviewSchema);

// Use the generated validation middleware functions
export const AddReviewValidator = reviewValidator;
export const UpdateReviewValidator = reviewValidator;
