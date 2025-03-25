const CommodityPrices = require("../prices/commodities");
const AssetStats = require("./asset");

class CommoditiesAssetStats extends AssetStats {
  constructor(data, totals, creator, session) {
    super(data, totals, session);
    this.category = "commodities";
    this.creator = creator;
  }

  async getPrices() {
    const ids = this.data.map((item) => item._id.symbol);

    const commoditiesPrices = new CommodityPrices(ids, this.creator);
    this.currentPrices = await commoditiesPrices.getPricesPerAssets();
  }

  async getAllData() {
    await this.getPrices();
    this.getStats();
    this.getTotals();

    return {
      sums: this.sums,
      stats: this.stats,
    };
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
      stats.holdingValue = this.currentPrices[stats.symbol].price * stats.holdingQuantity;
      stats.averageNetCost = stats.holdingQuantity > 0 ? item.totalSum / stats.holdingQuantity : 0;
      stats.difference = (item.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        stats.averageNetCost > 0 ? (stats.currentPrice / stats.averageNetCost - 1) * 100 : 0;
      stats.differenceInUSD =
        stats.currency !== "USD" ? stats.difference / exchangeRatesList[stats.currency] : "";

      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }
}

module.exports = CommoditiesAssetStats;
