const axios = require("axios");

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

module.exports = { getRickAndMortyChar, generateRickAndMortyMsg };
