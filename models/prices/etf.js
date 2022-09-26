const cacheProvider = require("../../utils/cache-provider");
const Prices = require("./prices");

const etfCacheTTL = 86400;

class ETFPrices extends Prices {
  constructor(assets, creator) {
    super();
    this.assets = assets;
    this.category = "etf";
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
    this.storeInCache(currentPrices, etfCacheTTL);
    return currentPrices;
  }
}

module.exports = ETFPrices;
