const { ObjectId } = require("mongodb");

class DataBuilder {
  constructor(category = "", userId = "") {
    this.category = category;
    this.userId = userId;
  }

  setCategory(category) {
    this.category = category;
  }

  getAssetsPerUserAndCategory() {
    return [
      {
        $group: {
          _id: {
            creator: "$creator",
            category: "$category",
            symbol: "$symbol",
            name: "$name",
            assetId: "$asset_id",
          },
          categories: {
            $push: {
              name: "$name",
              symbol: "$symbol",
              asset_id: "$asset_id",
              price_usd: "$price_usd",
              price: "$price",
              currency: "$currency",
              quantity: "$quantity",
              creator: "$creator",
            },
          },
          totalSum: {
            $sum: "$price_usd",
          },
          totalQuantity: {
            $sum: "$quantity",
          },
          totalSumInOriginalCurrency: {
            $sum: "$price",
          },
        },
      },
    ];
  }

  getTotalSumsByCategorySortedPipeline() {
    return [
      {
        $match: {
          creator: ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
          },
          totalSum: {
            $sum: "$price_usd",
          },
        },
      },
      {
        $sort: {
          totalSum: -1,
        },
      },
    ];
  }

  getTotalSumPipeline() {
    return [
      {
        $match: {
          creator: ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: null,
          totalSum: {
            $sum: "$price_usd",
          },
        },
      },
    ];
  }

  getTotalSumByCategoryPipeline() {
    return [
      {
        $match: {
          category: this.category,
          creator: ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: null,
          totalSum: {
            $sum: "$price_usd",
          },
        },
      },
    ];
  }

  getTotalSumsByCategoryAndAssetPipeline() {
    return [
      {
        $match: {
          category: this.category,
          creator: ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: {
            name: "$name",
            assetId: "$asset_id",
            symbol: "$symbol",
          },
          totalSum: {
            $sum: "$price_usd",
          },
          totalSumInOriginalCurrency: {
            $sum: "$price",
          },
          totalQuantity: {
            $sum: "$quantity",
          },
        },
      },
    ];
  }

  getBoughtItemsPerCategory() {
    return [
      {
        $match: {
          category: this.category,
          creator: new ObjectId(this.userId),
          type: 0,
        },
      },
      {
        $sort: {
          type: -1,
          date: -1,
        },
      },
    ];
  }

  getSoldItemsPerCategory() {
    return [
      {
        $match: {
          category: this.category,
          creator: new ObjectId(this.userId),
          type: 1,
        },
      },
      {
        $group: {
          _id: {
            name: "$name",
          },
          totalSum: {
            $sum: "$price",
          },
          date: { $min: "$date" },
        },
      },
    ];
  }

  getTransactionsPerMonths() {
    return [
      {
        $match: {
          creator: new ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: {
                $dateFromString: {
                  dateString: "$date",
                },
              },
            },
            month: {
              $month: {
                $dateFromString: {
                  dateString: "$date",
                },
              },
            },
          },
          transactions: {
            $push: {
              date: "$date",
              name: "$name",
              type: "$type",
              quantity: "$quantity",
              price: "$price_usd",
            },
          },
          count: {
            $sum: 1,
          },
          totalPriceInUSD: {
            $sum: "$price_usd",
          },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
    ];
  }

  getTransactionsPerYear() {
    return [
      {
        $match: {
          creator: new ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: {
                $dateFromString: {
                  dateString: "$date",
                },
              },
            },
          },
          transactions: {
            $push: {
              date: "$date",
              name: "$name",
              type: "$type",
              quantity: "$quantity",
              price: "$price_usd",
            },
          },
          count: {
            $sum: 1,
          },
          totalPriceInUSD: {
            $sum: "$price_usd",
          },
        },
      },
      {
        $sort: {
          "_id.year": -1,
        },
      },
    ];
  }

  getHistoryDataPerCategory() {
    return [
      {
        $match: {
          creator: new ObjectId(this.userId),
          category: this.category,
        },
      },
      {
        $group: {
          _id: {
            date: "$date",
          },
          categories: {
            $push: {
              balance: "$balance",
              total: "$total",
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ];
  }

  getHistoryDataSummary() {
    return [
      {
        $match: {
          creator: new ObjectId(this.userId),
        },
      },
      {
        $group: {
          _id: { date: "$date", category: "category" },
          balance: {
            $sum: "$balance",
          },
          total: {
            $sum: "$total",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ];
  }
}

module.exports = DataBuilder;
