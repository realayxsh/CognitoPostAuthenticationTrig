const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, WebhookClient, MessageFlags } = require("discord.js");
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
            const web = new WebhookClient({ url: `https://discord.com/api/webhooks/1504581750251192400/joU7_yYTcNmDZ2VPreJC5yyw7i_VMpO9EcIWG8Fm0brz8_6f8yYr6y0QHBegSDyQTflV` });
            web.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        } catch(e){ console.log(e) }
    }
}
module.exports = AvonGuildCreate;
