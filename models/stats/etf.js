const ETFPrices = require("../prices/etf");
const AssetStats = require("./asset");
const User = require("../user");

class ETFAssetStats extends AssetStats {
  constructor(data, totals, creator, session) {
    super(data, totals, session);
    this.creator = creator;
  }

  async getPrices() {
    const ids = this.data.map((item) => item._id.symbol);

    const stocksPrices = new ETFPrices(ids, this.creator);
    this.currentPrices = await stocksPrices.getPricesPerAssets();
  }

  async getAllData() {
    const userData = await User.findById(this.creator);
    if (true) {
      await this.getPrices();
      await this.getStats();
    } else {
      await this.getStatsWithoutCurrentPrices();
    }
    this.getTotals();
    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = ETFAssetStats;
