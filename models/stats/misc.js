const AssetStats = require("./asset");

class MiscAssetStats extends AssetStats {
  constructor(data, totals) {
    super();
    this.data = data;
    this.totals = totals;
    this.category = "misc";
  }

  sortStats() {
    this.stats.sort((a, b) => a["holdingValue"] - b["holdingValue"]);
  }

  getTotals() {
    this.sums.totalSum = this.balance * -1;
    this.sums.holdingValue = (this.sums.totalSum + this.balance);
    this.sums.difference = (this.sums.totalSum - this.sums.holdingValue) * -1;
    this.sums.differenceInPercents =
      this.sums.totalSum > 0
        ? (this.sums.holdingValue / this.sums.totalSum - 1) * 100
        : 0;
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

module.exports = MiscAssetStats;
