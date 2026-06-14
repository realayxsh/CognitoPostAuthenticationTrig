const { LavasfyClient } = require("lavasfy");
const config = require(`../config.js`);

const lavasfyNodes = config.nodes.map(node => {
    const [host, port] = node.url.split(":");
    return {
        id: node.name,
        host: host,
        port: parseInt(port),
        password: node.auth,
        secure: node.secure
    };
});

class Lavasfy extends LavasfyClient{
    constructor(client){
        super({
            clientID : config.spotifyId,
            clientSecret : config.spotifySecret,
            playlistLoadLimit : 4,
            audioOnlyResults : true,
            autoResolve : true,
            useSpotifyMetadata : true
        }, lavasfyNodes);
    }
}
module.exports = Lavasfy;
