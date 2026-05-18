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
                host : "lava-v4.millohost.my.id",
                port : 443,
                password : "https://discord.gg/mjS5J2K3ep",
                secure : true
            }
        ]);
    }
}
module.exports = Lavasfy;
