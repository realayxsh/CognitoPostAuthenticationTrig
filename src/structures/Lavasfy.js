const { LavasfyClient } = require("lavasfy");
const config = require(`../config.js`);
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
                id : "G3V",
                host : "lava.g3v.co.uk",
                port : 9008,
                password : "lavalinklol",
                secure : false
            }
        ]);
    }
}
module.exports = Lavasfy;
