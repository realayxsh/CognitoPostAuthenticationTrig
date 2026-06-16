const delay = require("delay");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

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
                const title  = prev?.title  || 'popular music';
                const author = prev?.author || '';

                // Build a query that preserves genre/language context:
                // "Artist Name mix" on YouTube Music surfaces related same-genre tracks
                const query = author
                    ? `${author} - ${title} mix`
                    : `${title} mix`;

                const result = await player.search(query, { engine: 'youtube music', requester: this.client.user });
                if(result && result.tracks.length){
                    // Skip the first result (usually the same song) and pick a random one from the rest
                    const pool = result.tracks.slice(1, 8);
                    const track = pool.length
                        ? pool[Math.floor(Math.random() * pool.length)]
                        : result.tracks[0];
                    player.queue.add(track);
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
