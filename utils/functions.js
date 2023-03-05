const axios = require("axios");
const cacheProvider = require("./cache-provider");
const fns = require("date-fns");
const { CURRENCIES } = require("./currencies");

const exchangeRatesBaseUSD = async (amount, from, date = "", returnList = false) => {
  let currencyRates;

  const today = fns.format(new Date(), "yyyy-MM-dd");

  if (from === "USD") {
    return amount;
  }
  if (cacheProvider.instance().has("currency_rates") && date !== "" && date === today) {
    currencyRates = cacheProvider.instance().get("currency_rates");
  } else {
    let historyDate = "latest";
    if (date && date < today) {
      historyDate = date;
    }
    const options = {
      method: "GET",
      url: "https://api.exchangerate.host/" + historyDate + "?base=USD",
    };

    await axios
      .request(options)
      .then(function (response) {
        if (historyDate === "latest") {
          cacheProvider.instance().set("currency_rates", response.data.rates, 86400);
        }
        currencyRates = response.data.rates;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  if (returnList) {
    return currencyRates;
  }
  if (currencyRates.hasOwnProperty(from.toUpperCase())) {
    return amount / currencyRates[from.toUpperCase()];
  }
  return false;
};

const roundNumber = (num, scale = 2) => {
  if (!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale) + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = "";
    if (+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
};

const sumsInSupportedCurrencies = async (holdingValue, totalValue) => {
  const rates = await this.exchangeRatesBaseUSD(0, "", "", true);
  return CURRENCIES.map((currency) => {
    let exchanged = {};
    exchanged.currency = currency.value;
    exchanged.holdingAmount = rates[currency.value] * holdingValue;
    exchanged.totalAmount = rates[currency.value] * totalValue;
    return exchanged;
  });
};

const monthDiffFromToday = (date, date2 = new Date()) => {
  let months;
  date = new Date(date);
  months = (date2.getFullYear() - date.getFullYear()) * 12;
  months -= date.getMonth();
  months += date2.getMonth();

  const result = months <= 0 ? 0 : months;
  return result / 12;
};

const compoundInterest = (principal, rate, time) => {
  const r = rate / 100;
  const a = principal * Math.pow(1 + r / 12, 12 * time);
  return a - principal;
};

const deserializeParams = (string) => {
  let deserialized = {};

  for (let item of string.split(",")) {
    deserialized[item.split(":")[0]] = item.split(":")[1];
  }
  return deserialized;
};

exports.exchangeRatesBaseUSD = exchangeRatesBaseUSD;
exports.roundNumber = roundNumber;
exports.monthDiffFromToday = monthDiffFromToday;
exports.compoundInterest = compoundInterest;
exports.sumsInSupportedCurrencies = sumsInSupportedCurrencies;
exports.deserializeParams = deserializeParams;
