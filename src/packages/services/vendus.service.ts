// @axios
import axios from '@axios';
import fs from 'fs';
// @api
import { LayerError } from '@utils';

// @constants
import { VENDUS_SECRET_KEY } from '@constants';
// @logger
import logger from '@logger';

interface IFaturaReciboProps {
  type: 'FR';
  items: [
    {
      id: '148249597';
      qty: '1';
      gross_price: string;
    }
  ];
  payments: [
    {
      id: '148274311';
      amount: string;
    }
  ];

  discount_code?: string;
  discount_amount?: string;
  print_discount: 'yes';

  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    postalcode: string;
    city: string;
    country: string;
    fiscal_id?: string;
    send_email: 'no';
  };

  mode: 'tests';
}

/**
 * Class to manage the `Vendus` API.
 *
 * @documentation https://www.vendus.pt/ws/
 */

export default class VendusService {
  private static readonly baseURL: string = 'https://www.vendus.pt/ws/v1.1';

  /**
   * Creates an instance of Axios to make requests to the `Vendus` API.
   *
   * @see https://www.vendus.pt/ws/#section/Authentication
   * */
  static axios = axios(this.baseURL, 'a417f9aa707756bcaea3a71011553486', 'PARAMETER');

  static async createFaturaRecibo(
    gross_price: string,
    payment_amount: string,
    billing_details: {
      name: string;
      email: string;
      phone: string;
      address: string;
      postalcode: string;
      city: string;
      country: string;
      fiscal_id?: string;
    },
    discount_code?: string,
    discount_amount?: string
  ) {
    try {
      const payload: IFaturaReciboProps = {
        type: 'FR',
        items: [
          {
            id: '148249597',
            qty: '1',
            gross_price,
          },
        ],
        payments: [
          {
            id: '148274311',
            amount: payment_amount,
          },
        ],
        discount_code,
        discount_amount,
        print_discount: 'yes',
        client: {
          ...billing_details,
          send_email: 'no',
        },
        mode: 'tests',
      };

      logger.info(`VendusService.createFaturaRecibo params: ${JSON.stringify(payload, null, 2)}`);

      // TODO Remove tests mode
      const response = await this.axios.post('/documents?mode=tests', payload);

      logger.info(
        `VendusService.createFaturaRecibo return: ${JSON.stringify(response.data, null, 2)}`
      );
      return response.data;
    } catch (error: any) {
      switch (error) {
        default:
          throw new LayerError.INTERNAL_ERROR(error);
      }
    }
  }

  static async getDocument(id: string) {
    try {
      logger.info(`VendusService.getDocument params: ${id}`);

      // TODO Remove tests mode
      const response = await this.axios.get(`/documents/${id}?mode=tests`);

      logger.info(`VendusService.getDocument return: ${JSON.stringify(response.data, null, 2)}`);

      return response.data;
    } catch (error: any) {
      switch (error) {
        default:
          throw new LayerError.INTERNAL_ERROR(error);
      }
    }
  }

  static async downloadDocument(id: string): Promise<{
    filename: string;
    path: string;
  }> {
    try {
      logger.info(`VendusService.downloadDocument params: ${id}`);

      // TODO Remove tests mode
      const vendusDocument = await this.getDocument(id);

      const response = await this.axios.get(`/documents/${id}.pdf`, {
        responseType: 'arraybuffer',
      });

      logger.info(
        `VendusService.downloadDocument response.data: ${JSON.stringify(response.data, null, 2)}`
      );

      let documentName = `${vendusDocument.number}.pdf`;

      // Substitute whitespaces with underscores
      documentName = documentName.replace(/\s/g, '_');
      // Substitue / with _
      documentName = documentName.replace(/\//g, '_');

      // TODO Remove tests mode
      const documentPath = `src/downloads/${documentName}`;

      fs.writeFileSync(documentPath, response.data);

      const document = {
        filename: documentName,

        path: documentPath,
      };

      logger.info(`VendusService.downloadDocument return: ${JSON.stringify(document, null, 2)}`);

      return document;
    } catch (error: any) {
      switch (error) {
        default:
          throw new LayerError.INTERNAL_ERROR(error);
      }
    }
  }
}
