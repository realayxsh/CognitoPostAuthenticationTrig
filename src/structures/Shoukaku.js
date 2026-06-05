const { Kazagumo, Plugins } = require("kazagumo");
const Spotify = require(`kazagumo-spotify`);
const Deezer = require(`kazagumo-deezer`);
const config = require(`../config.js`);
const { Connectors } = require(`shoukaku`);
class Shoukaku extends Kazagumo{
    constructor(client){
        super({
            defaultSearchEngine: 'soundcloud',
            send : (guildId,payload) => {
                const guild = client.guilds.cache.get(guildId);
                if(guild) guild.shard.send(payload);
            },
            plugins : [
                new Spotify({
                    clientId : config.spotifyId,
                    clientSecret : config.spotifySecret,
                    playlistPageLimit : 5,
                    albumPageLimit : 5,
                    searchLimit : 50,
                    searchMarket : "IN",
                    searchPlatform : "scsearch"
                }),
                new Deezer({
                    playlistLimit : 20
                }),
                new Plugins.PlayerMoved(client)
            ]
        },
        new Connectors.DiscordJS(client),
        config.nodes,
        {
            resumeByLibrary       : false,
            resumeTimeout         : 30,
            reconnectTries        : 10,
            reconnectInterval     : 3000,
            restTimeout           : 10000,
            moveOnDisconnect      : true,
            voiceConnectionTimeout: 15000,
        }
        )
    }
}
module.exports = Shoukaku;
