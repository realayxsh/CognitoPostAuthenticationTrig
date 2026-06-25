const { Kazagumo, Plugins } = require("kazagumo");
const Spotify = require(`kazagumo-spotify`);
const Deezer = require(`kazagumo-deezer`);
const config = require(`../config.js`);
const { Connectors } = require(`shoukaku`);
class Shoukaku extends Kazagumo{
    constructor(client){
        super({
            defaultSearchEngine: 'spsearch',
            send : (guildId,payload) => {
                const guild = client.guilds.cache.get(guildId);
                if(guild) guild.shard.send(payload);
            },
            plugins : [
                new Spotify({
                    clientId : config.spotifyId,
                    clientSecret : config.spotifySecret,
                    playlistPageLimit : 10,
                    albumPageLimit    : 10,
                    searchLimit       : 100,
                    searchMarket      : "US",
                    searchPlatform    : "spsearch"
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
            resumeByLibrary       : true,
            resumeTimeout         : 60,
            reconnectTries        : 20,
            reconnectInterval     : 2000,
            restTimeout           : 20000,
            moveOnDisconnect      : true,
            voiceConnectionTimeout: 30000,
        }
        )
    }
}
module.exports = Shoukaku;
