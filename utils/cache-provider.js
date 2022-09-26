const NodeCache = require("node-cache");
let cache = null;

exports.start = function (done) {
  if (cache) return done();

  cache = new NodeCache({ stdTTL: 86400 });
};

exports.instance = function () {
  return cache;
};
