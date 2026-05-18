const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class PremiumStatus extends AvonCommand{
    get name(){ return 'premium'; }
    get aliases(){ return ['premiumstatus','prem']; }
    get cat(){ return 'premium'; }
    async run(client, message, args, prefix){
        try{
            let isPremium = await client.data3.get(`premium_${message.guild.id}`);

            let supportBtn = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Support Server`).setURL(client.config.server);
            let redeemBtn = new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId(`redeem_prompt`).setLabel(`Redeem Code`);
            let row = new ActionRowBuilder().addComponents(supportBtn, redeemBtn);

            if(isPremium){
                let activeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Support Server`).setURL(client.config.server)
                );
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(`#FFD700`)
                        .setAuthor({name: `| Premium Status`, iconURL: message.guild.iconURL({dynamic: true})})
                        .setDescription(`${client.emoji.tick} | **${message.guild.name}** has **Premium** active!\n\nAll filters are unlocked and available.`)
                        .setThumbnail(message.guild.iconURL({dynamic: true}))
                        .setFooter({text: 'Thank you for supporting us!'})
                ], components: [activeRow]});
            } else {
                let msg = await message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setAuthor({name: `| Premium Status`, iconURL: message.guild.iconURL({dynamic: true})})
                        .setDescription(
                            `${client.emoji.cross} | **${message.guild.name}** does not have **Premium**.\n\n` +
                            `**Premium Unlocks:**\n` +
                            `${client.emoji.filters} All audio filters (BassBoost, Nightcore, 8D, etc.)\n\n` +
                            `Contact the bot owner to get a premium code, then click **Redeem Code** below or use \`${prefix}redeem <code>\`.`
                        )
                ], components: [row]});

                let collector = msg.createMessageComponentCollector({
                    filter: b => b.user.id === message.author.id,
                    time: 30000
                });
                collector.on('collect', async b => {
                    if(b.customId === 'redeem_prompt'){
                        await b.reply({content: `Use \`${prefix}redeem <your_code>\` to activate premium for this server.`, ephemeral: true});
                    }
                });
                collector.on('end', () => {
                    msg.edit({components: []}).catch(() => {});
                });
            }
        } catch(e){ console.log(e); }
    }
}
module.exports = PremiumStatus;
