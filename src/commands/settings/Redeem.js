const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Redeem extends AvonCommand{
    get name(){
        return 'redeem'
    }
    get aliases(){
        return ['activatepremium','redeemcode'];
    }
    async run(client,message,args,prefix){
        try{
            if(!message.member.permissions.has(8n) && !client.config.owners.includes(message.author.id)){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Only server administrators can redeem a premium code.`)
                ]});
            }

            if(!args[0]){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Usage: \`${prefix}redeem <code>\``)
                ]});
            }

            let alreadyPremium = await client.data.get(`premium_${message.guild.id}`);
            if(alreadyPremium){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.tick} | This server already has **Premium** active!`)
                ]});
            }

            let code = args[0].toUpperCase();
            let codes = await client.data.get(`premium_codes`) || [];

            if(!codes.includes(code)){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Invalid or already used code. Please check the code and try again.`)
                ]});
            }

            let remaining = codes.filter(c => c !== code);
            await client.data.set(`premium_codes`, remaining);
            await client.data.set(`premium_${message.guild.id}`, true);

            return message.channel.send({embeds: [
                new EmbedBuilder().setColor(`#FFD700`)
                    .setAuthor({name: `| Premium Activated!`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(`🎉 **${message.guild.name}** now has **Premium** access!\n\nAll filters and premium features are now unlocked for this server.`)
                    .setThumbnail(message.guild.iconURL({dynamic: true}))
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = Redeem;
