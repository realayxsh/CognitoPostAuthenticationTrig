const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Help extends AvonCommand{
    get name(){ return 'help'; }
    get aliases(){ return ['h']; }
    get cat(){ return 'info'; }
    async run(client, message, args, prefix){
        try{
            let musicCmds  = client.AvonCommands.commands.filter(x => x.cat && x.cat === `music`);
            let filterCmds = client.AvonCommands.commands.filter(x => x.cat && x.cat === `filters`);
            let setCmds    = client.AvonCommands.commands.filter(x => x.cat && x.cat === `set`);
            let infoCmds   = client.AvonCommands.commands.filter(x => x.cat && x.cat === `info`);
            let premCmds   = client.AvonCommands.commands.filter(x => x.cat && x.cat === `premium`);

            const makeMsg = (container) => ({
                flags: [MessageFlags.IsComponentsV2],
                embeds: [],
                components: [container, ro, ro3, ro2]
            });

            const c0 = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**${client.user.username} HelpDesk**\n\n` +
                            `Hey ${message.author} I am **${client.user.username}**\n` +
                            `${client.emoji.arrow} A complete Music Bot for your server\n` +
                            `${client.emoji.arrow} Providing you the best quality music\n\n` +
                            `${client.emoji.arrow} [Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=2184571968&scope=bot%20applications.commands) | [Support](${client.config.server}) | [Vote](https://top.gg/bot/1097475016880304180/vote)`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**Command Categories**\n` +
                    `${client.emoji.music} \`:\` Music\n` +
                    `${client.emoji.filters} \`:\` Filters\n` +
                    `${client.emoji.settings} \`:\` Settings\n` +
                    `${client.emoji.info} \`:\` Information\n` +
                    `${client.emoji.premium} \`:\` Premium\n` +
                    `${client.emoji.allCommands} \`:\` All Commands`
                ))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Developed By Radio Development`));

            const c1 = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**__Music Commands__ [${musicCmds.size}]**\n\n${musicCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}`
                ));

            const c2 = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**__Filter Commands__ [${filterCmds.size}]**\n\n${filterCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}`
                ));

            const c3 = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Settings Commands**`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ dynamic: true })))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**__Settings__ [${setCmds.size}]**\n${setCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n\n` +
                    `**__Details__**\n` +
                    `\`${prefix}setprefix <prefix>\` — Change server prefix\n` +
                    `\`${prefix}247\` — Toggle 24/7 voice mode\n` +
                    `\`${prefix}autoplay\` — Toggle autoplay mode`
                ));

            const c4 = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**__Information Commands__ [${infoCmds.size}]**\n\n${infoCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}`
                ));

            const c5 = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**All Commands**`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**__Premium__ [${premCmds.size}]** — ${premCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n` +
                    `**__Music__ [${musicCmds.size}]** — ${musicCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n` +
                    `**__Filters__ [${filterCmds.size}]** — ${filterCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n` +
                    `**__Settings__ [${setCmds.size}]** — ${setCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n` +
                    `**__Information__ [${infoCmds.size}]** — ${infoCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}`
                ))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Developed By Radio Development`));

            const c6 = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Premium Commands**`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ dynamic: true })))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**Premium** unlocks all audio filters for your server!\n\n` +
                    `Contact the bot owner to receive a premium code, then use \`${prefix}redeem <code>\` to activate it.\n\n` +
                    `**__Premium Commands__ [${premCmds.size}]**\n${premCmds.map(r => `\`${r.name}\``).sort().join(`, `) || 'None'}\n\n` +
                    `**__What Premium Unlocks__**\n` +
                    `${client.emoji.filters} BassBoost, Nightcore, 8D, China\n` +
                    `${client.emoji.filters} Chipmunk, Slowmode, Treble Bass\n` +
                    `${client.emoji.filters} Tremolo, Vaporwave, Vibrato, Clear All\n` +
                    `${client.emoji.filters} Dolby Atmos`
                ))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `-# Use ${prefix}premium to check your server's premium status`
                ));

            let b1 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m1`).setEmoji(client.emoji.music);
            let b2 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m2`).setEmoji(client.emoji.filters);
            let b3 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m3`).setEmoji(client.emoji.settings);
            let b4 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m4`).setEmoji(client.emoji.info);
            let b6 = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`m6`);
            if(client.emoji.premium) b6.setEmoji(client.emoji.premium); else b6.setLabel(`Premium`);
            let b5 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId(`m5`).setEmoji(client.emoji.allCommands);
            let ro  = new ActionRowBuilder().addComponents(b1, b2, b3, b4, b6);
            let ro3 = new ActionRowBuilder().addComponents(b5);

            let select = new StringSelectMenuBuilder().setCustomId(`ok`).setPlaceholder(`❯ ${client.user.username} is Love`).addOptions([
                { label: `Help Home`,    emoji: `${client.emoji.home}`,        value: `ok1` },
                { label: `Music`,        emoji: `${client.emoji.music}`,       value: `ok2` },
                { label: `Filters`,      emoji: `${client.emoji.filters}`,     value: `ok3` },
                { label: `Settings`,     emoji: `${client.emoji.settings}`,    value: `ok4` },
                { label: `Information`,  emoji: `${client.emoji.info}`,        value: `ok5` },
                { label: `Premium`,      emoji: client.emoji.premium || `🎵`,  value: `ok7` },
                { label: `All Commands`, emoji: `${client.emoji.allCommands}`, value: `ok6` },
            ]);
            let ro2 = new ActionRowBuilder().addComponents(select);

            let msg = await message.channel.send(makeMsg(c0));

            let call = msg.createMessageComponentCollector({
                filter: (o) => {
                    if(o.user.id === message.author.id) return true;
                    else return o.reply({ content: `${client.emoji.cross} | This is not your session, run \`${prefix}help\` instead.`, ephemeral: true });
                },
                time: 50000,
            });

            call.on('collect', async (int) => {
                if(int.isButton()){
                    if(int.customId === `m1`) return int.update(makeMsg(c1));
                    if(int.customId === `m2`) return int.update(makeMsg(c2));
                    if(int.customId === `m3`) return int.update(makeMsg(c3));
                    if(int.customId === `m4`) return int.update(makeMsg(c4));
                    if(int.customId === `m5`) return int.update(makeMsg(c5));
                    if(int.customId === `m6`) return int.update(makeMsg(c6));
                }
                if(int.isStringSelectMenu()){
                    for(const value of int.values){
                        if(value === `ok1`) return int.update(makeMsg(c0));
                        if(value === `ok2`) return int.update(makeMsg(c1));
                        if(value === `ok3`) return int.update(makeMsg(c2));
                        if(value === `ok4`) return int.update(makeMsg(c3));
                        if(value === `ok5`) return int.update(makeMsg(c4));
                        if(value === `ok6`) return int.update(makeMsg(c5));
                        if(value === `ok7`) return int.update(makeMsg(c6));
                    }
                }
            });

            call.on('end', async () => {
                if(!msg) return;
                msg.edit({ flags: [MessageFlags.IsComponentsV2], embeds: [], components: [c0] }).catch(() => {});
            });
        } catch(e){ console.log(e); }
    }
}
module.exports = Help;
