const CoinGecko = require("coingecko-api");
const Prices = require("./prices");

const cryptoCacheTTL = 1000;

class CryptoPrices extends Prices {
  constructor(assets, creator) {
    super();
    this.assets = assets;
    this.category = "crypto";
    this.creator = creator;
  }

  async getPricesPerAssets() {
    let currentPrices = [];
    if (this.creator) currentPrices = this.loadFromCache();

    if (
      currentPrices &&
      Object.keys(currentPrices).length === this.assets.length
    ) {
      return currentPrices;
    }

    if (currentPrices.length === 0) {
      const CoinGeckoClient = new CoinGecko();
      const result = await CoinGeckoClient.simple.price({
        ids: this.assets,
        vs_currencies: this.currency.toLowerCase(),
      });

      if (result.code === 200) {
        this.storeInCache(result.data, cryptoCacheTTL);
        currentPrices = result.data;
      } else {
        return new HttpError("Something went wrong!", 500);
      }

      return currentPrices;
    }
  }
}

module.exports = CryptoPrices;
