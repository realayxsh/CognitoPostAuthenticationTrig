const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, WebhookClient, MessageFlags } = require("discord.js");
const config = require('../../../config.json');
const _guildUrl = process.env.guildwebhook || config.guildwebhook || '';
const _guildWeb = _guildUrl ? new WebhookClient({ url: _guildUrl }) : null;
const AvonClientEvent = require("../../structures/Eventhandler");

class AvonGuildDelete extends AvonClientEvent{
    get name(){ return 'guildDelete'; }
    async run(guild){
        this.client.data2.delete(`noprefix_${guild.id}`);
        this.client.data.delete(`${guild.id}-247`);
        this.client.data.delete(`${guild.id}-autoPlay`);

        const users   = await this.client.cluster.broadcastEval(c => c.guilds.cache.filter(x => x.available).reduce((a, g) => a + g.memberCount, 0)).then(r => r.reduce((acc, n) => acc + n, 0));
        const servers = await this.client.cluster.broadcastEval(c => c.guilds.cache.size).then(r => r.reduce((a, b) => a + b, 0));

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `**| GUILD LEFT**\n\n` +
                        `**Server Name:** ${guild.name} | **ID:** ${guild.id}\n` +
                        `**Members:** ${guild.memberCount}\n` +
                        `**Created:** <t:${Math.round(guild.createdTimestamp/1000)}:R>\n` +
                        `**Total Servers:** ${servers}\n` +
                        `**Total Users:** ${users}`
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
            );
        if(_guildWeb) _guildWeb.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
    }
}
module.exports = AvonGuildDelete;
