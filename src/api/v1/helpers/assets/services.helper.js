import ServicesDAO from "../../db/services.dao";
import * as Error from "../../utils/errors/http/index";
import fs from "fs";

/**
 * Gets all the services from the database and writes them in a file called serviceson in the ./src/assets/data folder.
 */
export default async function getServices() {
  let servicesDAO = new ServicesDAO();

  try {
    var services = await servicesDAO.query_list();
  } catch (err) {
    throw new Error._500(err);
  }

  const servicesJSON = JSON.stringify(services, null, 2);

  fs.writeFile("./src/assets/data/serviceson", servicesJSON, (err) => {
    if (err) {
      throw new Error._500(err);
    }
  });
}
