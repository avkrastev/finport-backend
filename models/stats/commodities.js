const AssetStats = require("./asset");

class CommoditiesAssetStats extends AssetStats {
  constructor(data, totals) {
    super();
    this.data = data;
    this.totals = totals;
    this.category = "commodities";
  }

  async getAllData() {
    await this.getStatsWithoutCurrentPrices();
    this.getTotals();

    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = CommoditiesAssetStats;
