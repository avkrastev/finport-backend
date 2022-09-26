const Prices = require("./prices");

const stocksCacheTTL = 86400;

class StockPrices extends Prices {
  constructor(assets, creator) {
    super();
    this.assets = assets;
    this.category = "stocks";
    this.creator = creator;
  }

  async getPricesPerAssets(apiKey) {
    let currentPrices = [];
    if (this.creator) currentPrices = this.loadFromCache();

    if (
      currentPrices &&
      Object.keys(currentPrices).length === this.assets.length
    ) {
      return currentPrices;
    }

    currentPrices = await this.fetchStockPrices(apiKey);
    this.storeInCache(currentPrices, stocksCacheTTL);
    return currentPrices;
  }
}

module.exports = StockPrices;
