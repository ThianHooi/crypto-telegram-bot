const axios = require("axios");

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
    console.log("====================================");
    console.log(error);
    console.log("====================================");
    throw Error("Something went wrong");
  }
};

module.exports = { getRandomJoke };
