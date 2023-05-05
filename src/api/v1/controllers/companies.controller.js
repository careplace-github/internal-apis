import crmUsersDAO from "../db/crmUsers.dao.js";
import ordersDAO from "../db/orders.dao.js";
import companiesDAO from "../db/companies.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";
import StripeService from "../services/stripe.service.js";
import stripeHelper from "../helpers/services/stripe.helper.js";

import authHelper from "../helpers/auth/auth.helper.js";

import * as Error from "../utils/errors/http/index.js";
import * as LayerError from "../utils/errors/layer/index.js";

export default class CompaniesController {
  static async create(req, res, next) {}

  static async retrieve(req, res, next) {
    let CompaniesDAO = new companiesDAO();
    let CompaniesCRUD = new CRUD(CompaniesDAO);

    await CompaniesCRUD.retrieve(req, res, next);
  }

  static async update(req, res, next) {
    try {
      let response = {};

      let companyId = await req.params.id;
      let company = req.body;
      let companyExists;
      let CompaniesDAO = new companiesDAO();

      try {
        companyExists = await CompaniesDAO.retrieve(companyId);
      } catch (err) {
        console.log(err);
        if (err.type === "NOT_FOUND") {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }
      if (req.body.serviceArea && req.body.serviceArea.length !== 0) {
        /**
         * Request:
         * 
         * {
  "serviceArea": {
    "type": "MultiPolygon",
    "coordinates": [
      [
        [
          [38.686817291203056, -9.233442249832116],
          [38.7122820136559, -9.099161903125305],
          [38.795224252927554, -9.07625894679447],
          [38.81967257876864, -9.197048511005036],
          [38.771745967593134, -9.242854423666707],
          [38.686817291203056, -9.233442249832116]
        ]
      ],
      [
        [
          [38.680106057895486, -9.466822399376667],
          [38.670308855539524, -9.314139990218873],
          [38.691534432433755, -9.245955791060736],
          [38.82885837074285, -9.263943033783434],
          [38.838959662147474, -9.46012947185194],
          [38.680106057895486, -9.466822399376667]
        ]
      ],
      [
        [
          [41.13576631277991, -8.673796061743502],
          [41.13511987330021, -8.545565019812754],
          [41.19211133559549, -8.560499558832802],
          [41.1807428480594, -8.701605203367038],
          [41.13576631277991, -8.673796061743502]
        ]
      ]
    ]
  }
}

         */

        company.serviceArea = req.body.serviceArea;
      }

      // Get the Event from the database and substitute the values that are in the request body.

      let updateCompany = {
        ...companyExists,
        ...company,
      };

      let updatedCompany = await CompaniesDAO.update(updateCompany);

      response.statusCode = 200;
      response.data = updatedCompany;

      next(response);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async searchCompanies(req, res, next) {
    let filters = {};
    let options = {};
    let page = req.query.page ? req.query.page : 1;
    let documentsPerPage = req.query.documentsPerPage
      ? req.query.documentsPerPage
      : 10;

    // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
    if (req.query.sortBy) {
      // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
      // Otherwise, we will by default sort the results by ascending order.
      options.sort = {
        [req.query.sortBy]: req.query.sortOrder === "desc" ? -1 : 1, // 1 = ascending, -1 = descending
      };
    }

    // If the lat and lng query parameters are provided, we'll add them to the filter object.
    if (req.query.lat && req.query.lng) {
      filters["serviceArea"] = {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            //coordinates: [38.74733186331398, -9.28920997678132]
            coordinates: [parseFloat(req.query.lat), parseFloat(req.query.lng)],
          },
        },
      };
    }

    let CompaniesDAO = new companiesDAO();
    let companies = await CompaniesDAO.query_list(
      filters,
      options,
      page,
      documentsPerPage,
      null,
      "-plan -legal_information -team -stripe_information -billing_address"
    );

    let response = {
      data: companies,
      statusCode: 200,
    };

    next(response);
  }
}
