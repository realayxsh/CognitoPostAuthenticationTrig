const delay = require("delay");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

class PlayerEmpty extends AvonClientEvent{
    get name(){ return 'playerEmpty'; }
    async run(player){
        let db = await this.client.data.get(`${player.guildId}-autoPlay`);
        if(!db || db === null) this.client.data.set(`${player.guildId}-autoPlay`, `disabled`);
        if(db === `enabled`){
            let identifier = player.queue.current?.identifier || player.queue.previous?.identifier;
            const search   = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
            let result     = await player.search(search, { requester: this.client.user });
            player.queue.add(result.tracks[Math.floor(Math.random() * result.tracks.length)]);
            player.play();
        }
        if(db === `disabled`){
            let ch    = this.client.channels.cache.get(player.textId);
            let guild = this.client.guilds.cache.get(player.guildId);
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Queue Concluded**`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild?.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
                );
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://top.gg/bot/1097475016880304180/vote`).setLabel(`Vote`)
            );
            ch?.send({ flags: [MessageFlags.IsComponentsV2], components: [container, row] });
        }
        let data = await this.client.data.get(`${player.guildId}-247`);
        if(!data || data === null) this.client.data.set(`${player.guildId}-247`, `disabled`);
        if(data === `enabled`) return;
        if(data === `disabled`){
            await delay(180000);
            player.destroy();
            let ch = this.client.channels.cache.get(player.textId);
            if(!ch){
                let channel = await this.client.channels.fetch(player.textId);
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
}
module.exports = PlayerEmpty;
