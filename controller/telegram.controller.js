const httpError = require("http-errors");
const TelegramBot = require("node-telegram-bot-api");

const {
  jokeService,
  cryptoService,
  rickAndMortyService,
} = require("../service/index");

require("dotenv").config();

const { TELEGRAM_BOT_TOKEN: telegramToken } = process.env;

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

  await rickAndMortyService
    .getRickAndMortyChar(characterId)
    .then((characterDetails) => {
      const messageBody =
        rickAndMortyService.generateRickAndMortyMsg(characterDetails);

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

  await rickAndMortyService
    .getRickAndMortyChar()
    .then((characterDetails) => {
      const messageBody =
        rickAndMortyService.generateRickAndMortyMsg(characterDetails);

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
  const fullJoke = await jokeService.getRandomJoke().catch((err) => {
    console.log(err);
    return "Something went wrong. Try again later.";
  });

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

  await cryptoService
    .getCryptoCoin(resp ? resp : "BTC")
    .then(async (cryptoDetails) => {
      const messageBody = await cryptoService.generateCryptoMessage(
        cryptoDetails
      );

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

  await cryptoService
    .getCryptoCoin("BTC")
    .then(async (cryptoDetails) => {
      const messageBody = await cryptoService.generateCryptoMessage(
        cryptoDetails
      );

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

  await cryptoService
    .getCryptoCoin("ETH")
    .then(async (cryptoDetails) => {
      const messageBody = await cryptoService.generateCryptoMessage(
        cryptoDetails
      );

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

bot.onText(/cryptonews (.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const coinSymbol = match[1];

  await cryptoService
    .getCryptoNews(coinSymbol ? coinSymbol : "BTC")
    .then(async (cryptoFeeds) => {
      bot.sendMessage(chatId, cryptoFeeds, {
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
    const fullJoke = await jokeService
      .getRandomJoke()
      .catch((err) => "Something went wrong. Try again later.");

    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Here goes another one",
      show_alert: false,
    });

    bot.sendMessage(chatId, fullJoke);
  }
});

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
