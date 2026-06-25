const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

class TrackStuck extends AvonClientEvent {
    get name() { return 'trackStuck'; }
    async run(player, track, data) {
        try {
            const ch = this.client.channels.cache.get(player.textId);
            console.warn(`[TrackStuck] Guild: ${player.guildId} | Track: ${track?.title} | Threshold: ${data?.thresholdMs}ms`);

            // Attempt to re-search the stuck track on Spotify before skipping
            if (track?.title) {
                try {
                    const query = track.author ? `${track.author} - ${track.title}` : track.title;
                    const result = await player.search(`spsearch:${query}`, { requester: track.requester || this.client.user });
                    if (result && result.tracks.length) {
                        player.queue.unshift(result.tracks[0]);
                        console.log(`[TrackStuck] Re-queued via Spotify: "${result.tracks[0].title}"`);
                        player.stop();
                        return;
                    }
                } catch (retryErr) {
                    console.error('[TrackStuck] Spotify re-search failed:', retryErr.message);
                }
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${this.client.emoji.cross} | Track got stuck — skipping **${track?.title || 'this track'}**.`
                ));
            ch?.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});

            if (player.queue.size > 0) {
                player.stop();
            } else {
                const is247 = await this.client.data.get(`${player.guildId}-247`);
                if(is247 === `enabled`) return;
                player.destroy();
            }
        } catch (e) { console.error('[TrackStuck handler]', e); }
    }
}
module.exports = TrackStuck;
