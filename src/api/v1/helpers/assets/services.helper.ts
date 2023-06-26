import ServicesDAO from '../../db/services.dao';
import { HTTPError } from '@api/v1/utils/errors/http';
import fs from 'fs';

/**
 * Gets all the services from the database and writes them in a file called serviceson in the ./src/assets/data folder.
 */
export async function getServices() {
  let servicesDAO = new ServicesDAO();

  try {
    var services = await servicesDAO.queryList({}, {}, 1, 1000 );

  } catch (err: any) {
    throw new HTTPError._500(err.message);
  }

  const servicesJSON = JSON.stringify(services.data, null, 2);

  fs.writeFile('./src/assets/data/services.json', servicesJSON, (err) => {
    if (err) {
      throw new HTTPError._500(err.message);
    }
  });
}
