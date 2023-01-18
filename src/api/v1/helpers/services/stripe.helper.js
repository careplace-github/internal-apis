

class StripeHelper {
  constructor() {}
}

const getCompanySales = {
  async getCompanySales(stripe_account_id, options, filters) {
    // Create an Enum of year, month, week
    // Create an Enum of total, byYear, byMonth, byWeek

    let options_ = {
      /**
       * groupBy = year => subGroupBy = month || week || none
       * groupBy = month => subGroupBy = week || none
       * groupBy = none => subGroupBy = none
       *
       *
       * groupBy = year && subGroupBy = month:
       * [{
       * year: "2022",
       * sales: [{
       * month: "2022-11",
       * total: "2500"
       * },{
       * month: "2022-12",
       * total: "2500"
       * }]
       *
       * },{
       * year: "2023",
       * sales: [{
       * month: "2023-01",
       * total: "2500"
       * }]
       *
       * }]
       *
       *
       * groupBy = year && subGroupBy = week:
       * [{
       * year: "2022",
       * sales: [{
       * week: "2022-12-20",
       * total: "2500"
       * },{
       * week: "2022-12-27",
       * total: "2500"
       * }]
       *
       * },{
       * year: "2023",
       * sales: [{
       * week: "2023-01-01",
       * total: "2500"
       * }]
       *
       * }]
       *
       *
       * groupBy = month && subGroupBy = week:
       * [{
       * month: "2022-12",
       * sales: [{
       * week: "2022-12-20",
       * total: "2500"
       *
       *
       *
       *
       *
       *
       *
       */
      groupBy: "year" || "month" || "none",
      subGroupBy: "year" || "month" || "week" || "none",

      /**
       * groupBy = year => monthCap = null && dayCap = null
       * groupBy = month => dayCap = null
       */
      yearCap: "2022",
      monthCap: "2022-01",
      dayCap: "2022-01-01",

      /**
       * Returns the total revenue for a specific year, month or week.
       */
      year: "2022",
      month: "2022-01",
      week: "2022-01-01",
    };

    let filters_ = {
      groupBy: "Month",
    };

    console.log("ANALYTICS")
  },
};

const getTotalSalesByCompany = {
  async getTotalSalesByCompany(stripe_account_id) {},
};

const getUserOrders = {
  async getUserOrders(stripe_customer_id) {},
};

const getReceipt = {
  async getReceipt(stripe_subscription_id) {
    // Downloads file from url
    let download = async (url, path, callback) => {
      const writer = fs.create;
      const response = await axios({
        url,
        method: "GET",

        responseType: "stream",
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    };

    return download(url, path);
  },
};

class StripeAnalytics extends StripeHelper {
  constructor() {
    super();
  }
}

// Add the methods to the prototypes
Object.assign(StripeAnalytics.prototype, getCompanySales);
Object.assign(StripeAnalytics.prototype, getTotalSalesByCompany);
Object.assign(StripeAnalytics.prototype, getUserOrders);


class StripeUtils extends StripeHelper {
  constructor() {
    super();
  }
}

Object.assign(StripeUtils.prototype, getReceipt);




export { StripeAnalytics, StripeUtils };
