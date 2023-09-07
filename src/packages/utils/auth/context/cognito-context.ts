import { HTTPError, LayerError } from '@utils';
import {
  AWS_COGNITO_ISSUER,
  AWS_COGNITO_PUBLIC_KEY,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
  AWS_COGNITO_BUSINESS_USER_POOL_ID,
  AWS_COGNITO_ADMIN_USER_POOL_ID,
  AWS_COGNITO_ADMIN_CLIENT_ID,
} from '@constants';
import logger from '@logger';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoJwtPayload } from 'aws-jwt-verify/jwt-model';
import { CognitoVerifyProperties } from 'aws-jwt-verify/cognito-verifier';

/**
 * Class with utility functions for JWT authentication context.
 *
 * @see "https://www.npmjs.com/package/jwt-decode"
 */
export default class CognitoContext {
  /**
   *
   * @see https://repost.aws/knowledge-center/decode-verify-cognito-json-token
   */
  static async verifyToken(token: string): Promise<CognitoJwtPayload> {
    logger.info(`Authentication Utils VERIFY_TOKEN Request: \n ${token}`);

    const businessVerifier = CognitoJwtVerifier.create({
      userPoolId: AWS_COGNITO_BUSINESS_USER_POOL_ID,
      clientId: AWS_COGNITO_BUSINESS_CLIENT_ID,
    });

    const marketplaceVerifier = CognitoJwtVerifier.create({
      userPoolId: AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
      clientId: AWS_COGNITO_MARKETPLACE_CLIENT_ID,
    });

    const adminVerifier = CognitoJwtVerifier.create({
      userPoolId: AWS_COGNITO_ADMIN_USER_POOL_ID,
      clientId: AWS_COGNITO_ADMIN_CLIENT_ID,
    });

    const props: CognitoVerifyProperties = {
      clientId: [
        AWS_COGNITO_BUSINESS_CLIENT_ID,
        AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        AWS_COGNITO_ADMIN_CLIENT_ID,
      ],
      tokenUse: 'access',
    };

    let businessDecodedToken: CognitoJwtPayload | undefined;
    let marketplaceDecodedToken: CognitoJwtPayload | undefined;
    let adminDecodedToken: CognitoJwtPayload | undefined;
    try {
      businessDecodedToken = await businessVerifier.verify(token, props);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        // Handle expired token error
        throw new HTTPError._401('Unauthorized: Token has expired');
      }
    }

    try {
      marketplaceDecodedToken = await marketplaceVerifier.verify(token, props);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        // Handle expired token error
        throw new HTTPError._401('Unauthorized: Token has expired');
      }
    }

    try {
      adminDecodedToken = await adminVerifier.verify(token, props);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        // Handle expired token error
        throw new HTTPError._401('Unauthorized: Token has expired');
      }
    }

    const decodedToken = businessDecodedToken || marketplaceDecodedToken || adminDecodedToken;

    if (!decodedToken) {
      throw new HTTPError._401('Unauthorized: Invalid token');
    }

    logger.info(
      `Authentication Utils VERIFY_TOKEN return: \n ${JSON.stringify(decodedToken, null, 2)}`
    );

    return decodedToken;
  }
}
