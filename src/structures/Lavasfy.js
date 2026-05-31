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
                id : "Serenetia",
                host : "lavalinkv4.serenetia.com",
                port : 443,
                password : "https://dsc.gg/serenetia",
                secure : true
            }
        ]);
    }
}
module.exports = Lavasfy;
