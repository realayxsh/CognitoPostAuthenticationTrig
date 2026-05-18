const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class RevokePremium extends AvonCommand{
    get name(){
        return 'revokepremium'
    }
    get aliases(){
        return ['removepremium','remprem','revokeprem'];
    }
    async run(client,message,args,prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            if(!args[0]){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Usage: \`${prefix}revokepremium <server_id>\``)
                ]});
            }

            let guildId = args[0];
            let isPremium = await client.data3.get(`premium_${guildId}`);

            if(!isPremium){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Server \`${guildId}\` does not have premium active.`)
                ]});
            }

            await client.data3.delete(`premium_${guildId}`);

            let guildName = client.guilds.cache.get(guildId)?.name || guildId;

            return message.channel.send({embeds: [
                new EmbedBuilder().setColor(client.config.color)
                    .setAuthor({name: `| Premium Revoked`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(`${client.emoji.tick} | Premium has been **removed** from **${guildName}**.\n\nServer ID: \`${guildId}\``)
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = RevokePremium;
