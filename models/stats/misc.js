const AssetStats = require("./asset");

class MiscAssetStats extends AssetStats {
  constructor(data, totals) {
    super();
    this.data = data;
    this.totals = totals;
    this.category = "misc";
  }

  async getAllData() {
    this.getStatsWithoutCurrentPrices();
    this.getTotals();

    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = MiscAssetStats;
