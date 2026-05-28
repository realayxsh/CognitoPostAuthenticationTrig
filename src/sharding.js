require('dotenv').config();
const { ClusterManager } = require("discord-hybrid-sharding");

const manager = new ClusterManager('./src/index.js', {
token: process.env.token,
totalClusters: 'auto',
totalShards: 'auto',
shardsPerClusters: 1
});

manager.on('clusterCreate', (cluster) => {
console.log("Cluster Launched: " + cluster.id);
});

manager.on('clusterReady', (cluster) => {
console.log("Cluster Ready: " + cluster.id);
});

manager.spawn({ delay: 7000, timeout: -1 });
