const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const axios = require("axios");
const fs = require("fs");

require("dotenv").config();
const { LUNARCRUSH_API: lunaApiKey } = process.env;

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

module.exports = {
  getCryptoCoin,
  generateCryptoMessage,
};
