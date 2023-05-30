const cacheProvider = require("../../utils/cache-provider");
const axios = require("axios");

class Prices {
  constructor(category, creator, currency = "USD") {
    this.category = category;
    this.creator = creator;
    this.currency = currency;
  }

  loadFromCache(perUser = true) {
    let currentPrices = [];
    if (perUser && cacheProvider.instance().has(this.category + "_prices_" + this.creator)) {
      currentPrices = cacheProvider.instance().get(this.category + "_prices_" + this.creator);
    } else {
      currentPrices = cacheProvider.instance().get(this.category + "_prices") || [];
    }

    return currentPrices;
  }

  storeInCache(data, ttl, perUser = true) {
    if (perUser) {
      cacheProvider.instance().set(this.category + "_prices_" + this.creator, data, ttl);
    } else {
      cacheProvider.instance().set(this.category + "_prices", data, ttl);
    }
  }

  async fetchStockPrices(apiKey, asset = "") {
    const options = {
      method: "GET",
      url: "https://yfapi.net/v6/finance/quote?symbols=" + (asset !== "" ? asset : this.assets),
      headers: {
        "x-api-key": apiKey,
      },
    };

    const prices = await axios
      .request(options)
      .then(function (response) {
        let prices = [];
        for (let asset of response?.data?.quoteResponse?.result) {
          if (asset) {
            prices[asset.symbol] = {
              price: asset.regularMarketPrice,
              currency: asset.currency,
            };
          }
        }
        return prices;
      })
      .catch(function (error) {
        console.error(error);
      });

    return prices;
  }

  async fetchCommoditiesPrices() {
    const options = {
      method: "GET",
      url: `https://api.metals.live/v1/spot`,
    };
    const prices = await axios
      .request(options)
      .then(function (response) {
        let prices = [];
        for (const asset of response?.data) {
          if (asset) {
            for (const item in asset) {
              if (item === "timestamp") continue;

              let key;
              if (item === "gold") key = "XAU";
              if (item === "silver") key = "XAG";
              if (item === "platinum") key = "XPT";
              if (item === "palladium") key = "XPD";

              prices[key] = {
                price: Number(asset[item]),
                currency: "USD",
              };
            }
          }
        }
        return prices;
      })
      .catch(function (error) {
        console.error(error);

        let prices = [];
        prices["gold"] = { price: 0, currency: "USD" };
        prices["silver"] = { price: 0, currency: "USD" };
        prices["platinum"] = { price: 0, currency: "USD" };
        prices["palladium"] = { price: 0, currency: "USD" };
        return prices;
      });

    return prices;
  }

  async fetchCommoditiesPrices2() {
    const options = {
      method: "GET",
      url: `https://commodities-api.com/api/latest?access_key=1h3adty49rm63sdeou042788mel90zww051siwhihthdhj4vu0xosvpizui7&symbols=XAU,XAG,XPT,XPD`,
    };
    const prices = await axios
      .request(options)
      .then(function (response) {
        let prices = [];
        for (const [key, value] of Object.entries(response.data.data.rates)) {
          prices[key] = {
            price: 1 / value,
            currency: "USD",
          };
        }

        return prices;
      })
      .catch(function (error) {
        console.error(error);
        return error;
      });

    return prices;
  }
}

module.exports = Prices;
