const AssetStats = require("./asset");
const Asset = require("../../models/asset");
const P2p = require("../../models/p2p");
const DataBuilder = require("../../models/data-builder");
const {
  monthDiffFromToday,
  compoundInterest,
  sumsInSupportedCurrencies,
} = require("../../utils/functions");

class P2PAssetStats extends AssetStats {
  constructor(creator = "") {
    super();
    this.category = "p2p";
    this.creator = creator;
  }

  setInterestPaid(totalInterestPaid) {
    this.totalInterestPaid = totalInterestPaid;
  }

  getStats() {
    for (let item of this.data) {
      const interestsPaid = this.totalInterestPaid.find(
        (platform) => platform.name === item._id.name
      );
      let stats = {};
      stats.name = item._id.name;
      stats.symbol = item._id.symbol;
      stats.assetId = item._id.assetId;
      stats.currency = item._id.currency;
      stats.totalSum = item.totalSum;
      stats.totalSumInOriginalCurrency =
        item.totalSumInOriginalCurrency + interestsPaid.interest;
      stats.holdingQuantity = item.totalQuantity;
      stats.currentPrice = "N/A";
      stats.holdingValue = item.totalSum + interestsPaid.interest;
      stats.averageNetCost =
        stats.holdingQuantity > 0 ? item.totalSum / stats.holdingQuantity : 0;
      stats.difference = (item.totalSum - stats.holdingValue) * -1;
      stats.differenceInPercents =
        (interestsPaid.interest / interestsPaid.totalInvested) * 100;
      stats.totalInvested = interestsPaid.totalInvested;

      this.balance += stats.holdingValue;

      this.stats.push(stats);
    }

    this.stats.sort((a, b) => b["holdingValue"] - a["holdingValue"]);
  }

  async getProfitPerAssets() {
    const dataBuilder = new DataBuilder(this.category, this.creator);
    this.totals = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    this.data = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    const boughtParts = await Asset.aggregate(
      dataBuilder.getBoughtItemsPerCategory()
    ).exec();

    const soldParts = await Asset.aggregate(
      dataBuilder.getSoldItemsPerCategory()
    ).exec();

    let assets = [];
    if (this.data.length > 0 && this.totals.length > 0) {
      const percentages = await P2p.find({ creator: this.creator });

      const boughtPartsGrouped = boughtParts.reduce(function (prevArr, newArr) {
        prevArr[newArr.name] = prevArr[newArr.name] || [];
        prevArr[newArr.name].push(newArr);
        return prevArr;
      }, Object.create(null));

      let totalInterestPaid = [];
      for (let item in boughtPartsGrouped) {
        let amount = 0;
        let apr = 0;
        const totalSoldPerPlatform = soldParts.find(
          (part) => part._id.name === item
        );
        if (totalSoldPerPlatform) amount = totalSoldPerPlatform.totalSum;
        const platformHasAPR = percentages.find(
          (percentage) => percentage.name === item
        );
        if (platformHasAPR) apr = platformHasAPR.apr;

        let interestPerItem = {};
        interestPerItem.name = item;
        interestPerItem.interest = 0;
        interestPerItem.totalInvested = 0;
        for (let j in boughtPartsGrouped[item]) {
          amount += boughtPartsGrouped[item][j].price;
          const price = boughtPartsGrouped[item][j].price;
          if (amount <= 0) {
            const endDate = new Date(totalSoldPerPlatform.date);
            const time = monthDiffFromToday(
              boughtPartsGrouped[item][j].date,
              endDate
            );
            boughtPartsGrouped[item][j].interest = compoundInterest(
              price,
              apr,
              time
            );
          } else {
            const time = monthDiffFromToday(boughtPartsGrouped[item][j].date);
            boughtPartsGrouped[item][j].interest = compoundInterest(
              price,
              apr,
              time
            );
          }
          interestPerItem.interest += boughtPartsGrouped[item][j].interest;
          interestPerItem.totalInvested += price;
        }
        totalInterestPaid.push(interestPerItem);
      }

      this.setInterestPaid(totalInterestPaid);
      assets = await this.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum,
        "EUR"
      );

      assets.percentages = percentages;
    }

    return assets;
  }

  async getAllData() {
    this.getStats();
    this.getTotals();

    return {
      sums: this.sums,
      stats: this.stats,
    };
  }
}

module.exports = P2PAssetStats;
