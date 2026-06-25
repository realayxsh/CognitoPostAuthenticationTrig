const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

class TrackError extends AvonClientEvent {
    get name() { return 'trackError'; }
    async run(player, track, data) {
        try {
            const ch = this.client.channels.cache.get(player.textId);
            const errMsg = data?.exception?.message || 'Unknown error';
            console.error(`[TrackError] Guild: ${player.guildId} | Track: ${track?.title} | Error: ${errMsg}`);

            // Attempt to re-search the failed track on Spotify before giving up
            if (track?.title) {
                try {
                    const query = track.author ? `${track.author} - ${track.title}` : track.title;
                    const result = await player.search(query, { engine: 'spotify', requester: track.requester || this.client.user });
                    if (result && result.tracks.length) {
                        player.queue.unshift(result.tracks[0]);
                        console.log(`[TrackError] Re-queued via Spotify: "${result.tracks[0].title}"`);
                        player.stop();
                        return;
                    }
                } catch (retryErr) {
                    console.error('[TrackError] Spotify re-search failed:', retryErr.message);
                }
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${this.client.emoji.cross} | Track error — skipping **${track?.title || 'this track'}**.\n-# ${errMsg}`
                ));
            ch?.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});

            if (player.queue.size > 0) {
                player.stop();
            } else {
                const is247 = await this.client.data.get(`${player.guildId}-247`);
                if(is247 === `enabled`) return;
                player.destroy();
            }
        } catch (e) { console.error('[TrackError handler]', e); }
    }
}
module.exports = TrackError;
