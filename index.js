#! /usr/bin/env node

const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { green, red } = require('chalk');
const { CronJob } = require('cron');
const ora = require('ora');

const { model, capacity, zip, carrier, color, config, watch, notify } = argv;

if (!fs.existsSync(path.resolve('iphone7.yaml')) && notify) {
  throw new Error('You must provide an iphone7.yaml config file for twilio to work');
}

const envConfig = yaml.safeLoad(fs.readFileSync(
  config ? path.resolve(config) : 'iphone7.yaml',
'utf8'));

const twilioAccount = envConfig.TWILIO_ACCOUNT;
const twlioToken = envConfig.TWILIO_TOKEN;
const toNum = envConfig.TO_NUMBER;
const fromNum = envConfig.FROM_NUMBER;

const twilio = require('twilio')(twilioAccount, twlioToken);

const parts = {
  plus: {
    black: {
      256: 'MN592LL%2FA',
      128: 'MN522LL%2FA',
      32: 'MNQR2LL%2FA',
    },
    jetBlack: {
      256: 'MN6E2LL%2FA',
      128: 'MN682LL%2FA',
    },
    silver: {
      32: 'MNQT2LL%2FA',
      128: 'MN532LL%2FA',
      256: 'MN5C2LL%2FA',
    },
    gold: {
      32: 'MNQU2LL%2FA',
      128: 'MN552LL%2FA',
      256: 'MN5D2LL%2FA',
    },
    rose: {
      32: 'MNQV2LL%2FA',
      128: 'MN562LL%2FA',
      256: 'MN5E2LL%2FA',
    },
  },
  seven: {
    jetBlack: {
      128: 'MN9M2LL%2FA',
      256: 'MN9T2LL%2FA',
    },
    black: {
      32: 'MN9D2LL%2FA',
      128: 'MN9H2LL%2FA',
      256: 'MN9N2LL%2FA',
    },
    silver: {
      32: 'MN9E2LL%2FA',
      128: 'MN9J2LL%2FA',
      256: 'MN9P2LL%2FA',
    },
    gold: {
      32: 'MN9F2LL%2FA',
      128: 'MN9K2LL%2FA',
      256: 'MN9Q2LL%2FA',
    },
    rose: {
      32: 'MN9G2LL%2FA',
      128: 'MN9L2LL%2FA',
      256: 'MN9R2LL%2FA',
    },
  },
};

const carriers = {
  att: 'ATT%2FUS',
  sprint: 'SPRINT%2FUS',
  tmobile: 'TMOBILE%2FUS',
  verizon: 'VERIZON%2FUS',
};

const spinner = ora('Checking for available phones...').start();

function computeCarrierCode(carrierToMap = 'att') {
  return carriers[carrierToMap.toLowerCase()];
}

function computePartCode() {
  return parts[model][color][capacity];
}

function checkForAvailability() {
  spinner.color = 'yellow';
  spinner.text = 'Searching for iphones...';
  return new Promise((resolve, reject) => {
    const baseURL = `http://www.apple.com/shop/retail/pickup-message?parts.0=${computePartCode()}&location=${zip}&little=true&cppart=${computeCarrierCode(carrier)};`;
    axios.get(baseURL).then((res) => {
      if (res.data && res.status === 200) {
        const payload = res.data.body;
        const availablePhones = payload.stores.filter((store) => {
          const phones = Object.keys(store.partsAvailability)
                       .map(part => store.partsAvailability[part])
                       .filter(part => part.pickupDisplay === 'available' || part.storePickupQuote.match(/today/));
          return phones.length > 0;
        })
        .map(store => ({ url: store.reservationUrl, availablePhones: store.partsAvailability }));

        if (availablePhones && availablePhones.length > 0) {
          if (notify) {
            twilio.sendMessage({
              to: toNum,
              from: fromNum,
              body: `A ${capacity}GB ${color} iphone 7${model === 'plus' && 'plus'} from ${carrier} is available 🎉 🎉 🎉 ==> http://www.apple.com/shop/buy-iphone/iphone-7`,
            })
            .then(() => {
              spinner.text = `${green('✔︎')} Found iphone!`;
              spinner.color = 'green';
              resolve();
            })
            .catch(err => reject(err));
          } else {
            spinner.color = 'green';
            console.log(`${green('✔︎')} Found iphone!`);
            console.log(availablePhones);
            resolve();
          }
        } else {
          const message = `${red('✘')} None available as of ${new Date()} :(`;
          spinner.text = message;
          resolve();
        }
      }
    })
    .catch(err => reject(err));
  });
}

if (watch) {
  const checker = new CronJob('*/1 * * * *', () => checkForAvailability(), null, true, 'America/Los_Angeles');
  checker.start();
} else {
  checkForAvailability().then(() => setTimeout(() => spinner.stopAndPersist(), 2000))
  .catch(err => console.error(err));
}

module.exports = checkForAvailability;
