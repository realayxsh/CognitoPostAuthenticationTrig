const delay = require("delay");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

// Max history size — keeps last N song URIs to avoid repeats
const HISTORY_LIMIT = 30;

function getHistory(player) {
    if (!player.data.get('apHistory')) player.data.set('apHistory', []);
    return player.data.get('apHistory');
}

function addToHistory(player, track) {
    const history = getHistory(player);
    const id = track.uri || track.title;
    if (!history.includes(id)) {
        history.push(id);
        if (history.length > HISTORY_LIMIT) history.shift();
    }
    player.data.set('apHistory', history);
}

function filterNew(tracks, player) {
    const history = getHistory(player);
    return tracks.filter(t => {
        const id = t.uri || t.title;
        return !history.includes(id);
    });
}

class PlayerEmpty extends AvonClientEvent{
    get name(){ return 'playerEmpty'; }
    async run(player){
        let data = await this.client.data.get(`${player.guildId}-247`);
        if(!data || data === null) this.client.data.set(`${player.guildId}-247`, `disabled`);
        const is247 = data === `enabled`;

        let db = await this.client.data.get(`${player.guildId}-autoPlay`);
        if(!db || db === null) this.client.data.set(`${player.guildId}-autoPlay`, `disabled`);

        if(db === `enabled`){
            try {
                const prev = player.data.get('previousTrack') || player.queue.previous;
                const title  = prev?.title  || '';
                const author = prev?.author || '';

                // Add the last played track to history so it doesn't repeat
                if (prev) addToHistory(player, prev);

                // Build multiple query strategies — rotate so each autoplay pick
                // uses a different angle but stays in the same genre/language.
                const queries = [];
                if (author && title) {
                    queries.push(`${author} - ${title} radio`);   // most specific
                    queries.push(`${author} mix`);                  // same artist variety
                    queries.push(`${title} similar songs`);         // title-based related
                }
                if (author) queries.push(`${author} songs`);
                if (title)  queries.push(`${title} mix`);
                queries.push('popular songs');                      // last-resort fallback

                // Rotate query index so repeated autoplay doesn't always use the same query
                const qIdx = (player.data.get('apQueryIdx') || 0) % queries.length;
                player.data.set('apQueryIdx', qIdx + 1);
                const query = queries[qIdx];

                // Try YouTube Music first, then plain YouTube as fallback
                // Valid Kazagumo engine names: 'youtube_music', 'youtube', 'soundcloud'
                const engines = ['youtube_music', 'youtube'];
                let picked = null;

                for (const engine of engines) {
                    try {
                        const result = await player.search(query, { engine, requester: this.client.user });
                        if (!result || !result.tracks.length) continue;

                        // Filter out songs already played this session
                        const fresh = filterNew(result.tracks, player);
                        const pool = fresh.length ? fresh : result.tracks.filter(t => {
                            const id = t.uri || t.title;
                            const prev_id = prev ? (prev.uri || prev.title) : null;
                            return id !== prev_id; // at minimum avoid exact same song
                        });

                        if (pool.length) {
                            // Pick randomly from up to first 8 results for variety
                            picked = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
                            break;
                        }
                    } catch(e) { console.error(`[Autoplay][${engine}]`, e); }
                }

                if (picked) {
                    player.queue.add(picked);
                    player.play();
                    return;
                }
            } catch(e) { console.error('[Autoplay]', e); }
        }

        if(db !== `enabled` && !is247){
            let ch = this.client.channels.cache.get(player.textId);
            if(!ch) ch = await this.client.channels.fetch(player.textId).catch(() => null);
            let guild = this.client.guilds.cache.get(player.guildId);
            if(ch){
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Queue Concluded**`))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild?.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
                    );
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://top.gg/bot/1097475016880304180/vote`).setLabel(`Vote`)
                );
                ch.send({ flags: [MessageFlags.IsComponentsV2], components: [container, row] }).catch(() => {});
            }
        }

        if(is247) return;

        await delay(180000);
        let activePlayer = this.client.poru.players.get(player.guildId);
        if(!activePlayer) return;
        if(activePlayer.isPlaying || activePlayer.queue.size > 0 || activePlayer.queue.current) return;
        activePlayer.destroy().catch(() => {});
        let ch = this.client.channels.cache.get(player.textId);
        if(!ch){
            let channel = await this.client.channels.fetch(player.textId).catch(() => null);
            if(!channel) return;
            else ch = channel;
        }
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${this.client.emoji.cross} | Enable 247 mode of **${this.client.user.username}** to keep me in the voice channel.`
            ));
        ch.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = PlayerEmpty;
