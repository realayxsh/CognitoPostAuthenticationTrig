const { EmbedBuilder, WebhookClient } = require("discord.js");
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

        const users   = await this.client.cluster.broadcastEval(c => c.guilds.cache.filter(x => x.available).reduce((a, g) => a + g.memberCount, 0)).then(r => r.reduce((acc, n) => acc + n, 0)).catch(() => 0);
        const servers = await this.client.cluster.broadcastEval(c => c.guilds.cache.size).then(r => r.reduce((a, b) => a + b, 0)).catch(() => 0);

        if(_guildWeb){
            const embed = new EmbedBuilder()
                .setTitle(`❌ Guild Left`)
                .setColor(0xFF4444)
                .setThumbnail(guild.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL())
                .addFields(
                    { name: `Server`,       value: `${guild.name} (\`${guild.id}\`)`,              inline: false },
                    { name: `Members`,       value: `\`${guild.memberCount}\``,                     inline: true  },
                    { name: `Created`,       value: `<t:${Math.round(guild.createdTimestamp/1000)}:R>`, inline: true },
                    { name: `Total Servers`, value: `\`${servers}\``,                               inline: true  },
                    { name: `Total Users`,   value: `\`${users}\``,                                 inline: true  }
                )
                .setTimestamp();
            _guildWeb.send({ embeds: [embed] }).catch(() => {});
        }
    }
}
module.exports = AvonGuildDelete;
