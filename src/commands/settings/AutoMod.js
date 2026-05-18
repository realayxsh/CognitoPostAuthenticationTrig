const { EmbedBuilder, AutoModerationRuleEventType, AutoModerationRuleTriggerType, AutoModerationActionType, PermissionsBitField } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class AutoMod extends AvonCommand{
    get name(){
        return 'automod'
    }
    get aliases(){
        return ['setupautomod','automodsetup'];
    }
    async run(client,message,args,prefix){
        try{
            if(!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !client.config.owners.includes(message.author.id)){
                return message.channel.send({embeds:[
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | You need **Manage Server** permission to set up AutoMod.`)
                ]});
            }

            if(!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)){
                return message.channel.send({embeds:[
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | I need **Manage Server** permission to set up AutoMod rules.`)
                ]});
            }

            let op = args[0]?.toLowerCase();

            if(!op || op === 'help'){
                return message.channel.send({embeds:[
                    new EmbedBuilder().setColor(client.config.color)
                        .setAuthor({name:'| AutoMod Setup', iconURL: client.user.displayAvatarURL({dynamic:true})})
                        .setDescription(
                            `**Available Options:**\n\n` +
                            `\`${prefix}automod spam\` — Block spam messages\n` +
                            `\`${prefix}automod mentions\` — Block mass mentions\n` +
                            `\`${prefix}automod links\` — Block suspicious links\n` +
                            `\`${prefix}automod all\` — Enable all protections\n` +
                            `\`${prefix}automod list\` — Show active AutoMod rules\n` +
                            `\`${prefix}automod disable\` — Delete all bot AutoMod rules`
                        )
                ]});
            }

            if(op === 'list'){
                let rules = await message.guild.autoModerationRules.fetch();
                let botRules = rules.filter(r => r.creatorId === client.user.id);
                if(botRules.size === 0){
                    return message.channel.send({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.cross} | No AutoMod rules set up by me yet. Use \`${prefix}automod all\` to set up.`)]});
                }
                let list = botRules.map((r,i) => `\`${i+1}\` **${r.name}** — ${r.enabled ? `${client.emoji.tick} Enabled` : `${client.emoji.cross} Disabled`}`);
                return message.channel.send({embeds:[new EmbedBuilder().setColor(`#FFD700`).setAuthor({name:'| Active AutoMod Rules'}).setDescription(list.join('\n'))]});
            }

            if(op === 'disable'){
                if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !client.config.owners.includes(message.author.id)){
                    return message.channel.send({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.cross} | You need **Administrator** permission to disable AutoMod rules.`)]});
                }
                let rules = await message.guild.autoModerationRules.fetch();
                let botRules = rules.filter(r => r.creatorId === client.user.id);
                for(let rule of botRules.values()) await rule.delete();
                return message.channel.send({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.tick} | Deleted **${botRules.size}** AutoMod rule(s) created by me.`)]});
            }

            let created = [];

            if(op === 'spam' || op === 'all'){
                try{
                    await message.guild.autoModerationRules.create({
                        name: '[Bot] Anti-Spam Protection',
                        eventType: AutoModerationRuleEventType.MessageSend,
                        triggerType: AutoModerationRuleTriggerType.Spam,
                        actions: [{type: AutoModerationActionType.BlockMessage, metadata: {customMessage: 'Spam detected and blocked.'}}],
                        enabled: true,
                        reason: `AutoMod setup by ${message.author.tag}`
                    });
                    created.push(`${client.emoji.tick} Anti-Spam Protection`);
                } catch(e){ created.push(`${client.emoji.cross} Spam (already exists or failed)`); }
            }

            if(op === 'mentions' || op === 'all'){
                try{
                    await message.guild.autoModerationRules.create({
                        name: '[Bot] Anti Mass-Mention',
                        eventType: AutoModerationRuleEventType.MessageSend,
                        triggerType: AutoModerationRuleTriggerType.MentionSpam,
                        triggerMetadata: { mentionTotalLimit: 5 },
                        actions: [{type: AutoModerationActionType.BlockMessage, metadata: {customMessage: 'Too many mentions detected.'}}],
                        enabled: true,
                        reason: `AutoMod setup by ${message.author.tag}`
                    });
                    created.push(`${client.emoji.tick} Anti Mass-Mention`);
                } catch(e){ created.push(`${client.emoji.cross} Mentions (already exists or failed)`); }
            }

            if(op === 'links' || op === 'all'){
                try{
                    await message.guild.autoModerationRules.create({
                        name: '[Bot] Suspicious Link Filter',
                        eventType: AutoModerationRuleEventType.MessageSend,
                        triggerType: AutoModerationRuleTriggerType.KeywordPreset,
                        triggerMetadata: { presets: [1] },
                        actions: [{type: AutoModerationActionType.BlockMessage, metadata: {customMessage: 'Suspicious link blocked.'}}],
                        enabled: true,
                        reason: `AutoMod setup by ${message.author.tag}`
                    });
                    created.push(`${client.emoji.tick} Suspicious Link Filter`);
                } catch(e){ created.push(`${client.emoji.cross} Links (already exists or failed)`); }
            }

            return message.channel.send({embeds:[
                new EmbedBuilder().setColor(`#FFD700`)
                    .setAuthor({name:'| AutoMod Setup Complete', iconURL: client.user.displayAvatarURL({dynamic:true})})
                    .setDescription(`**Results:**\n\n${created.join('\n')}\n\nAutoMod rules are now active in **${message.guild.name}**.`)
            ]});
        } catch(e){ console.log(e); message.channel.send({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.cross} | Error: ${e.message}`)]}); }
    }
}
module.exports = AutoMod;
