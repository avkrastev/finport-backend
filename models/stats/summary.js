const CryptoPrices = require("../prices/crypto");
const StocksPrices = require("../prices/stocks");
const DataBuilder = require("../../models/data-builder");
const { exchangeRatesBaseUSD } = require("../../utils/functions");
const Asset = require("../asset");
const { addHistory } = require("../../controllers/history");
const fns = require("date-fns");
const P2PAssetStats = require("./p2p");
const AssetStats = require("./asset");

class SummaryAssetsStats extends AssetStats {
  async processHistoryData() {
    const dataBuilder = new DataBuilder();
    const assetsPerUserAndCategory = await Asset.aggregate(
      dataBuilder.getAssetsPerUserAndCategory()
    ).exec();

    let cryptoIds = [];
    let stockIds = [];
    for (let asset of assetsPerUserAndCategory) {
      if (asset._id.category === "crypto") {
        if (cryptoIds.indexOf(asset._id.assetId) === -1) cryptoIds.push(asset._id.assetId);
      }

      if (asset._id.category === "stocks" || asset._id.category === "etf") {
        if (stockIds.indexOf(asset._id.symbol) === -1) stockIds.push(asset._id.symbol);
      }
    }
    const cryptoPrices = new CryptoPrices(cryptoIds);
    const currentCryptoPrices = await cryptoPrices.getPricesPerAssets();

    const stocksPrices = new StocksPrices(stockIds);
    const currentStockPrices = await stocksPrices.getPricesPerAssets(
      process.env.STOCKS_PRICES_API_KEY
    );

    const exchangeRatesList = await exchangeRatesBaseUSD(0, "", "", true);

    const groupedByUser = assetsPerUserAndCategory.reduce((r, a) => {
      r[a._id.creator] = r[a._id.creator] || [];
      r[a._id.creator].push(a);
      return r;
    }, Object.create(null));

    let groupedByUserAndCategory = {};
    for (let user in groupedByUser) {
      const groupedByCategory = groupedByUser[user].reduce((r, a) => {
        r[a._id.category] = r[a._id.category] || [];
        r[a._id.category].push(a);
        return r;
      }, Object.create(null));

      groupedByUserAndCategory[user] = groupedByCategory;
    }

    for (let user in groupedByUserAndCategory) {
      for (let category in groupedByUserAndCategory[user]) {
        let totalInvested = groupedByUserAndCategory[user][category].reduce((total, record) => {
          return total + record.totalSum;
        }, 0);
        let balance = totalInvested;
        if (category === "crypto") {
          balance = groupedByUserAndCategory[user][category].reduce((total, record) => {
            return (
              total + record.totalQuantity * currentCryptoPrices[record.categories[0].asset_id].usd
            );
          }, 0);
        }
        if (category === "stocks" || category === "etf") {
          balance = groupedByUserAndCategory[user][category].reduce((total, record) => {
            let currentPrice = currentStockPrices[record.categories[0].symbol].price;
            if (currentStockPrices[record.categories[0].symbol].currency !== "USD") {
              currentPrice =
                exchangeRatesList[currentStockPrices[record.categories[0].symbol].currency] *
                currentStockPrices[record.categories[0].symbol].price;
            }
            return total + record.totalQuantity * currentPrice;
          }, 0);
        }
        if (category === "p2p") {
          const p2pAssetsStats = new P2PAssetStats(user);
          const p2pProfitStats = await p2pAssetsStats.getProfitPerAssets();
          balance = p2pProfitStats.sums.holdingValue;
        }

        if (category === "misc") {
          for (let item of groupedByUserAndCategory[user][category]) {
            item["currency"] = "USD"; //TODO this.findCurrency(item.currencies);
          }
          totalInvested = groupedByUserAndCategory[user][category].reduce((total, record) => {
            const totalSum =
              record.currency === "USD"
                ? record.totalSum
                : record.totalSumInOriginalCurrency * exchangeRatesList[record["currency"]];
            return total + totalSum;
          }, 0);
          balance = 0;
          for (let item of groupedByUserAndCategory[user][category]) {
            balance +=
              totalInvested - item["currency"] === "USD"
                ? item.totalSum
                : item.totalSumInOriginalCurrency * exchangeRatesList[item["currency"]];
          }
          balance -= totalInvested;
        }

        groupedByUserAndCategory[user][category].push({
          totalInvested,
          balance,
        });

        try {
          await addHistory(
            {
              date: fns.format(new Date(), "yyyy-MM-dd"),
              category,
              balance,
              total: totalInvested,
            },
            user
          );
        } catch (err) {
          console.log(err);
          new HttpError("Error storing history data!", 500);
        }
      }
    }

    return groupedByUserAndCategory;
  }
}

module.exports = SummaryAssetsStats;
