const { pokemons } = require('./pokedex.json');
const { keysToCamelCase } = require('../lib/util');

const getKey = name => (name || '').toLowerCase().replace(/([\s\\’']|\(.*?\))/g, '');

const dictionary = require('./pokemon-names.json').names.reduce((prev, curr) => {
  const [num, en, ko, ja] = curr;
  const key = getKey(en);
  // pokedex (https://github.com/Biuni/PokemonGOPokedex)에 151번까지밖에 없다.
  // 추가 포켓몬들은 우선 http://ko.pokemon.wikia.com/wiki/국가별_포켓몬_이름_목록 기준으로 채운다.
  // 단 이 경우 familyId 나 candyCount 등의 정보가 부정확하여 진화 계산에서 누락된다.
  if (pokemons.filter(pokemon => getKey(pokemon.name) === key).length === 0) {
    pokemons.push({
      id: parseInt(num, 10),
      num,
      name: en,
    });
  }
  return Object.assign({}, prev, {
    [key]: { en, ko, ja },
  });
}, {});

exports.pokemons = keysToCamelCase(pokemons).map((pokemon) => {
  const familyId = parseInt(pokemon.prevEvolution && pokemon.prevEvolution[0] ?
    pokemon.prevEvolution[0].num : pokemon.id, 10);
  const nextId = pokemon.nextEvolution && pokemon.nextEvolution[0] ?
    parseInt(pokemon.nextEvolution[0].num, 10) : null;
  const found = dictionary[getKey(pokemon.name)];
  return Object.assign({}, pokemon, {
    familyId,
    nextId,
    candyCount: pokemon.candyCount || null,
    nameEn: found.en || pokemon.name,
    nameKo: found.ko || pokemon.name,
    nameJa: found.ja || pokemon.name,
  });
}).sort((a, b) => {
  if (a.familyId < b.familyId) {
    return -1;
  }
  if (a.familyId > b.familyId) {
    return 1;
  }
  return 0;
});

exports.types = {
  1: '노',
  2: '격',
  3: '비',
  4: '독',
  5: '땅',
  6: '바',
  7: '벌',
  8: '유',
  9: '철',
  10: '불',
  11: '물',
  12: '풀',
  13: '전',
  14: '에',
  15: '얼',
  16: '용',
  17: '어',
  18: '페'
};

exports.cp_multiplier = [
  0.094, 0.16639787, 0.21573247, 0.25572005, 0.29024988,
  0.3210876 , 0.34921268, 0.37523559, 0.39956728, 0.42250001,
  0.44310755, 0.46279839, 0.48168495, 0.49985844, 0.51739395,
  0.53435433, 0.55079269, 0.56675452, 0.58227891, 0.59740001,
  0.61215729, 0.62656713, 0.64065295, 0.65443563, 0.667934,
  0.68116492, 0.69414365, 0.70688421, 0.71939909, 0.7317,
  0.73776948, 0.74378943, 0.74976104, 0.75568551, 0.76156384,
  0.76739717, 0.7731865, 0.77893275, 0.78463697, 0.79030001
];