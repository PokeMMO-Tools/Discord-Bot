const priceCommand = require('./price');
const priceFRCommand = require('./priceFR');
const priceDECommand = require('./priceDE');
const priceESCommand = require('./priceES');
const priceITCommand = require('./priceIT');

const commands = [
    priceCommand,
    priceFRCommand,
    priceDECommand,
    priceESCommand,
    priceITCommand
];

module.exports = commands;