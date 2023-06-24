import ServicesDAO from '../../db/services.dao';
import * as Error from '../../utils/errors/http/index';
import fs from 'fs';

/**
 * Gets all the services from the database and writes them in a file called serviceson in the ./src/assets/data folder.
 */
export default async function getServices() {
  let servicesDAO = new ServicesDAO();

  try {
    var services = await servicesDAO.queryList({}, {}, 1, 1000 );

  } catch (err: any) {
    throw new Error._500(err.message);
  }

  const servicesJSON = JSON.stringify(services.data, null, 2);

  fs.writeFile('./src/assets/data/services.json', servicesJSON, (err) => {
    if (err) {
      throw new Error._500(err.message);
    }
  });
}
