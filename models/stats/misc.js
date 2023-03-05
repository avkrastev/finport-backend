const { exchangeRatesBaseUSD } = require("../../utils/functions");
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
    this.sums.holdingValue = this.sums.totalSum + this.balance;
    this.sums.difference = (this.sums.totalSum - this.sums.holdingValue) * -1;
    this.sums.differenceInPercents =
      this.sums.totalSum > 0 ? (this.sums.holdingValue / this.sums.totalSum - 1) * 100 : 0;
  }

  async getStatsWithoutCurrentPrices() {
    const exchangeRatesList = await exchangeRatesBaseUSD(0, "", "", true);

    for (let item of this.data) {
      let stats = {};
      stats.name = item._id.name;
      stats.currency = this.findCurrency(item.data);
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice = "N/A";
      stats.totalSumInOriginalCurrency = item.totalSumInOriginalCurrency;
      stats.holdingValue =
        stats.currency === "USD" ? item.totalSum * -1 : item.totalSumInOriginalCurrency * -1;
      stats.holdingValueInUSD =
        stats.currency === "USD"
          ? item.totalSum * -1
          : item.totalSumInOriginalCurrency * -1 * exchangeRatesList[stats.currency];
      stats.averageNetCost =
        stats.holdingQuantity > 0 ? stats.holdingValue / stats.holdingQuantity : 0;
      stats.difference = stats.holdingValue;
      stats.differenceInPercents =
        stats.averageNetCost > 0 && !isNaN(stats.currentPrice)
          ? (stats.currentPrice / stats.averageNetCost - 1) * 100
          : 0;
      stats.differenceInUSD =
        stats.currency !== "USD" ? stats.holdingValue * exchangeRatesList[stats.currency] : "";

      this.balance += stats.holdingValueInUSD;

      this.stats.push(stats);
    }

    this.sortStats();
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
