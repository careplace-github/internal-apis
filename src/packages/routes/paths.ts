import { MARKETPLACE_BASE_URL, BUSINESS_BASE_URL } from '@constants';

// ----------------------------------------------------------------------

const PATHS = {
  marketplace: {
    home: MARKETPLACE_BASE_URL,

    termsAndConditions: `${MARKETPLACE_BASE_URL}/terms-and-conditions`,
    privacyPolicy: `${MARKETPLACE_BASE_URL}/privacy-policy`,

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

    orders: {
      list: `${MARKETPLACE_BASE_URL}/orders`,
      view: (id: string) => `${MARKETPLACE_BASE_URL}/orders/${id}`,
      checkout: (id: string) => `${MARKETPLACE_BASE_URL}/orders/${id}/checkout`,
    },
  },

  business: {
    home: BUSINESS_BASE_URL,

    termsAndConditions: `${BUSINESS_BASE_URL}/terms-and-conditions`,
    privacyPolicy: `${BUSINESS_BASE_URL}/privacy-policy`,

    auth: {
      login: `${BUSINESS_BASE_URL}/app/auth/login`,
      signup: `${BUSINESS_BASE_URL}/app/auth/signup`,
      forgotPassword: `${BUSINESS_BASE_URL}/app/auth/forgot-password`,
      verifyEmail: `${BUSINESS_BASE_URL}/app/auth/verify-email`,
      verifyPhone: `${BUSINESS_BASE_URL}/app/auth/verify-phone`,
      verifyForgotPassword: `${BUSINESS_BASE_URL}/app/auth/verify-forgot-password`,
      resetPassword: `${BUSINESS_BASE_URL}/app/auth/reset-password`,
      logout: `${BUSINESS_BASE_URL}/app/auth/logout`,
    },

    orders: {
      list: `${BUSINESS_BASE_URL}/app/orders`,
      view: (id: string) => `${BUSINESS_BASE_URL}/app/orders/${id}/view`,
      edit: (id: string) => `${BUSINESS_BASE_URL}/app/orders/${id}/edit`,
    },
  },
};

export default PATHS;
