const delay = require("delay");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");
const wh = require('../../structures/webhook');

class PlayerEmpty extends AvonClientEvent{
    get name(){ return 'playerEmpty'; }
    async run(player){
        // Check 247 FIRST so we never show "Queue Concluded" while in 247 mode
        let data = await this.client.data.get(`${player.guildId}-247`);
        if(!data || data === null) this.client.data.set(`${player.guildId}-247`, `disabled`);
        const is247 = data === `enabled`;

        let db = await this.client.data.get(`${player.guildId}-autoPlay`);
        if(!db || db === null) this.client.data.set(`${player.guildId}-autoPlay`, `disabled`);

        if(db === `enabled`){
            try {
                const title = player.queue.previous?.title || player.queue.current?.title || 'popular music';
                const result = await player.search(`${title}`, { engine: 'soundcloud', requester: this.client.user });
                if(result && result.tracks.length){
                    const track = result.tracks[Math.floor(Math.random() * Math.min(result.tracks.length, 5))];
                    player.queue.add(track);
                    player.play();
                    return;
                }
            } catch(e) { console.error('[Autoplay]', e); }
        }

        // Webhook log
        const guild2 = this.client.guilds.cache.get(player.guildId);
        wh.send(new EmbedBuilder()
            .setTitle(`⏹️ Queue Ended`)
            .setColor(0xFF8800)
            .setDescription(`Queue concluded in **${guild2?.name || 'Unknown'}** (\`${player.guildId}\`)`)
            .setTimestamp()
        );

        // Only show "Queue Concluded" if NOT in 247 mode
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

        // If 247 is enabled, just stay silent in the VC — no destroy, no message
        if(is247) return;

        // Not 247: wait 3 minutes then destroy if still idle
        await delay(180000);
        let activePlayer = this.client.poru.players.get(player.guildId);
        if(!activePlayer) return;
        if(activePlayer.isPlaying || activePlayer.queue.size > 0 || activePlayer.queue.current) return;
        activePlayer.destroy();
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
