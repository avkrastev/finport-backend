const Prices = require("./prices");

const commoditiesCacheTTL = 86400;

class CommodityPrices extends Prices {
  constructor(assets, creator) {
    super();
    this.assets = assets;
    this.category = "commodities";
    this.creator = creator;
  }

  async getPricesPerAssets() {
    let currentPrices = [];
    currentPrices = this.loadFromCache(false);

    if (currentPrices && Object.keys(currentPrices).length > 0) {
      return currentPrices;
    }

    if (process.env.ENV === "production") {
      currentPrices = await this.fetchCommoditiesPrices();
    } else {
      const devPrices = {
        XAG: 0.048416374883805,
        XAU: 0.00055307650407129,
        XPD: 0.00074794315632012,
        XPT: 0.0011037527593819,
      };
      for (const [key, value] of Object.entries(devPrices)) {
        currentPrices[key] = {
          price: 1 / value,
          currency: "USD",
        };
      }
    }

    this.storeInCache(currentPrices, commoditiesCacheTTL, false);
    return currentPrices;
  }
}

module.exports = CommodityPrices;
