// @axios
import axios from '@axios';

// @api
import { LayerError } from '@utils';

// @constants
import { VENDUS_SECRET_KEY } from '@constants';
// @logger
import logger from '@logger';

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
  static axios = axios(this.baseURL, VENDUS_SECRET_KEY, 'BASIC');

  /**
   *
   * @see https://www.vendus.pt/ws/#tag/Clients/paths/~1clients/post
   */
  static async createClient(data: any): Promise<any> {
    try {
      logger.info(`VendusService createClient Request: \n ${JSON.stringify(data, null, 2)} \n`);

      const response = await this.axios.post('/clients', data);

      logger.info(`VendusService createClient Response: \n ${JSON.stringify(response, null, 2)}\n`);

      return response;
    } catch (err: any) {
      logger.error(`VendusService createClient Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }
  }

  /**
   * Creates a new document like an invoice, a credit note, a receipt for a payment, a transportation document, and all others.
   *
   * Invoices
   * The only mandatory parameter when creating an invoie is items. For each item, you must send at least its qty, along with id (or reference). If it is a new product, it will be created. Regarding client, you don't have to send this parameter if you don't have his fiscal_id, and you should NEVER send fiscal_id as 999999990. And if client does not exist, it will be added.
   *
   * @see https://www.vendus.pt/ws/#tag/Documents/paths/~1documents/post
   */
  static async createInvoice(data: any): Promise<any> {
    try {
      logger.info(`VendusService createInvoice Request: \n ${JSON.stringify(data, null, 2)} \n`);

      const response = await this.axios.post('/documents', data);

      logger.info(
        `VendusService createInvoice Response: \n ${JSON.stringify(response, null, 2)}\n`
      );

      return response;
    } catch (err: any) {
      logger.error(`VendusService createInvoice Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }
  }

  /**
   * Payments and Receipts
   *
   * To register a customer's payment, you create a receipt, that is, a document of type RG. Relevant parameters are payments and invoices, which should contain a list of all invoices being paid, each identified by its document_number. You should NOT send items.
   *
   * @see https://www.vendus.pt/ws/#tag/Receipts/paths/~1receipts/post
   */
  static async createReceipt(data: any): Promise<any> {
    try {
      logger.info(`VendusService createReceipt Request: \n ${JSON.stringify(data, null, 2)} \n`);

      const response = await this.axios.post('/documents', data);

      logger.info(
        `VendusService createReceipt Response: \n ${JSON.stringify(response, null, 2)}\n`
      );

      return response;
    } catch (err: any) {
      logger.error(`VendusService createReceipt Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }
  }
}
