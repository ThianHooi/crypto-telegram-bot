const httpError = require("http-errors");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

require("dotenv").config();

const { TELEGRAM_BOT_TOKEN: telegramToken, LUNARCRUSH_API: lunaApiKey } =
  process.env;
// const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, { polling: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.onText(/\/rickAndMorty (.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const characterId = match[1];

  if (!Number.isInteger(parseInt(characterId)) || parseInt(characterId) <= 0) {
    bot.sendMessage(
      chatId,
      "Invalid ID. Please enter a number between 1 to 600"
    );
    return;
  }

  await getRickAndMortyChar(characterId)
    .then((characterDetails) => {
      const messageBody = generateRickAndMortyMsg(characterDetails);

      bot.sendPhoto(chatId, messageBody.image, {
        caption: `${messageBody.text}`,
        parse_mode: "HTML",
      });
    })
    .catch((err) =>
      bot.sendMessage(chatId, "Something went wrong. Try again later.")
    );
});

bot.onText(/\/rickAndMorty$/i, async (msg, match) => {
  const chatId = msg.chat.id;

  await getRickAndMortyChar()
    .then((characterDetails) => {
      const messageBody = generateRickAndMortyMsg(characterDetails);

      bot.sendPhoto(chatId, messageBody.image, {
        caption: `${messageBody.text}`,
        parse_mode: "HTML",
      });
    })
    .catch((err) =>
      bot.sendMessage(chatId, "Something went wrong. Try again later.")
    );
});

bot.onText(/\/joke$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const fullJoke = await getRandomJoke().catch(
    (err) => "Something went wrong. Try again later."
  );

  bot.sendMessage(chatId, fullJoke, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Another one?",
            callback_data: "/joke",
          },
        ],
      ],
    },
  });
});

bot.onText(/\/crypto (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  await getCryptoCoin(resp? resp : "BTC")
    .then(async (cryptoDetails) => {
      const messageBody = await generateCryptoMessage(cryptoDetails);

      bot.sendPhoto(chatId, messageBody.image, {
        caption: `${messageBody.text}`,
        parse_mode: "HTML",
      });
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(chatId, "Something went wrong. Try again later.");
    });
});

bot.onText(/\/bitcoin$/i, async (msg, match) => {
  const chatId = msg.chat.id;

  await getCryptoCoin("BTC")
    .then(async (cryptoDetails) => {
      const messageBody = await generateCryptoMessage(cryptoDetails);

      bot.sendPhoto(chatId, messageBody.image, {
        caption: `${messageBody.text}`,
        parse_mode: "HTML",
      });
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(chatId, "Something went wrong. Try again later.");
    });
});

bot.onText(/\/ethereum$/i, async (msg, match) => {
  const chatId = msg.chat.id;

  await getCryptoCoin("ETH")
    .then(async (cryptoDetails) => {
      const messageBody = await generateCryptoMessage(cryptoDetails);

      bot.sendPhoto(chatId, messageBody.image, {
        caption: `${messageBody.text}`,
        parse_mode: "HTML",
      });
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(chatId, "Something went wrong. Try again later.");
    });
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome " + msg.from.username);
});

bot.on("callback_query", async (callbackQuery) => {
  const { data: command, message } = callbackQuery;
  const chatId = message.chat.id;

  if (command === "/joke") {
    const fullJoke = await getRandomJoke().catch(
      (err) => "Something went wrong. Try again later."
    );

    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Here goes another one",
      show_alert: false,
    });

    bot.sendMessage(chatId, fullJoke);
  }
});

const generateRickAndMortyMsg = (characterDetails) => {
  const { image, name, species, status, gender, origin } = characterDetails;

  return {
    text: `This is  <b>${name}</b>.  
    \n Gender: ${gender} 
    \n Status: ${status} 
    \n Origin: ${origin.name}
    \n Species: ${species}
    `,
    image,
  };
};

const getRickAndMortyChar = async (
  characterId = parseInt(Math.random() * (600 - 1) + 1)
) => {
  try {
    const characetr = await axios
      .get(`https://rickandmortyapi.com/api/character/${characterId}`)
      .then((details) => {
        return details.data;
      });

    return characetr;
  } catch (error) {
    throw Error("Something went wrong");
  }
};

const getRandomJoke = async () => {
  try {
    const fullJoke = await axios
      .get("https://official-joke-api.appspot.com/random_joke")
      .then((msg) => {
        const { setup, punchline } = msg.data;

        return setup + " " + punchline;
      });

    return fullJoke;
  } catch (error) {
    throw Error("Something went wrong");
  }
};

const getCryptoCoin = async (coinSymbol) => {
  try {
    let config = {
      method: "GET",
      url: `https://api.lunarcrush.com/v2?data=assets&key=${lunaApiKey}&symbol=${coinSymbol}`,
    };

    const cryptoDetails = await axios(config).then((response) => response.data);

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
  // const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);

  return image;
};

const sendMessage = (req, res) => {
  const { body: messageBody } = req;
  const { message, chatId } = messageBody;

  bot
    .sendMessage(chatId, message)
    .then((response) => {
      res.status(200).send("Sent message to telegram");
    })
    .catch((err) => console.error(err));
};

const handleWebhook = (req, res) => {
  res.sendStatus(200);
};

module.exports = {
  sendMessage,
  handleWebhook,
};
