const pogobuf = require('pogobuf');
const { keysToCamelCase } = require('./util');

class Pokeio {
  constructor() {
    this.instance = null;
  }

  init(config) {
    const self = this;
    self.instance = new pogobuf.Client({
      authType: config.credentials.type,
      username: config.credentials.user,
      password: config.credentials.password,
      version: 6100,
      useHashingServer: true,
      hashingKey: config.hashserver.key,
      includeRequestTypeInResponse: true,      
    });
    return self.instance.init()
      .then(() => {
        console.log(`[i] Logging with user: ${config.credentials.user}`);
        console.log('[i] Received Google access token!');
        console.log(`[i] Received API Endpoint: ${self.instance.endpoint}`);
        return self.instance;
      });
  }

  getInventory() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.instance.getInventory(0).then(inventory =>
        // 순환참조를 막기위해서 JSON.stringify > JSON.parse
        resolve(keysToCamelCase(JSON.parse(JSON.stringify(inventory)))), err => reject(err));
    });
  }

  getSettings() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.instance.downloadItemTemplates().then(template => {
        const settings = { pokemon: {}, move: {} };
        template.item_templates
          .forEach(each => {
            if (each.pokemon_settings)
              settings.pokemon[each.pokemon_settings.pokemon_id] = each.pokemon_settings;
            if (each.move_settings)
              settings.move[each.move_settings.movement_id] = each.move_settings;
          });
        resolve(settings); 
      }, err => reject(err)); 
    });
  }

  renamePokemon(id, name) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.instance.nicknamePokemon(id, name).then(() => {
        console.log(`[i] update nickname: ${name}`);
        setTimeout(() => {
          resolve(true);
        }, 1000);
      }, err => reject(err));
    });
  }

  // 샘플데이터로 테스트하기 위한 함수 (실제 데이터가 아님)
  // eslint-disable-next-line class-methods-use-this
  _getInventory() {
    return new Promise((resolve) => {
      // eslint-disable-next-line global-require
      resolve(require('../sample/json/inventory.sample.json'));
    });
  }
}

exports.Pokeio = Pokeio;
