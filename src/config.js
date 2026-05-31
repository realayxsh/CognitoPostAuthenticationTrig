require('dotenv').config();
const fileConfig = require('../config.json');

const config = {
    token: process.env.token || fileConfig.token,
    clientId: process.env.clientId || fileConfig.clientId,
    prefix: process.env.prefix || fileConfig.prefix || '+',
    color: process.env.color || fileConfig.color || '#E53535',
    owners: process.env.owners ? process.env.owners.split(',') : fileConfig.owners,
    coowners: process.env.coowners ? process.env.coowners.split(',') : fileConfig.coowners,
    mongourl: process.env.mongourl || fileConfig.mongourl,
    mongourl2: process.env.mongourl2 || fileConfig.mongourl2 || process.env.mongourl || fileConfig.mongourl,
    mongourl3: process.env.mongourl3 || process.env.mongourl || fileConfig.mongourl,
    mongourl4: process.env.mongourl4 || process.env.mongourl || fileConfig.mongourl,
    mongourl5: process.env.mongourl5 || fileConfig.mongourl5 || process.env.mongourl || fileConfig.mongourl,
    mongourl6: process.env.mongourl6 || fileConfig.mongourl6 || process.env.mongourl || fileConfig.mongourl,
    errors: process.env.errors || fileConfig.errors,
    logwebhook: process.env.logwebhook || fileConfig.logwebhook,
    guildwebhook: process.env.guildwebhook || fileConfig.guildwebhook,
    activitywebhook: process.env.activitywebhook || fileConfig.activitywebhook,
    spotifyId: process.env.spotifyId || fileConfig.spotifyId,
    spotifySecret: process.env.spotifySecret || fileConfig.spotifySecret,
    topggapi: process.env.topggapi || fileConfig.topggapi,
    server: process.env.server || fileConfig.server,
    noprefix: process.env.noprefix || fileConfig.noprefix,
    logChannelId: process.env.logChannelId || fileConfig.logChannelId,
    nodes: fileConfig.nodes,
};

module.exports = config;
