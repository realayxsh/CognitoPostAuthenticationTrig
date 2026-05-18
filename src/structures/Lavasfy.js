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
                host : "89.106.84.59",
                port : 443,
                password : "heavencloud.in",
                secure : true
            }
        ]);
    }
}
module.exports = Lavasfy;
