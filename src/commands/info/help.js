const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SelectMenuBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Help extends AvonCommand{
    get name(){ return 'help'; }
    get aliases(){ return 'h'; }
    get cat(){ return 'info'; }
    async run(client, message, args, prefix){
        try{
            let musicCmds   = client.AvonCommands.commands.filter(x => x.cat && x.cat === `music`);
            let filterCmds  = client.AvonCommands.commands.filter(x => x.cat && x.cat === `filters`);
            let setCmds     = client.AvonCommands.commands.filter(x => x.cat && x.cat === `set`);
            let infoCmds    = client.AvonCommands.commands.filter(x => x.cat && x.cat === `info`);
            let premCmds    = client.AvonCommands.commands.filter(x => x.cat && x.cat === `premium`);

            let em = new EmbedBuilder().setColor(client.config.color)
                .setAuthor({name: `${client.user.username} HelpDesk`, iconURL: client.user.displayAvatarURL()})
                .setDescription(
                    `Hey ${message.author} I am ${client.user.username}\n` +
                    `${client.emoji.arrow} A complete Music Bot for your server\n` +
                    `${client.emoji.arrow} Providing you the best quality music\n\n` +
                    `${client.emoji.arrow} [Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands) | [Support](${client.config.server}) | [Vote](https://top.gg/bot/1097475016880304180/vote)`
                )
                .addFields({
                    name: `Command Categories`,
                    value:
                        `${client.emoji.music} \`:\` Music\n` +
                        `${client.emoji.filters} \`:\` Filters\n` +
                        `${client.emoji.settings} \`:\` Settings\n` +
                        `${client.emoji.info} \`:\` Information\n` +
                        `${client.emoji.premium} \`:\` Premium\n` +
                        `${client.emoji.allCommands} \`:\` All Commands`
                })
                .setFooter({text: `Developed By Radio Development`, iconURL: message.guild.iconURL({dynamic: true})})
                .setThumbnail(message.author.displayAvatarURL({dynamic: true}));

            let em6 = new EmbedBuilder().setColor(`#CC0000`)
                .setAuthor({name: `| Premium Commands`, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setDescription(
                    `**Premium** unlocks all audio filters for your server!\n\n` +
                    `Contact the bot owner to receive a premium code, then use \`${prefix}redeem <code>\` to activate it.`
                )
                .addFields(
                    {
                        name: `__Premium Commands__ [${premCmds.size}]`,
                        value: premCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'
                    },
                    {
                        name: `__What Premium Unlocks__`,
                        value:
                            `${client.emoji.filters} BassBoost, Nightcore, 8D, China\n` +
                            `${client.emoji.filters} Chipmunk, Slowmode, Treble Bass\n` +
                            `${client.emoji.filters} Tremolo, Vaporwave, Vibrato\n` +
                            `${client.emoji.filters} Clear All Filters`
                    }
                )
                .setFooter({text: `Use ${prefix}premium to check your server's premium status`});

            let em1 = new EmbedBuilder().setColor(client.config.color)
                .addFields({name: `__Music Commands__ [${musicCmds.size}]`, value: musicCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'});

            let em2 = new EmbedBuilder().setColor(client.config.color)
                .addFields({name: `__Filter Commands__ [${filterCmds.size}]`, value: filterCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'});

            let em3 = new EmbedBuilder().setColor(client.config.color)
                .setAuthor({name: `| Settings Commands`, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .addFields(
                    {
                        name: `__Settings__ [${setCmds.size}]`,
                        value: setCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'
                    },
                    {
                        name: `__Details__`,
                        value:
                            `\`${prefix}setprefix <prefix>\` — Change server prefix\n` +
                            `\`${prefix}247\` — Toggle 24/7 voice mode\n` +
                            `\`${prefix}autoplay\` — Toggle autoplay mode`
                    }
                )
                .setFooter({text: `Use ${prefix}help for main menu`});

            let em4 = new EmbedBuilder().setColor(client.config.color)
                .addFields({name: `__Information Commands__ [${infoCmds.size}]`, value: infoCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'});

            let em5 = new EmbedBuilder().setColor(client.config.color)
                .addFields([
                    {name: `__Premium Commands__ [${premCmds.size}]`,     value: premCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'},
                    {name: `__Music Commands__ [${musicCmds.size}]`,      value: musicCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'},
                    {name: `__Filter Commands__ [${filterCmds.size}]`,    value: filterCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'},
                    {name: `__Settings Commands__ [${setCmds.size}]`,     value: setCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'},
                    {name: `__Information Commands__ [${infoCmds.size}]`, value: infoCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'},
                ])
                .setThumbnail(message.author.displayAvatarURL({dynamic: true}))
                .setFooter({text: `Developed By Radio Development`, iconURL: message.guild.iconURL({dynamic: true})});

            // Buttons — Music, Filters, Settings, Info, Premium in row 1 | All Commands in row 2
            let b1 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m1`).setEmoji(client.emoji.music);
            let b2 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m2`).setEmoji(client.emoji.filters);
            let b3 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m3`).setEmoji(client.emoji.settings);
            let b4 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m4`).setEmoji(client.emoji.info);
            let b6 = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`m6`);
            if(client.emoji.premium) b6.setEmoji(client.emoji.premium); else b6.setLabel(`Premium`);
            let b5 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m5`).setEmoji(client.emoji.allCommands);
            let ro  = new ActionRowBuilder().addComponents(b1, b2, b3, b4, b6);
            let ro3 = new ActionRowBuilder().addComponents(b5);

            // Select menu — same order as categories
            let select = new SelectMenuBuilder().setCustomId(`ok`).setPlaceholder(`❯ ${client.user.username} is Love`).addOptions([
                {label: `Help Home`,    emoji: `${client.emoji.home}`,        value: `ok1`},
                {label: `Music`,        emoji: `${client.emoji.music}`,       value: `ok2`},
                {label: `Filters`,      emoji: `${client.emoji.filters}`,     value: `ok3`},
                {label: `Settings`,     emoji: `${client.emoji.settings}`,    value: `ok4`},
                {label: `Information`,  emoji: `${client.emoji.info}`,        value: `ok5`},
                {label: `Premium`,      emoji: client.emoji.premium || `🎵`,  value: `ok7`},
                {label: `All Commands`, emoji: `${client.emoji.allCommands}`, value: `ok6`},
            ]);
            let ro2 = new ActionRowBuilder().addComponents(select);

            let msg = await message.channel.send({embeds: [em], components: [ro, ro3, ro2]});

            let call = await msg.createMessageComponentCollector({
                filter: (o) => {
                    if(o.user.id === message.author.id) return true;
                    else return o.reply({content: `${client.emoji.cross} | This is not your session, run \`${prefix}help\` instead.`, ephemeral: true});
                },
                time: 50000,
            });

            call.on('collect', async (int) => {
                if(int.isButton()){
                    if(int.customId === `m6`) return int.update({embeds: [em6]});
                    if(int.customId === `m1`) return int.update({embeds: [em1]});
                    if(int.customId === `m2`) return int.update({embeds: [em2]});
                    if(int.customId === `m3`) return int.update({embeds: [em3]});
                    if(int.customId === `m4`) return int.update({embeds: [em4]});
                    if(int.customId === `m5`) return int.update({embeds: [em5]});
                }
                if(int.isSelectMenu()){
                    for(const value of int.values){
                        if(value === `ok1`) return int.update({embeds: [em]});
                        if(value === `ok7`) return int.update({embeds: [em6]});
                        if(value === `ok2`) return int.update({embeds: [em1]});
                        if(value === `ok3`) return int.update({embeds: [em2]});
                        if(value === `ok4`) return int.update({embeds: [em3]});
                        if(value === `ok5`) return int.update({embeds: [em4]});
                        if(value === `ok6`) return int.update({embeds: [em5]});
                    }
                }
            });

            call.on('end', async () => {
                if(!msg) return;
                msg.edit({embeds: [em], components: [], content: `${client.emoji.info} | Help timed out. Run \`${prefix}help\` again.`});
            });
        } catch(e){ console.log(e); }
    }
}
module.exports = Help;
