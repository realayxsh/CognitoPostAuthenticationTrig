const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, WebhookClient, MessageFlags } = require("discord.js");
const config = require('../../../config.json');
const _guildUrl = process.env.guildwebhook || config.guildwebhook || '';
const _guildWeb = _guildUrl ? new WebhookClient({ url: _guildUrl }) : null;
const AvonClientEvent = require(`../../structures/Eventhandler`);

class AvonGuildCreate extends AvonClientEvent{
    get name(){ return 'guildCreate' }
    async run(guild){
        try{
            this.client.data.set(`${guild.id}-247`, `disabled`);
            this.client.data.set(`${guild.id}-autoPlay`, `disabled`);
            this.client.data2.set(`noprefix_${guild.id}`, []);

            let owner = await guild?.fetchOwner();
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**| GUILD JOINED**\n\n` +
                            `**Server Name:** ${guild.name} | **ID:** ${guild.id}\n` +
                            `**Members:** ${guild.memberCount}\n` +
                            `**Created:** <t:${Math.round(guild.createdTimestamp/1000)}:R> | **Joined:** <t:${Math.round(guild.joinedTimestamp/1000)}:R>\n` +
                            `**Owner:** ${guild.members.cache.get(owner.id)?.user.tag || 'Unknown'}\n` +
                            `**Total Servers:** ${this.client.guilds.cache.size}\n` +
                            `**Total Users:** ${this.client.guilds.cache.reduce((a,b) => a + b.memberCount, 0)}`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
                );
            if(_guildWeb) _guildWeb.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
        } catch(e){ console.log(e) }
    }
}
module.exports = AvonGuildCreate;
