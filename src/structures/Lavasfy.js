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
                id : "Jirayu",
                host : "lavalink.jirayu.net",
                port : 443,
                password : "youshallnotpass",
                secure : true
            },
            {
                id : "Serenetia",
                host : "lavalinkv4.serenetia.com",
                port : 443,
                password : "https://seretia.link/discord",
                secure : true
            },
            {
                id : "DevamOP",
                host : "lavalink.devamop.in",
                port : 443,
                password : "DevamOP",
                secure : true
            },
            {
                id : "Freelink",
                host : "freelink1.gaylaxy.dev",
                port : 443,
                password : "freelink",
                secure : true
            }
        ]);
    }
}
module.exports = Lavasfy;
