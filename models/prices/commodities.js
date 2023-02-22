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
    if (this.creator) currentPrices = this.loadFromCache();

    if (currentPrices && this.assets && Object.keys(currentPrices).length === this.assets.length) {
      return currentPrices;
    }

    currentPrices = await this.fetchCommoditiesPrices();
    this.storeInCache(currentPrices, commoditiesCacheTTL);
    return currentPrices;
  }
}

module.exports = CommodityPrices;
