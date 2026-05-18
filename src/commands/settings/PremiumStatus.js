const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class PremiumStatus extends AvonCommand{
    get name(){
        return 'premium'
    }
    get aliases(){
        return ['premiumstatus','prem'];
    }
    async run(client,message,args,prefix){
        try{
            let isPremium = await client.data3.get(`premium_${message.guild.id}`);
            if(isPremium){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(`#FFD700`)
                        .setAuthor({name: `| Premium Status`, iconURL: message.guild.iconURL({dynamic: true})})
                        .setDescription(`✅ **${message.guild.name}** has **Premium** active!\n\nAll filters are unlocked and available.`)
                        .setThumbnail(message.guild.iconURL({dynamic: true}))
                ]});
            } else {
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setAuthor({name: `| Premium Status`, iconURL: message.guild.iconURL({dynamic: true})})
                        .setDescription(`❌ **${message.guild.name}** does not have **Premium**.\n\nAsk the bot owner for a premium code, then use \`${prefix}redeem <code>\` to activate it.`)
                ]});
            }
        } catch(e){ console.log(e) }
    }
}
module.exports = PremiumStatus;
