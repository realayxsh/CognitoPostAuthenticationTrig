const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const AvonClientEvents = require(`../../structures/Eventhandler`);
const { Api } = require(`@top-gg/sdk`);
const config = require(`../../../config.json`);
const vote = new Api(process.env.topggapi || config.topggapi);

class AvonInteractions extends AvonClientEvents{
    get name(){
        return 'interactionCreate';
    }
    async run(interaction){

        if(interaction.isButton()){
            try{
                let player = this.client.poru.players.get(interaction.guild.id);
                if(interaction.customId === `pl1`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | You cannot use this button until connect to ${interaction.guild.members.me.voice.channel}`)],ephemeral:true});
                    player.destroy(); return;
                }
                if(interaction.customId === `pl2`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | You cannot use this button until connect to ${interaction.guild.members.me.voice.channel}`)],ephemeral:true});
                    let but1 = new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(`Stop`).setCustomId(`pl1`);
                    let but2 = new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel(!player.paused ? `Resume` : `Pause`).setCustomId(`pl2`);
                    let but3 = new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel(`Loop`).setCustomId(`pl3`);
                    let but4 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Previous`).setCustomId(`pl4`);
                    let but5 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Skip`).setCustomId(`pl5`);
                    let ro = new ActionRowBuilder().addComponents(but1,but2,but3,but4,but5);
                    player.pause(!player.paused);
                    return interaction.update({components:[ro]});
                }
                if(interaction.customId === `pl3`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | You cannot use this button until connect to ${interaction.guild.members.me.voice.channel}`)],ephemeral:true});
                    if(player.loop === `queue`){ player.setLoop(`none`); return interaction.reply({embeds:[new EmbedBuilder().setDescription(`${this.client.emoji.cross} | **Disabled** Looping`)],ephemeral:true}); }
                    else{ player.setLoop(`queue`); return interaction.reply({embeds:[new EmbedBuilder().setDescription(`${this.client.emoji.tick} | **Enabled** Looping`)],ephemeral:true}); }
                }
                if(interaction.customId === `pl4`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | You cannot use this button until connect to ${interaction.guild.members.me.voice.channel}`)],ephemeral:true});
                    if(!player.queue.previous || player.queue.previous === null)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | No Previous song available.`)],ephemeral:true});
                    player.queue.unshift(player.queue.previous); player.skip();
                    return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.tick} | Playing previous track`)],ephemeral:true});
                }
                if(interaction.customId === `pl5`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.cross} | You cannot use this button until connect to ${interaction.guild.members.me.voice.channel}`)],ephemeral:true});
                    player.skip();
                    return interaction.reply({embeds:[new EmbedBuilder().setColor(this.client.config.color).setDescription(`${this.client.emoji.tick} | **Skipped** the track`)],ephemeral:true});
                }
            } catch(e){ console.log(e) }
        }

        if(interaction.isChatInputCommand()){
            try{
                await interaction.deferReply();
                const client = this.client;
                const commandName = interaction.commandName;
                const avonCommand = client.AvonCommands.commands.get(commandName) || client.AvonCommands.commands.find(c => c.aliases && c.aliases.includes(commandName));
                if(!avonCommand) return interaction.editReply({content: `Command not found.`});

                let prefix = await client.data.get(`${interaction.guild.id}-prefix`) || client.config.prefix;

                // Extract args — handle subcommands too
                let args = [];
                let subcommand = null;
                try { subcommand = interaction.options.getSubcommand(false); } catch(e){}
                if(subcommand){
                    const subOpts = interaction.options.data[0]?.options || [];
                    args = [subcommand, ...subOpts.map(opt => String(opt.value))];
                } else {
                    args = interaction.options.data.map(opt => String(opt.value));
                }

                // Resolve member for commands that need mentions (e.g. noprefix)
                let resolvedMember = null;
                try { resolvedMember = interaction.options.getMember('user') || null; } catch(e){}

                let replied = false;
                const sendFn = async (data) => {
                    if(!replied){ replied = true; return interaction.editReply(data); }
                    return interaction.followUp(data);
                };

                const fakeMessage = {
                    guild: interaction.guild,
                    author: interaction.user,
                    member: interaction.member,
                    content: `/${commandName} ${args.join(' ')}`,
                    channel: {
                        id: interaction.channelId,
                        send: sendFn,
                        name: interaction.channel?.name || 'unknown'
                    },
                    reply: sendFn,
                    mentions: { members: { first: () => resolvedMember } }
                };

                if(avonCommand.inVoice){
                    if(interaction.guild.members.me.voice.channel && !interaction.member.voice.channel){
                        return interaction.editReply({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.cross} | You must be connected to a voice channel.`)]});
                    }
                }
                if(avonCommand.sameVoice){
                    if(interaction.guild.members.me.voice.channelId !== interaction.member.voice?.channelId && interaction.guild.members.me.voice.channel){
                        return interaction.editReply({embeds:[new EmbedBuilder().setColor(client.config.color).setDescription(`${client.emoji.cross} | You must be connected to ${interaction.guild.members.me.voice.channel}`)]});
                    }
                }
                if(avonCommand.vote){
                    let voted = await vote.hasVoted(interaction.user.id);
                    if(!voted && !client.config.owners.includes(interaction.user.id)){
                        return interaction.editReply({embeds:[new EmbedBuilder().setColor(config.color).setDescription(`${client.emoji.tick} | [Vote](https://top.gg/bot/1097475016880304180/vote) Required — Click [here](https://top.gg/bot/1097475016880304180/vote)`)], components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote`).setURL(`https://top.gg/bot/1097475016880304180/vote`))]});
                    }
                }
                if(avonCommand.premium){
                    let premData = await client.data3.get(`premium_${interaction.guild.id}`);
                    let isActive = premData && (premData.expiresAt === null || Date.now() < premData.expiresAt);
                    if(premData && !isActive) await client.data3.delete(`premium_${interaction.guild.id}`);
                    if(!isActive && !client.config.owners.includes(interaction.user.id)){
                        return interaction.editReply({embeds:[new EmbedBuilder().setColor(config.color)
                            .setAuthor({name:`| Premium Required`, iconURL: interaction.user.displayAvatarURL({dynamic:true})})
                            .setDescription(`${client.emoji.cross} | This command is **Premium Only!**\n\nUse \`/redeem <code>\` to activate premium for this server.`)
                        ]});
                    }
                }

                let player = client.poru.players.get(interaction.guild.id);
                if(avonCommand.player){
                    if(!player || !player.queue.current){
                        return interaction.editReply({embeds:[new EmbedBuilder().setColor(client.config.color).setAuthor({name:`| I am not playing Anything`, iconURL: interaction.user.displayAvatarURL({dynamic:true})})]});
                    }
                }

                await avonCommand.run(client, fakeMessage, args, prefix, player);
            } catch(e){ console.log(e); try{ interaction.editReply({content:`An error occurred: ${e.message}`}); } catch(_){} }
        }
    }
}
module.exports = AvonInteractions;
