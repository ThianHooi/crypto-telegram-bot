const axios = require("axios");

/**
 * Get and generate a randome joke
 * @returns {String} A joke string with setup and punchline
 */
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

module.exports = { getRandomJoke };
