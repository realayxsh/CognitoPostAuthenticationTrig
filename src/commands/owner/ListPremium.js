const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class ListPremium extends AvonCommand{
    get name(){ return 'listpremium' }
    get aliases(){ return ['premiumlist','listprem','plists']; }
    async run(client, message, args, prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            let list = [];
            for(let g of client.guilds.cache.values()){
                let data = await client.data3.get(`premium_${g.id}`);
                if(!data) continue;
                let isLifetime = data.expiresAt === null;
                let isActive   = isLifetime || Date.now() < data.expiresAt;
                if(!isActive){ await client.data3.delete(`premium_${g.id}`); continue; }
                let expText = isLifetime
                    ? '`Lifetime`'
                    : `<t:${Math.floor(data.expiresAt/1000)}:R>`;
                list.push(`\`${list.length+1}\` **${g.name}** | \`${g.id}\` | ${g.memberCount} members | Expires: ${expText}`);
            }

            if(list.length === 0){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | No servers have premium active currently.`)
                ]});
            }

            return message.channel.send({embeds: [
                new EmbedBuilder().setColor(`#CC0000`)
                    .setAuthor({name: `| Premium Servers (${list.length})`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(list.join('\n'))
                    .setFooter({text: `Use +revokepremium <server_id> to remove premium`})
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = ListPremium;
