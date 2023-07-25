import { MARKETPLACE_BASE_URL, BUSINESS_BASE_URL } from '@constants';

// ----------------------------------------------------------------------

const PATHS = {
  marketplace: {
    home: MARKETPLACE_BASE_URL,

    // info
    auth: {
      login: `${MARKETPLACE_BASE_URL}/auth/login`,
      signup: `${MARKETPLACE_BASE_URL}/auth/signup`,
      forgotPassword: `${MARKETPLACE_BASE_URL}/auth/forgot-password`,
      verifyEmail: `${MARKETPLACE_BASE_URL}/auth/verify-email`,
      verifyPhone: `${MARKETPLACE_BASE_URL}/auth/verify-phone`,
      verifyForgotPassword: `${MARKETPLACE_BASE_URL}/auth/verify-forgot-password`,
      resetPassword: `${MARKETPLACE_BASE_URL}/auth/reset-password`,
      logout: `${MARKETPLACE_BASE_URL}/auth/logout`,
    },
  },

  business: {
    home: BUSINESS_BASE_URL,

    auth: {
      login: `${BUSINESS_BASE_URL}/auth/login`,
      signup: `${BUSINESS_BASE_URL}/auth/signup`,
      forgotPassword: `${BUSINESS_BASE_URL}/auth/forgot-password`,
      verifyEmail: `${BUSINESS_BASE_URL}/auth/verify-email`,
      verifyPhone: `${BUSINESS_BASE_URL}/auth/verify-phone`,
      verifyForgotPassword: `${BUSINESS_BASE_URL}/auth/verify-forgot-password`,
      resetPassword: `${BUSINESS_BASE_URL}/auth/reset-password`,
      logout: `${BUSINESS_BASE_URL}/auth/logout`,
    },

    orders: {
      list: `${BUSINESS_BASE_URL}/orders`,
      view: (id: string) => `${BUSINESS_BASE_URL}/orders/${id}`,
    },
  },
};

export default PATHS;
