const pokedex = require('../pokedex');

const dictionary = Object.assign(...pokedex.pokemons.map(each => ({ [each.id]: each })));
const OPPOSITE_DEF = 150;
const COUNT_FORMAT = { 1: 'S', 2: 'D', 3: 'T', 4: 'Q', 5: 'P' };
const formatMoves = (pokemon, attack, quickMove, cinematicMove) => {
  const stab = (quickMove.pokemon_type === pokemon.type || quickMove.pokemon_type === pokemon.type_2) ? 1.25 : 1;
  const quickPower = quickMove.power * stab * attack / OPPOSITE_DEF;
  const cinematicPower = cinematicMove.power * stab * attack / OPPOSITE_DEF;
  const countIndex = Math.round(100 / Math.abs(cinematicMove.energy_delta));
  const eps = quickMove.energy_delta / (quickMove.duration_ms / 1000);
  const chargingDuration = Math.abs(cinematicMove.energy_delta) / eps;
  const quickDps = quickPower / (quickMove.duration_ms / 1000) * chargingDuration / (chargingDuration + cinematicMove.duration_ms / 1000);
  const cinematicDps = cinematicPower / (chargingDuration + cinematicMove.duration_ms / 1000);
  return { 
    quickDps: `${Math.round(quickDps)}`,
    cinematicDps: `${Math.round(cinematicDps)}${COUNT_FORMAT[countIndex] || '?'}`
  };
};

const formatQuickMove = (pokemon, attack, quickMove, cinematicMove) => {
  return `${Math.round(dps)}`;
};
const formatCinematicMove = (pokemon, attack, quickMove, cinematicMove) => {
  const stab = (cinematicMove.pokemon_type === pokemon.type || cinematicMove.pokemon_type === pokemon.type_2) ? 1.25 : 1;
  const power = cinematicMove.power * stab * attack / OPPOSITE_DEF;
  return `${Math.round(dps)}${COUNT_FORMAT[countIndex] || '?'}`;
};
const formatIv = (value) => {
  switch (value) {
    case 10: return 'a';
    case 11: return 'b';
    case 12: return 'c';
    case 13: return 'd';
    case 14: return 'e';
    case 15: return 'f';
    default: return String(value);
  }
}

module.exports = (pokeio) => {
  Promise.all([
    pokeio.getInventory(),
    pokeio.getSettings()
  ])
    .then(([inventory, settings]) => {
      const { inventoryDelta: { inventoryItems } } = inventory;

      const items = inventoryItems.map(each => each.inventoryItemData);
      const candies = {};
      items.filter(item => item.candy).map(item => item.candy).forEach(item => candies[item.familyId] = item.candy);
      const pokemons = items.map(each => each.pokemon || each.pokemonData)
        .filter(each => each && !each.isEgg)
        // pokodex 를 참고로 추가 정보를 붙임
        .map((each) => {
          const iv = (each.individualAttack || 0) +
            (each.individualDefense || 0) +
            (each.individualStamina || 0);
          const ivPercent = (`00${Math.min(99, Math.floor((iv / 45) * 100))}`).substr(-2);
          const fromPodex = dictionary[each.pokemonId] || {};
          let ivGrade;
          if (ivPercent === '99') {
            ivGrade = 'X';
          } else if (ivPercent >= '95') {
            ivGrade = 'R';
          } else if (ivPercent >= '90') {
            ivGrade = 'S';
          } else if (ivPercent >= '80') {
            ivGrade = 'A';
          } else if (ivPercent >= '60') {
            ivGrade = 'B';
          } else if (ivPercent >= '40') {
            ivGrade = 'C';
          } else {
            ivGrade = 'D';
          }
          return Object.assign({}, each, {
            familyId: fromPodex.familyId || each.pokemonId,
            nameKo: fromPodex.nameKo || `#${each.pokemonId}`,
            nameEn: fromPodex.nameEn || `#${each.pokemonId}`,
            nameJa: fromPodex.nameJa || `#${each.pokemonId}`,
            iv,
            ivPercent,
            ivGrade
          });
        })
        .map((each) => {
          const pokemon = settings.pokemon[each.pokemonId];
          const move_1 = settings.move[each.move_1];
          const move_2 = settings.move[each.move_2];
          const level = pokedex.cp_multiplier.findIndex(mult => Math.floor(mult * 1000) === Math.floor(each.cpMultiplier * 1000));
          if (pokemon && pokemon.candy_to_evolve > 0) {
            const candy = candies[pokemon.family_id];
            let newNickname = [
              level,
              each.ivGrade,
              formatIv(each.individualAttack),
              formatIv(each.individualDefense),
              formatIv(each.individualStamina),
              '.',
              pokemon.candy_to_evolve,
              '*',
              Math.floor(candy / pokemon.candy_to_evolve)
            ].join('').trim();
            return Object.assign({}, each, { newNickname });

          } else if (pokemon && move_1 && move_2) {
            const attack = pokemon.stats.base_attack + each.individualAttack;
            const { quickDps, cinematicDps } = formatMoves(pokemon, attack, move_1, move_2);
            let newNickname = [
              level,
              each.ivGrade, 
              pokedex.types[move_1.pokemon_type], 
              quickDps,
              pokedex.types[move_2.pokemon_type], 
              cinematicDps
            ].join('').trim();
            return Object.assign({}, each, { newNickname });

          } else {
            return each;
          }
        });

      return pokemons;
    })
    // 변경 대상의 닉네임을 변경한다.
    .then((pokemons) => {
      // 현재의 닉네임과 변경할 닉네임이 다른 것들만 실제 변경 대상
      const targets = pokemons.filter(each => each.newNickname && each.nickname !== each.newNickname);
      if (targets.length === 0) {
        console.log('[i] nothing to update.');
        return;
      }
      console.log(`[i] updateing ${targets.length} items.`);
      targets.reduce((promise, pokemon) => promise.then(() => {
        // 하나씩 이름을 변경한다.
        console.log(pokemon.nameKo, pokemon.newNickname);
        return pokeio.renamePokemon(pokemon.id, pokemon.newNickname);
      }), Promise.resolve());
    });
};
