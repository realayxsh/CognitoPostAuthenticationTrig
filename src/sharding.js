require('dotenv').config(); // Add this to the very top
const { ClusterManager } = require("discord-hybrid-sharding");

// We no longer require the config.json for the token
const manager = new ClusterManager(./src/index.js, {
    token: process.env.DISCORD_TOKEN, // Changed this line
    totalClusters: 2,
    totalShards: 10,
    shardsPerClusters: 5
});

manager.spawn({delay: 10000, timeout: -1, amount: manager.totalShards});
manager.on('clusterCreate', cluster => { console.log([CLUSTER] => Cluster Launched ${cluster.id}) });
manager.on("clusterReady", cluster => { console.log([CLUSTER] => Cluster is Ready ${cluster.id}) });
