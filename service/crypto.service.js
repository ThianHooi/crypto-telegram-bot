const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const axios = require("axios");
const fs = require("fs");

require("dotenv").config();
const { LUNARCRUSH_API: lunaApiKey } = process.env;

/**
 * Get details of a crypto coin
 * @param {String} coinSymbol
 * @returns {Object} An object of coin details of the symbol passed in
 */
const getCryptoCoin = async (coinSymbol) => {
  try {
    let config = {
      method: "GET",
      url: `https://api.lunarcrush.com/v2?data=assets&key=${lunaApiKey}&symbol=${coinSymbol}`,
    };

    const cryptoDetails = await axios(config)
      .then((response) => response.data)
      .catch((err) => console.log(err));

    return cryptoDetails;
  } catch (error) {
    throw Error("Something went wrong");
  }
};

/**
 * Generate an object with required messages and image
 * @param {Object} cryptoDetails
 * @returns {Object} Object with text and image
 */
const generateCryptoMessage = async (cryptoDetails) => {
  const coinDetails = cryptoDetails.data[0];
  const {
    name,
    symbol,
    price,
    percent_change_24h,
    percent_change_30d,
    timeSeries,
  } = coinDetails;

  const graph = await generateGraph(timeSeries);

  return {
    text: `<b>${name} (${symbol})</b>
    \n Price Now: ${parseFloat(price).toFixed(2)} USD
    \n 24 Hour % Change: ${percent_change_24h} ${
      percent_change_24h > 0 ? "⬆️" : "⬇️"
    }
    \n 30 Days % Change: ${percent_change_30d} ${
      percent_change_30d > 0 ? "⬆️" : "⬇️"
    }
    `,
    image: graph,
  };
};

/**
 * Generate a graph of price trends in past 24 hours
 * @param {Array} timeSeries
 * @returns {Buffer} A buffer of canvas image
 */
const generateGraph = async (timeSeries) => {
  const past24hrsPrice = timeSeries.map((series) => {
    return series.close;
  });

  const past24hrsTime = timeSeries.map((series) => {
    const unixTimestamp = series.time;

    const milliseconds = unixTimestamp * 1000;

    const dateObject = new Date(milliseconds);

    return dateObject.toLocaleString("en-MY");
  });

  const width = 800;
  const height = 800;
  const chartCallback = (ChartJS) => {};

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    chartCallback,
  });

  const configuration = {
    type: "line",
    data: {
      labels: past24hrsTime,
      datasets: [
        {
          label: "Price over 24 Hours",
          data: past24hrsPrice,
          borderWidth: 1,
          borderColor: "#552583",
        },
      ],
      options: {
        backgroundColor: "#552583",
        borderColor: "#552583",
      },
    },
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);

  fs.writeFile("img.png", image, (err) => {
    if (err) return console.error(err);
    console.log("file saved to ", "img.png");
  });

  return image;
};

/**
 * Get news of cryptos for the past 24 hours
 * @param {String} coinSymbol
 * @returns {String} String of crypto feeds (news)
 */
const getCryptoNews = async (coinSymbol = "BTC") => {
  try {
    const yesterday =
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getTime() / 1000;

    const today = new Date().getTime() / 1000;

    let config = {
      method: "GET",
      url: `https://api.lunarcrush.com/v2`,
      params: {
        data: "feeds",
        key: lunaApiKey,
        symbol: coinSymbol,
        start: parseInt(yesterday),
        end: parseInt(today),
        limit: 5,
        sources: "news",
      },
    };

    const cryptoFeeds = await axios(config)
      .then((response) => response.data)
      .then((feeds) => generateCryptoNewsMessage(feeds))
      .catch((err) => console.log(err));

    return cryptoFeeds;
  } catch (error) {
    throw Error("Something went wrong");
  }
};

/**
 * Generate a string of feeds
 * @param {Object} cryptoFeeds
 * @returns {String}
 */
const generateCryptoNewsMessage = (cryptoFeeds) => {
  const { data } = cryptoFeeds;

  const msgString = data.reduce((accum, news) => {
    const { title, url, type, publisher } = news;

    const message = `${title} - <a href="${url}"><i>${publisher}</i></a> \n\n`;

    return accum + message;
  }, "");

  return msgString;
};

module.exports = {
  getCryptoCoin,
  generateCryptoMessage,
  getCryptoNews,
  generateCryptoNewsMessage,
};
