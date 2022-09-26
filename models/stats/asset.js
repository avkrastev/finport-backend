class AssetStats {
  constructor(data, totals) {
    this.data = data;
    this.totals = totals;
    this.balance = 0;
    this.currentPrices = {};
    this.stats = [];
    this.sums = {};
  }

  getStats() {
    for (let item of this.data) {
      let stats = {};
      stats.name = item._id.name;
      stats.symbol = item._id.symbol;
      stats.totalSum = item.totalSum;
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice = this.currentPrices[stats.symbol].price;
      stats.holdingValue =
        this.currentPrices[stats.symbol].price * stats.holdingQuantity;
      stats.averageNetCost =
        stats.holdingQuantity > 0 ? item.totalSum / stats.holdingQuantity : 0;
      stats.difference = (item.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        stats.averageNetCost > 0
          ? (stats.currentPrice / stats.averageNetCost - 1) * 100
          : 0;

      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  getStatsWithoutCurrentPrices() {
    for (let item of this.data) {
      let stats = {};
      stats.name = item._id.name;
      stats.symbol = item._id.symbol;
      stats.assetId = item._id.assetId;
      stats.totalSum = item.totalSum;
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice = "N/A";
      stats.holdingValue = item.totalSum;
      stats.averageNetCost =
        stats.holdingQuantity > 0 ? item.totalSum / stats.holdingQuantity : 0;
      stats.difference = (item.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        stats.averageNetCost > 0 && !isNaN(stats.currentPrice)
          ? (stats.currentPrice / stats.averageNetCost - 1) * 100
          : 0;

      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  getTotals() {
    this.sums.totalSum = this.totals[0].totalSum;
    this.sums.holdingValue = this.balance;
    this.sums.difference = (this.sums.totalSum - this.sums.holdingValue) * -1;
    this.sums.differenceInPercents =
      this.sums.totalSum > 0
        ? (this.balance / this.sums.totalSum - 1) * 100
        : 0;
  }
}

module.exports = AssetStats;
