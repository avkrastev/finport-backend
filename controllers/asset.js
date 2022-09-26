const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const Asset = require("../models/asset");
const P2p = require("../models/p2p");
const User = require("../models/user");
const mongoose = require("mongoose");
const url = require("url");
const {
  exchangeRatesBaseUSD,
  roundNumber,
  sumsInSupportedCurrencies,
} = require("../utils/functions");
const fns = require("date-fns");
const DataBuilder = require("../models/data-builder");
const CryptoAssetStats = require("../models/stats/crypto");
const StocksAssetStats = require("../models/stats/stocks");
const ETFAssetStats = require("../models/stats/etf");
const CommoditiesAssetStats = require("../models/stats/commodities");
const MiscAssetStats = require("../models/stats/misc");
const { CATEGORIES } = require("../utils/categories");
const P2PAssetStats = require("../models/stats/p2p");

const getAsset = async (req, res, next) => {
  let assets;
  const queryObject = url.parse(req.url, true).query;

  try {
    const creator = req.userData.userId;
    assets = await Asset.find({ creator, ...queryObject }).sort({
      date: "desc",
    });
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }

  if (!assets) {
    const error = new HttpError("Could not find any assets!", 404);
    return next(error);
  }

  res.json({ assets });
};

const getCryptoAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("crypto", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    let assets = [];
    if (statsResults.length > 0 && sumsResult.length > 0) {
      const cryptoAssetStats = new CryptoAssetStats(
        statsResults,
        sumsResult,
        creator
      );
      assets = await cryptoAssetStats.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum
      );
    }

    res.json({ assets });
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getStockAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("stocks", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    let assets = [];
    if (statsResults.length > 0 && sumsResult.length > 0) {
      const stocksAssetStats = new StocksAssetStats(
        statsResults,
        sumsResult,
        creator
      );
      assets = await stocksAssetStats.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum
      );
    }

    res.json({ assets });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getETFAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("etf", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    let assets = [];
    if (statsResults.length > 0 && sumsResult.length > 0) {
      const ETFsAssetStats = new ETFAssetStats(
        statsResults,
        sumsResult,
        creator
      );
      assets = await ETFsAssetStats.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum
      );
    }

    res.json({ assets });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getCommodityAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("commodities", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    let assets = [];
    if (statsResults.length > 0 && sumsResult.length > 0) {
      const commoditiesAssetStats = new CommoditiesAssetStats(
        statsResults,
        sumsResult,
        creator
      );
      assets = await commoditiesAssetStats.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum
      );
    }

    res.json({ assets });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getMiscAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("misc", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumByCategoryPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategoryAndAssetPipeline()
    ).exec();

    let assets = [];
    if (statsResults.length > 0 && sumsResult.length > 0) {
      const miscAssetStats = new MiscAssetStats(
        statsResults,
        sumsResult,
        creator
      );
      assets = await miscAssetStats.getAllData();

      assets.sums.sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
        assets.sums.holdingValue,
        assets.sums.totalSum
      );
    }
    res.json({ assets });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getP2PAsset = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const p2pAssetStats = new P2PAssetStats(creator);
    const assets = await p2pAssetStats.getProfitPerAssets();
    res.json({ assets });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getAssetsSummary = async (req, res, next) => {
  const creator = req.userData.userId;

  try {
    const dataBuilder = new DataBuilder("", creator);
    const sumsResult = await Asset.aggregate(
      dataBuilder.getTotalSumPipeline()
    ).exec();

    const statsResults = await Asset.aggregate(
      dataBuilder.getTotalSumsByCategorySortedPipeline()
    ).exec();

    let sumsSummary = [];
    for (let asset of statsResults) {
      let formattedSummary = {};
      const category = CATEGORIES.find(
        (category) => category.alias === asset._id.category
      );
      formattedSummary.name = category.name;
      formattedSummary.alias = category.alias;
      formattedSummary.holdingValue = asset.totalSum;
      sumsSummary.push(formattedSummary);
    }

    const sumsInDifferentCurrencies = await sumsInSupportedCurrencies(
      sumsResult[0] ? sumsResult[0].totalSum : 0
    );

    res.json({
      assets: {
        sums: {
          totalSum: sumsResult[0] ? sumsResult[0].totalSum : 0,
          sumsInDifferentCurrencies,
        },
        stats: sumsSummary,
      },
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }
};

const getAssetById = async (req, res, next) => {
  let asset;
  try {
    asset = await Asset.findById(req.params.id);
  } catch (err) {
    const error = new HttpError("Something went wrong!", 500);
    return next(error);
  }

  if (!asset) {
    const error = new HttpError("Could not find any assets!", 404);
    return next(error);
  }

  res.json({ asset: asset.toObject({ getters: true }) });
};

const addAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Error!", 422));
  }

  const creator = req.userData.userId;

  const priceInUsd = await exchangeRatesBaseUSD(
    req.body.transaction.price,
    req.body.transaction.currency,
    fns.format(new Date(req.body.transaction.date), "yyyy-MM-dd")
  );

  let quantity = req.body.transaction.quantity;
  let price = req.body.transaction.price;
  let price_usd = roundNumber(priceInUsd);
  // TODO create global constants for types
  if (req.body.transaction.type === 1 || req.body.transaction.type === 3) {
    quantity = -Math.abs(quantity);
    price = -Math.abs(price);
    price_usd = -Math.abs(price_usd);
  }

  const addNewAsset = new Asset({
    ...req.body.transaction,
    quantity,
    price,
    price_usd,
    date: new Date(req.body.transaction.date).toISOString(),
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Adding new asset asset failed, try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user with provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await addNewAsset.save({ session: sess });
    user.assets.push(addNewAsset);
    await user.save({ session: sess, validateModifiedOnly: true });
    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Adding new asset asset failed, try again.",
      500
    );
    return next(error);
  }

  res.json({ asset: addNewAsset.toObject({ getters: true }) });
};

const updateAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Error!", 422));
  }

  const { price, currency, quantity, date, type } = req.body;

  let asset;
  try {
    asset = await Asset.findById(req.params.id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find asset by ID.",
      500
    );
    return next(error);
  }

  if (asset.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to modify this asset.",
      401
    );
    return next(error);
  }

  if (price) asset.price = price;
  if (currency) {
    asset.currency = currency;
    const priceInUsd = await exchangeRatesBaseUSD(
      asset.price,
      asset.currency,
      fns.format(new Date(asset.date), "yyyy-MM-dd")
    );
    asset.price_usd = priceInUsd;
  }
  if (quantity) asset.quantity = quantity;
  if (date) {
    const priceInUsd = await exchangeRatesBaseUSD(
      asset.price,
      asset.currency,
      fns.format(new Date(date), "yyyy-MM-dd")
    );
    asset.price_usd = priceInUsd;
    asset.date = new Date(date).toISOString();
  }
  if (type !== asset.type) {
    const priceInUsd = await exchangeRatesBaseUSD(
      asset.price,
      asset.currency,
      fns.format(new Date(asset.date), "yyyy-MM-dd")
    );
    if (type === 1 || type === 3) {
      asset.quantity = -Math.abs(quantity);
      asset.price = -Math.abs(price);
      asset.price_usd = -Math.abs(priceInUsd);
    } else {
      asset.quantity = Math.abs(quantity);
      asset.price = Math.abs(price);
      asset.price_usd = Math.abs(priceInUsd);
    }
    asset.type = type;
  }

  try {
    await asset.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update asset.",
      500
    );
    return next(error);
  }

  res.status(200).json({ asset: asset.toObject({ getters: true }) });
};

const deleteAsset = async (req, res, next) => {
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await deleteAssetCommon(req.params.id, req.userData.userId, sess);
    sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update asset.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted asset" });
};

const deleteAssets = async (req, res, next) => {
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    const deletedTransactions = req.body.ids.map(async (id) => {
      const transaction = await deleteAssetCommon(
        id,
        req.userData.userId,
        sess
      );
      return transaction;
    });

    await Promise.all(deletedTransactions);
    sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete asset.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted assets" });
};

const deleteAssetCommon = async (id, userId, sess) => {
  let asset;
  try {
    asset = await Asset.findById(id).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find asset by ID.",
      500
    );
    return error;
  }

  if (!asset) {
    const error = new HttpError("Could not find asset for this ID.", 404);
    return error;
  }

  if (asset.creator.id !== userId) {
    const error = new HttpError(
      "You are not allowed to delete this asset.",
      401
    );
    return error;
  }

  try {
    await asset.remove({ session: sess });
    asset.creator.assets.pull(asset);
    await asset.creator.save({ session: sess });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete asset.",
      500
    );
    return error;
  }
};

const getTransactionsReport = async (req, res, next) => {
  const queryObject = url.parse(req.url, true).query;

  try {
    const creator = req.userData.userId;
    const dataBuilder = new DataBuilder("", creator);
    let history = [];
    let transactions = [];
    if (queryObject.period === "monthly") {
      transactions = await Asset.aggregate(
        dataBuilder.getTransactionsPerMonths()
      ).exec();

      let historyByYears = transactions.reduce((prevArr, newArr) => {
        prevArr[newArr._id.year] = prevArr[newArr._id.year] || [];
        prevArr[newArr._id.year].push(newArr);
        return prevArr;
      }, Object.create(null));

      history = Object.keys(historyByYears)
        .reverse()
        .map((year) => {
          const totalInvested = historyByYears[year].reduce((total, record) => {
            return total + record.totalPriceInUSD;
          }, 0);
          const totalTransactions = historyByYears[year].reduce(
            (total, record) => {
              return total + record.count;
            },
            0
          );
          let monthlySpent = Array(12).fill(0);
          for (let rec of historyByYears[year]) {
            monthlySpent[rec._id.month - 1] = roundNumber(rec.totalPriceInUSD);
          }

          return {
            year,
            transactions: historyByYears[year],
            totalInvested,
            totalTransactions,
            monthlySpent,
          };
        });
      if (history.length === 0) {
        history = [
          {
            year: new Date().getFullYear(),
            monthlySpent: [],
            totalInvested: 0,
            totalTransactions: 0,
            transactions: [],
          },
        ];
      }
    }
    if (queryObject.period === "yearly") {
      transactions = await Asset.aggregate(
        dataBuilder.getTransactionsPerYear()
      ).exec();
      const firstYear =
        (transactions[transactions.length - 1] &&
          transactions[transactions.length - 1]._id.year) ||
        new Date().getFullYear();
      const lastYear =
        (transactions[0] && transactions[0]._id.year) ||
        new Date().getFullYear();

      let yearsLabels = [];
      for (var i = lastYear; i >= firstYear; i--) {
        yearsLabels.push(i);
      }

      let yearlySpent = Array(yearsLabels.length).fill(0);

      let totalInvested = 0;
      let totalTransactions = 0;
      for (let transaction of transactions) {
        yearlySpent[transaction._id.year - firstYear] = roundNumber(
          transaction.totalPriceInUSD
        );
        totalInvested += roundNumber(transaction.totalPriceInUSD);
        totalTransactions += transaction.count;
      }

      history = {
        yearsLabels,
        transactions,
        yearlySpent,
        totalInvested,
        totalTransactions,
      };
    }
    res.status(200).json({ history });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching history data failed, try again.",
      500
    );
    return next(error);
  }
};

exports.getAsset = getAsset;
exports.getAssetById = getAssetById;
exports.addAsset = addAsset;
exports.updateAsset = updateAsset;
exports.deleteAsset = deleteAsset;
exports.deleteAssets = deleteAssets;
exports.getCryptoAsset = getCryptoAsset;
exports.getStockAsset = getStockAsset;
exports.getETFAsset = getETFAsset;
exports.getCommodityAsset = getCommodityAsset;
exports.getMiscAsset = getMiscAsset;
exports.getP2PAsset = getP2PAsset;
exports.getAssetsSummary = getAssetsSummary;
exports.getTransactionsReport = getTransactionsReport;
