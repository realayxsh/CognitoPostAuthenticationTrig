const { LavasfyClient } = require("lavasfy");
const config = require(`../../config.json`);
class Lavasfy extends LavasfyClient{
    constructor(client){
        super({
            clientID : process.env.spotifyId || config.spotifyId,
            clientSecret : process.env.spotifySecret || config.spotifySecret,
            playlistLoadLimit : 4,
            audioOnlyResults : true,
            autoResolve : true,
            useSpotifyMetadata : true
        },[
            {
                id : "Radio",
                host : "lava-v3.ajieblogs.eu.org",
                port : 80,
                password : "https://dsc.gg/ajidevserver",
                secure : false
            }
        ]);
    }
}
module.exports = Lavasfy;