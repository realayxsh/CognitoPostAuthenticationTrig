const { LavasfyClient } = require("lavasfy");
const config = require(`../../config.json`);
class Lavasfy extends LavasfyClient{
    constructor(client){
        super({
            clientID : config.spotifyId,
            clientSecret : config.spotifySecret,
            playlistLoadLimit : 4,
            audioOnlyResults : true,
            autoResolve : true,
            useSpotifyMetadata : true
        },[
            {
                id : "Radio",
                host : "lavalink.devamop.in",
                port : 443,
                password : "devamop.in",
                secure : true
            }
        ]);
    }
}
module.exports = Lavasfy;
