const StocksPrices = require("../prices/stocks");
const AssetStats = require("./asset");
const User = require("../user");

class StocksAssetStats extends AssetStats {
  constructor(data, totals, creator, session) {
    super(data, totals, session);
    this.category = "stocks";
    this.creator = creator;
  }

  async getPrices() {
    const ids = this.data.map((item) => item._id.symbol);

    const stocksPrices = new StocksPrices(ids, this.creator);
    this.currentPrices = await stocksPrices.getPricesPerAssets();
  }

  getStats() {
    const exchangeRatesList = this.session.exchangeRates;

    for (let item of this.data) {
      let stats = {};
      stats.name = item.data[item.data.length - 1].name;
      stats.symbol = item._id.symbol;

      stats.currency = item.data[item.data.length - 1].asset_currency;
      stats.totalSum =
        stats.currency === "USD"
          ? item.totalSum
          : item.totalSum * exchangeRatesList[stats.currency];
      stats.holdingQuantity = item.totalQuantity;
      stats.totalSumInOriginalCurrency = item.totalSumInOriginalCurrency;
      stats.currentPrice =
        stats.currency === "USD"
          ? this.currentPrices[stats.symbol].price
          : this.currentPrices[stats.symbol].price * exchangeRatesList[stats.currency];
      stats.holdingValue = stats.currentPrice * stats.holdingQuantity;
      stats.averageNetCost = stats.holdingQuantity > 0 ? stats.totalSum / stats.holdingQuantity : 0;
      stats.difference = (stats.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        stats.averageNetCost > 0 ? (stats.currentPrice / stats.averageNetCost - 1) * 100 : 0;
      stats.differenceInUSD =
        stats.currency !== "USD" ? stats.difference / exchangeRatesList[stats.currency] : "";
      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  async getAllData() {
    const userData = await User.findById(this.creator);
    if (true) {
      await this.getPrices();
      this.getStats();
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

module.exports = StocksAssetStats;
