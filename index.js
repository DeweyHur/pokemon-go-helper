const fsExtra = require('fs-extra');
const path = require('path');
// const Pokeio = require('./lib/Pokeio').Pokeio;
const Pokeio = require('./lib/pogobuf').Pokeio;
const util = require('./lib/util');
const task = require('./task');
const config = require('./config');

const pokeio = new Pokeio();

// https://github.com/Armax/Pokemon-GO-node-api 에 이름 변경관련 시그너처가 제외되어 있어 추가함.
['pokemon-go-node-api/poke.io.js', 'pokemon-go-node-api/pokemon.proto'].forEach((filename) => {
  fsExtra.copySync(path.resolve(__dirname, `./lib/${filename}`), path.resolve(__dirname, `./node_modules/${filename}`));
});

new Promise((resolve, reject) => {
  const taskNum = (parseInt(config.task, 10) || 1) - 1;
  console.log('Start tasking...', taskNum);
  if (task[taskNum] && typeof task[taskNum].runner === 'function') {
    let getTaskOpts;
    if (typeof task[taskNum].options === 'object') {
      getTaskOpts = Object.keys(task[taskNum].options).reduce((promise, name) => promise.then(() =>
        util.ask(`[${task[taskNum].name}] ${task[taskNum].options[name]} `)
          .then((value) => {
            // eslint-disable-next-line no-param-reassign
            config[name] = value;
          }))
      , Promise.resolve());
    } else {
      getTaskOpts = Promise.resolve();
    }
    getTaskOpts.then(() => {
      pokeio.init(config)
        .then(() => {
          console.log(`[i] execute '${task[taskNum].name}' task. : ${task[taskNum].description}`);
          const options = Object.assign({}, config);
          delete options.password;
          task[taskNum].runner(pokeio, options);
        });
    });
  } else {
    reject('[i] unknown task.');
  }
});
