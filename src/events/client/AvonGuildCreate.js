const { EmbedBuilder, WebhookClient } = require("discord.js");
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
            if(_guildWeb){
                const embed = new EmbedBuilder()
                    .setTitle(`✅ Guild Joined`)
                    .setColor(0x00FF7F)
                    .setThumbnail(guild.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL())
                    .addFields(
                        { name: `Server`,         value: `${guild.name} (\`${guild.id}\`)`,                           inline: false },
                        { name: `Members`,         value: `\`${guild.memberCount}\``,                                  inline: true  },
                        { name: `Owner`,           value: `${owner?.user?.tag || 'Unknown'} (\`${guild.ownerId}\`)`,  inline: true  },
                        { name: `Created`,         value: `<t:${Math.round(guild.createdTimestamp/1000)}:R>`,          inline: true  },
                        { name: `Total Servers`,   value: `\`${this.client.guilds.cache.size}\``,                      inline: true  },
                        { name: `Total Users`,     value: `\`${this.client.guilds.cache.reduce((a,b) => a + b.memberCount, 0)}\``, inline: true }
                    )
                    .setTimestamp();
                _guildWeb.send({ embeds: [embed] }).catch(() => {});
            }
        } catch(e){ console.log(e) }
    }
}
module.exports = AvonGuildCreate;
