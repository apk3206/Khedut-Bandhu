const mongoose = require('mongoose');
const MarketRate = require('./models/MarketRate');

mongoose.connect('mongodb://localhost:27017/khedut_bandhu')
    .then(async () => {
        const count = await MarketRate.countDocuments();
        const samples = await MarketRate.find().limit(2);
        console.log(JSON.stringify({ count, samples }));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
