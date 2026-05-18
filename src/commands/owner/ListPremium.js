const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class ListPremium extends AvonCommand{
    get name(){
        return 'listpremium'
    }
    get aliases(){
        return ['premiumlist','listprem','plists'];
    }
    async run(client,message,args,prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            let premiumGuilds = [];
            client.guilds.cache.forEach(async g => {
                let isPremium = await client.data.get(`premium_${g.id}`);
                if(isPremium) premiumGuilds.push(g);
            });

            // Wait a moment for async gets to complete
            await new Promise(res => setTimeout(res, 1500));

            let list = [];
            for(let g of client.guilds.cache.values()){
                let isPremium = await client.data.get(`premium_${g.id}`);
                if(isPremium) list.push(`\`${list.length+1}\` **${g.name}** | \`${g.id}\` | ${g.memberCount} members`);
            }

            if(list.length === 0){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | No servers have premium active currently.`)
                ]});
            }

            return message.channel.send({embeds: [
                new EmbedBuilder().setColor(`#FFD700`)
                    .setAuthor({name: `| Premium Servers (${list.length})`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(list.join('\n'))
                    .setFooter({text: `Use +revokepremium <server_id> to remove premium from a server`})
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = ListPremium;
