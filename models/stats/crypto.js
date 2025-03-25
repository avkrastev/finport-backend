const CryptoPrices = require("../prices/crypto");
const AssetStats = require("./asset");

class CryptoAssetStats extends AssetStats {
  constructor(data, totals, creator, session) {
    super(data, totals, session);
    this.category = "crypto";
    this.creator = creator;
  }

  async getPrices() {
    const ids = this.data.map((item) => item._id.assetId);
    if (ids.indexOf("bitcoin") === -1) ids.push("bitcoin");

    const cryptoPrices = new CryptoPrices(ids, this.creator);
    this.currentPrices = await cryptoPrices.getPricesPerAssets();
  }

  getStats() {
    const exchangeRatesList = this.session.exchangeRates;
    for (let item of this.data) {
      let stats = {};
      stats.name = item.data[item.data.length - 1].name;
      stats.symbol = item.data[item.data.length - 1].symbol;
      stats.assetId = item._id.assetId;
      stats.currency = item.data[item.data.length - 1].asset_currency;
      stats.totalSum =
        stats.currency === "USD"
          ? item.totalSum
          : item.totalSumInOriginalCurrency / exchangeRatesList[stats.currency];
      stats.totalSumInOriginalCurrency = item.totalSumInOriginalCurrency;
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice =
        stats.currency === "USD"
          ? this.currentPrices[stats.assetId].usd
          : this.currentPrices[stats.assetId].usd / exchangeRatesList[stats.currency];

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
    await this.getPrices();
    this.getStats();
    this.getTotals();
    this.sums.inBitcoin = this.balance / this.currentPrices["bitcoin"].usd;

    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = CryptoAssetStats;
