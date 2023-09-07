import axios from 'axios';
import btoa from 'btoa-lite';

type AuthType = 'BASIC' | 'BEARER' | 'PARAMETER';

const createAxiosInstance = (baseURL: string, apiKey: string, authType: AuthType) => {
  // Create an Axios instance
  const instance = axios.create({
    baseURL,
  });

  // Set authentication headers based on authType
  switch (authType) {
    case 'BASIC':
      instance.defaults.headers.common.Authorization = `Basic ${btoa(apiKey)}`;
      break;
    case 'BEARER':
      instance.defaults.headers.common.Authorization = `Bearer ${apiKey}`;
      break;
    case 'PARAMETER':
      instance.defaults.params = {
        api_key: apiKey,
      };
      break;
    default:
      throw new Error('Invalid authentication type');
  }

  return instance;
};

export default createAxiosInstance;
