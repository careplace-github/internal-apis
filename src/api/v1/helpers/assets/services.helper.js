import ServicesDAO from "../../db/services.dao.js";
import * as Error from "../errors/errors.helper.js";
import fs from "fs";

/**
 * Gets all the services from the database and writes them in a file called services.json in the ./src/assets/data folder.
 */
export default async function getServices() {
  let servicesDAO = new ServicesDAO();

  try {
    var services = await servicesDAO.query_list();
  } catch (err) {
    throw new Error._500(err);
  }

  const servicesJSON = JSON.stringify(services, null, 2);

  fs.writeFile("./src/assets/data/services.json", servicesJSON, (err) => {
    if (err) {
      throw new Error._500(err);
    }
  });
}
