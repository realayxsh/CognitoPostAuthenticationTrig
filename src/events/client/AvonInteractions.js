const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonClientEvents = require(`../../structures/Eventhandler`);
const { Api } = require(`@top-gg/sdk`);
const config = require(`../../../config.json`);
const voteApi = new Api(process.env.topggapi || config.topggapi);

// ── Vote cache: TTL 5 minutes, gracefully handles missing/invalid API token ──
const _voteCache = new Map();
const VOTE_TTL = 5 * 60 * 1000;
async function hasVoted(userId) {
    const entry = _voteCache.get(userId);
    if (entry && Date.now() < entry.expires) return entry.voted;
    try {
        const voted = await voteApi.hasVoted(userId);
        _voteCache.set(userId, { voted, expires: Date.now() + VOTE_TTL });
        return voted;
    } catch (e) {
        return true; // API unavailable — don't block users
    }
}

// ── Premium cache: TTL 2 minutes per guild ──
const _premCache = new Map();
const PREM_TTL = 2 * 60 * 1000;
async function isPremium(client, guildId) {
    const entry = _premCache.get(guildId);
    if (entry && Date.now() < entry.expires) return entry.active;
    const premData = await client.data3.get(`premium_${guildId}`);
    const active = !!(premData && (premData.expiresAt === null || Date.now() < premData.expiresAt));
    if (premData && !active) { client.data3.delete(`premium_${guildId}`); }
    _premCache.set(guildId, { active, expires: Date.now() + PREM_TTL });
    return active;
}

const cv2 = (text, ephemeral = false) => ({
    flags: ephemeral ? [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] : [MessageFlags.IsComponentsV2],
    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(text))]
});

class AvonInteractions extends AvonClientEvents{
    get name(){ return 'interactionCreate'; }
    async run(interaction){

        if(interaction.isButton()){
            try{
                let player = this.client.poru.players.get(interaction.guild.id);
                if(interaction.customId === `pl1`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    player.destroy(); return;
                }
                if(interaction.customId === `pl2`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    let but1 = new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(`Stop`).setCustomId(`pl1`);
                    let but2 = new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel(!player.paused ? `Resume` : `Pause`).setCustomId(`pl2`);
                    let but3 = new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel(`Loop`).setCustomId(`pl3`);
                    let but4 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Previous`).setCustomId(`pl4`);
                    let but5 = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Skip`).setCustomId(`pl5`);
                    let ro = new ActionRowBuilder().addComponents(but1, but2, but3, but4, but5);
                    player.pause(!player.paused);
                    return interaction.update({ components: [ro] });
                }
                if(interaction.customId === `pl3`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(player.loop === `queue`){
                        player.setLoop(`none`);
                        return interaction.reply(cv2(`${this.client.emoji.cross} | **Disabled** Looping`, true));
                    } else {
                        player.setLoop(`queue`);
                        return interaction.reply(cv2(`${this.client.emoji.tick} | **Enabled** Looping`, true));
                    }
                }
                if(interaction.customId === `pl4`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!player.queue.previous || player.queue.previous === null)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | No previous song available.`, true));
                    player.queue.unshift(player.queue.previous); player.skip();
                    return interaction.reply(cv2(`${this.client.emoji.tick} | Playing previous track`, true));
                }
                if(interaction.customId === `pl5`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete();
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    player.skip();
                    return interaction.reply(cv2(`${this.client.emoji.tick} | **Skipped** the track`, true));
                }
            } catch(e){ console.log(e) }
        }

        if(interaction.isStringSelectMenu() && interaction.customId === 'filter_select'){
            try {
                const player = this.client.poru.players.get(interaction.guild.id);
                if(!player || !player.queue.current)
                    return interaction.reply(cv2(`${this.client.emoji.cross} | Nothing is playing right now.`, true));
                if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                    return interaction.reply(cv2(`${this.client.emoji.cross} | You must be in the same voice channel as me.`, true));

                const selected = interaction.values[0];

                // ── Premium gate — 'none' (clear filters) is always allowed ──
                if(selected !== 'none' && !this.client.config.owners.includes(interaction.user.id)){
                    const active = await isPremium(this.client, interaction.guild.id);
                    if(!active){
                        return interaction.reply({
                            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                            components: [new ContainerBuilder()
                                .addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                            `**| Premium Required**\n\n` +
                                            `${this.client.emoji.cross} | Filters are **Premium Only!**\n\n` +
                                            `Ask the bot owner for a premium code and use \`+redeem <code>\` to activate premium for this server.\n\n` +
                                            `Check your status with \`+premium\``
                                        ))
                                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ dynamic: true })))
                                )
                            ]
                        });
                    }
                }

                const reply = (text) => interaction.reply(cv2(text, true));

                const CLARITY_EQ = [
                    { band: 0,  gain: -0.05 }, { band: 1,  gain: -0.05 }, { band: 2,  gain:  0.0  },
                    { band: 3,  gain:  0.02 }, { band: 4,  gain:  0.04 }, { band: 5,  gain:  0.02 },
                    { band: 6,  gain:  0.0  }, { band: 7,  gain:  0.0  }, { band: 8,  gain:  0.06 },
                    { band: 9,  gain:  0.06 }, { band: 10, gain:  0.04 }, { band: 11, gain:  0.02 },
                    { band: 12, gain:  0.0  }, { band: 13, gain:  0.0  },
                ];

                await player.shoukaku.clearFilters();
                player.data.set('8d',false); player.data.set('bass',false); player.data.set('night',false);
                player.data.set('vib',false); player.data.set('trem',false); player.data.set('treble',false);
                player.data.set('slow',false); player.data.set('chip',false); player.data.set('china',false);
                player.data.set('vapor',false);

                const em = this.client.emoji;
                if(selected === 'none'){
                    await player.shoukaku.setFilters({ equalizer: CLARITY_EQ }).catch(() => {});
                    return reply(`${em.filter_none} **Cleared all filters**`);
                }
                if(selected === '8d'){
                    await player.shoukaku.setFilters({ rotation:{ rotationHz:0.2 } });
                    player.data.set('8d',true);
                    return reply(`${em.filter_8d} **Enabled 8D**`);
                }
                if(selected === 'bassboost'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.10},{band:1,gain:0.10},{band:2,gain:0.05},{band:3,gain:0.05},{band:4,gain:-0.05},{band:5,gain:-0.05},{band:6,gain:0},{band:7,gain:-0.05},{band:8,gain:-0.05},{band:9,gain:0},{band:10,gain:0.05},{band:11,gain:0.05},{band:12,gain:0.10},{band:13,gain:0.10}] });
                    player.data.set('bass',true);
                    return reply(`${em.filter_bassboost} **Enabled Bass Boost**`);
                }
                if(selected === 'nightcore'){
                    await player.shoukaku.setFilters({ timescale:{ speed:1.1, pitch:1.125, rate:1.05 } });
                    player.data.set('night',true);
                    return reply(`${em.filter_nightcore} **Enabled Nightcore**`);
                }
                if(selected === 'vibrato'){
                    await player.shoukaku.setFilters({ vibrato:{ frequency:4.0, depth:0.75 } });
                    player.data.set('vib',true);
                    return reply(`${em.filter_vibrato} **Enabled Vibrato**`);
                }
                if(selected === 'tremolo'){
                    await player.shoukaku.setFilters({ tremolo:{ frequency:4.0, depth:0.75 } });
                    player.data.set('trem',true);
                    return reply(`${em.filter_tremolo} **Enabled Tremolo**`);
                }
                if(selected === 'treblebass'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.6},{band:1,gain:0.67},{band:2,gain:0.67},{band:3,gain:0},{band:4,gain:-0.5},{band:5,gain:0.15},{band:6,gain:-0.45},{band:7,gain:0.23},{band:8,gain:0.35},{band:9,gain:0.45},{band:10,gain:0.55},{band:11,gain:0.6},{band:12,gain:0.55},{band:13,gain:0}] });
                    player.data.set('treble',true);
                    return reply(`${em.filter_treblebass} **Enabled Treblebass**`);
                }
                if(selected === 'slowmode'){
                    await player.shoukaku.setFilters({ timescale:{ speed:0.5, pitch:1.0, rate:0.8 } });
                    player.data.set('slow',true);
                    return reply(`${em.filter_slowmode} **Enabled Slowmode**`);
                }
                if(selected === 'chipmunk'){
                    await player.shoukaku.setFilters({ timescale:{ speed:1.05, pitch:1.35, rate:1.25 } });
                    player.data.set('chip',true);
                    return reply(`${em.filter_chipmunk} **Enabled Chipmunk**`);
                }
                if(selected === 'china'){
                    await player.shoukaku.setFilters({ timescale:{ speed:0.75, pitch:1.25, rate:1.25 } });
                    player.data.set('china',true);
                    return reply(`${em.filter_china} **Enabled China**`);
                }
                if(selected === 'vaporwave'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0},{band:1,gain:0},{band:2,gain:0},{band:3,gain:0},{band:4,gain:0},{band:5,gain:0},{band:6,gain:0},{band:7,gain:0},{band:8,gain:0.15},{band:9,gain:0.15},{band:10,gain:0.15},{band:11,gain:0.15},{band:12,gain:0.15},{band:13,gain:0.15}], timescale:{ pitch:0.55 } });
                    player.data.set('vapor',true);
                    return reply(`${em.filter_vaporwave} **Enabled Vaporwave**`);
                }
            } catch(e){ console.log(e); }
        }

        if(interaction.isChatInputCommand()){
            try{
                await interaction.deferReply({ flags: [MessageFlags.IsComponentsV2] });
                const client = this.client;
                const commandName = interaction.commandName;
                const avonCommand = client.AvonCommands.commands.get(commandName) || client.AvonCommands.commands.find(c => c.aliases && c.aliases.includes(commandName));
                if(!avonCommand) return interaction.editReply(cv2(`Command not found.`));

                let prefix = await client.data.get(`${interaction.guild.id}-prefix`) || client.config.prefix;

                let args = [];
                let subcommand = null;
                try { subcommand = interaction.options.getSubcommand(false); } catch(e){}
                if(subcommand){
                    const subOpts = interaction.options.data[0]?.options || [];
                    args = [subcommand, ...subOpts.map(opt => String(opt.value))];
                } else {
                    args = interaction.options.data.map(opt => String(opt.value));
                }

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
                    channel: { id: interaction.channelId, send: sendFn, name: interaction.channel?.name || 'unknown' },
                    reply: sendFn,
                    mentions: { members: { first: () => resolvedMember } }
                };

                if(avonCommand.inVoice){
                    if(interaction.guild.members.me.voice.channel && !interaction.member.voice.channel)
                        return interaction.editReply(cv2(`${client.emoji.cross} | You must be connected to a voice channel.`));
                }
                if(avonCommand.sameVoice){
                    if(interaction.guild.members.me.voice.channelId !== interaction.member.voice?.channelId && interaction.guild.members.me.voice.channel)
                        return interaction.editReply(cv2(`${client.emoji.cross} | You must be connected to ${interaction.guild.members.me.voice.channel}`));
                }

                // ── Run vote + premium checks in parallel ──
                const isOwner      = client.config.owners.includes(interaction.user.id);
                const needsVote    = !!avonCommand.vote    && !isOwner;
                const needsPremium = !!avonCommand.premium && !isOwner;

                const [voted, active] = await Promise.all([
                    needsVote    ? hasVoted(interaction.user.id)              : Promise.resolve(true),
                    needsPremium ? isPremium(client, interaction.guild.id)    : Promise.resolve(true),
                ]);

                if(needsVote && !voted){
                    return interaction.editReply({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [
                            new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                `${client.emoji.tick} | **[Vote](https://top.gg/bot/1097475016880304180/vote) Required** — Click [here](https://top.gg/bot/1097475016880304180/vote) to vote!`
                            )),
                            new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote on Top.gg`).setURL(`https://top.gg/bot/1097475016880304180/vote`))
                        ]
                    });
                }

                if(needsPremium && !active){
                    return interaction.editReply({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                        `**| Premium Required**\n\n` +
                                        `${client.emoji.cross} | This command is **Premium Only!**\n\n` +
                                        `Use \`/redeem <code>\` to activate premium for this server.`
                                    ))
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ dynamic: true })))
                            )
                        ]
                    });
                }

                let player = client.poru.players.get(interaction.guild.id);
                if(avonCommand.player){
                    if(!player || !player.queue.current){
                        return interaction.editReply({
                            flags: [MessageFlags.IsComponentsV2],
                            components: [new ContainerBuilder()
                                .addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| I am not playing anything**`))
                                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ dynamic: true })))
                                )
                            ]
                        });
                    }
                }

                await avonCommand.run(client, fakeMessage, args, prefix, player);
            } catch(e){ console.log('[SlashError]', e.message); try{ interaction.editReply(cv2(`An error occurred: ${e.message}`)); } catch(_){} }
        }
    }
}
module.exports = AvonInteractions;
