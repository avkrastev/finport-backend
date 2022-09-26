const ETFPrices = require("../prices/etf");
const { exchangeRatesBaseUSD } = require("../../utils/functions");
const AssetStats = require("./asset");
const User = require("../user");

class ETFAssetStats extends AssetStats {
  constructor(data, totals, creator) {
    super();
    this.data = data;
    this.totals = totals;
    this.category = "etf";
    this.creator = creator;
  }

  async getPrices() {
    const ids = this.data.map((item) => item._id.symbol);

    const stocksPrices = new ETFPrices(ids, this.creator);
    this.currentPrices = await stocksPrices.getPricesPerAssets(this.apiKey);
    this.exchangeRatesList = await exchangeRatesBaseUSD(0, "", "", true);
  }

  async getAllData() {
    const userData = await User.findById(this.creator);
    if (userData.stocks_api_key) {
      this.apiKey = userData.stocks_api_key;
      await this.getPrices();
      this.getStats();
    } else {
      this.getStatsWithoutCurrentPrices();
    }
    this.getTotals();
    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = ETFAssetStats;
