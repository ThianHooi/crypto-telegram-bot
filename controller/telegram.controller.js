const httpError = require("http-errors");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

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
