const CryptoPrices = require("../prices/crypto");
const AssetStats = require("./asset");

class CryptoAssetStats extends AssetStats {
  constructor(data, totals, creator) {
    super();
    this.data = data;
    this.totals = totals;
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
    for (let item of this.data) {
      let stats = {};
      stats.name = item._id.name;
      stats.symbol = item._id.symbol;
      stats.assetId = item._id.assetId;
      stats.currency = this.findCurrency(item.data);
      stats.totalSum = item.totalSum;
      stats.holdingQuantity = item.totalQuantity;
      stats.totalSumInOriginalCurrency = item.totalSumInOriginalCurrency;
      stats.currentPrice = this.currentPrices[stats.assetId].usd;
      stats.holdingValue =
        this.currentPrices[stats.assetId].usd * stats.holdingQuantity;
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
