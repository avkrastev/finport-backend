const asset = require("../asset");

class AssetStats {
  constructor(data, totals, session = null) {
    this.data = data;
    this.totals = totals;
    this.balance = 0;
    this.currentPrices = {};
    this.session = session;
    this.stats = [];
    this.sums = {};
  }

  async getStats() {
    const exchangeRatesList = this.session.exchangeRates;

    this.balance = 0;
    for (let item of this.data) {
      let stats = {};
      stats.name = item.data[item.data.length - 1].name;
      stats.currency = item.data[item.data.length - 1].asset_currency;
      stats.symbol = item._id.symbol;
      stats.totalSum =
        stats.currency === "USD"
          ? item.totalSum
          : item.totalSumInOriginalCurrency / exchangeRatesList[stats.currency];
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice =
        stats.currency === "USD"
          ? this.currentPrices[stats.symbol].price
          : this.currentPrices[stats.symbol].price / exchangeRatesList[stats.currency];
      stats.totalSumInOriginalCurrency = item.totalSumInOriginalCurrency;
      stats.holdingValue = stats.currentPrice * stats.holdingQuantity;
      stats.averageNetCost = stats.holdingQuantity > 0 ? stats.totalSum / stats.holdingQuantity : 0;
      stats.difference = (stats.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        stats.averageNetCost > 0 ? (stats.currentPrice / stats.averageNetCost - 1) * 100 : 0;
      stats.differenceInUSD =
        stats.currency !== "USD"
          ? stats.difference / exchangeRatesList[stats.currency]
          : stats.difference;

      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  async getStatsWithoutCurrentPrices() {
    const exchangeRatesList = this.session.exchangeRates;

    for (let item of this.data) {
      let stats = {};
      stats.name = item.name;
      stats.symbol = item._id.symbol;
      stats.assetId = item._id.assetId;
      stats.currency = item.data[item.data.length - 1].asset_currency;

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

  sortStats() {
    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  getTotals() {
    this.sums.totalSum = this.totals[0].totalSum;
    this.sums.holdingValue = this.balance;
    this.sums.difference = (this.sums.totalSum - this.sums.holdingValue) * -1;
    this.sums.differenceInPercents =
      this.sums.totalSum > 0 ? (this.balance / this.sums.totalSum - 1) * 100 : 0;
  }
}

module.exports = AssetStats;
