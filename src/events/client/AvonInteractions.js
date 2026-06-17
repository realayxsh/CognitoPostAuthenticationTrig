const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require("discord.js");
const ms = require('ms');
const AvonClientEvents = require(`../../structures/Eventhandler`);
const { Api } = require(`@top-gg/sdk`);
const config = require(`../../config.js`);
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

const FILTER_OPTIONS = [
    { label: `None (Clear Filters)`, value: `none`,        desc: `Remove all active filters`,      key: `filter_none`       },
    { label: `8D`,                   value: `8d`,          desc: `Rotating 8D audio effect`,       key: `filter_8d`         },
    { label: `Bass Boost`,           value: `bassboost`,   desc: `Boost the bass frequencies`,     key: `filter_bassboost`  },
    { label: `Nightcore`,            value: `nightcore`,   desc: `Faster speed and higher pitch`,  key: `filter_nightcore`  },
    { label: `Vibrato`,              value: `vibrato`,     desc: `Oscillating pitch effect`,       key: `filter_vibrato`    },
    { label: `Tremolo`,              value: `tremolo`,     desc: `Oscillating volume effect`,      key: `filter_tremolo`    },
    { label: `Treblebass`,           value: `treblebass`,  desc: `Boost both treble and bass`,     key: `filter_treblebass` },
    { label: `Slowmode`,             value: `slowmode`,    desc: `Slower speed, lower pitch`,      key: `filter_slowmode`   },
    { label: `Chipmunk`,             value: `chipmunk`,    desc: `High-pitched chipmunk voice`,    key: `filter_chipmunk`   },
    { label: `China`,                value: `china`,       desc: `China-style audio effect`,       key: `filter_china`      },
    { label: `Vaporwave`,            value: `vaporwave`,   desc: `Slowed, lower-pitched vibe`,     key: `filter_vaporwave`  },
    { label: `Dolby Atmos`,          value: `dolbyatmos`,  desc: `Spatial surround sound effect`,  key: `filter_dolbyatmos` },
    { label: `Concert`,              value: `concert`,     desc: `Concert hall reverb effect`,     key: `filter_concert`    },
    { label: `Lofi`,                 value: `lofi`,        desc: `Chill lofi aesthetic`,           key: `filter_lofi`       },
    { label: `Heaven`,               value: `heaven`,      desc: `Angelic high-pitch shimmer`,     key: `filter_heaven`     },
    { label: `Slowed Reverb`,        value: `slowedreverb`,desc: `Slowed + deep reverb`,           key: `filter_slowedreverb`},
];

function buildNowPlayingComponents(client, player) {
    const track = player.queue.current;
    if (!track) return null;
    let url = track.uri || '';
    const duration = ms(track.length || 0);
    const loopOn = player.loop !== 'none';
    const pauseLabel = player.paused ? 'Resume' : 'Pause';
    const requesterAvatar = track.requester?.displayAvatarURL?.({ dynamic: true }) || client.user.displayAvatarURL();
    const container = new ContainerBuilder()
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**| Now Playing**\n\n**[${track.title}](${url})**\nby **${track.author}** — \`${duration}\`\n\n${client.emoji.users} **Requester:** ${track.requester}`
                ))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(requesterAvatar))
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(`Stop`).setCustomId(`pl1`),
            new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel(pauseLabel).setCustomId(`pl2`),
            new ButtonBuilder().setStyle(loopOn ? ButtonStyle.Success : ButtonStyle.Primary).setLabel(loopOn ? `Loop ON` : `Loop`).setCustomId(`pl3`),
            new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Previous`).setCustomId(`pl4`),
            new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Skip`).setCustomId(`pl5`)
        ))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Lyrics`).setCustomId(`pl_lyrics`)
        ))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`filter_select`)
                .setPlaceholder(`Select a filter...`)
                .addOptions(...FILTER_OPTIONS.map(({ label, value, desc, key }) => {
                    const opt = new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(desc);
                    const e = client.emoji[key];
                    if (e) opt.setEmoji(e);
                    return opt;
                }))
        ));
    return { flags: [MessageFlags.IsComponentsV2], components: [container] };
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

                if(interaction.customId === `pl_lyrics`){
                    if(!player || !player.queue.current)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Nothing is playing right now.`, true));
                    const isOwner = this.client.config.owners.includes(interaction.user.id);
                    if(!isOwner){
                        const voted = await hasVoted(interaction.user.id);
                        if(!voted) return interaction.reply({
                            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                            components: [
                                new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `${this.client.emoji.tick} | **Vote Required** — [Click here](https://top.gg/bot/1097475016880304180/vote) to vote and unlock lyrics!`
                                )),
                                new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote on Top.gg`).setURL(`https://top.gg/bot/1097475016880304180/vote`))
                            ]
                        });
                    }
                    await interaction.deferReply({ ephemeral: true });
                    const track = player.queue.current;
                    let artist = track.author || '';
                    let title  = track.title  || '';
                    const clean = (s) => s
                        .replace(/\(.*?(official|video|audio|lyrics|hd|4k|mv|ft\.?|feat\.?).*?\)/gi, '')
                        .replace(/\[.*?(official|video|audio|lyrics|hd|4k|mv|ft\.?|feat\.?).*?\]/gi, '')
                        .trim();
                    title  = clean(title);
                    artist = clean(artist);
                    let lyrics = null;
                    try {
                        const params = new URLSearchParams({ track_name: title, artist_name: artist });
                        const res = await fetch(`https://lrclib.net/api/search?${params}`, { signal: AbortSignal.timeout(6000) });
                        if (res.ok) {
                            const data = await res.json();
                            const hit = data.find(x => x.plainLyrics && x.plainLyrics.trim().length > 20);
                            if (hit) lyrics = hit.plainLyrics.trim();
                        }
                        if (!lyrics) {
                            const params2 = new URLSearchParams({ track_name: title });
                            const res2 = await fetch(`https://lrclib.net/api/search?${params2}`, { signal: AbortSignal.timeout(6000) });
                            if (res2.ok) {
                                const data2 = await res2.json();
                                const hit2 = data2.find(x => x.plainLyrics && x.plainLyrics.trim().length > 20);
                                if (hit2) lyrics = hit2.plainLyrics.trim();
                            }
                        }
                    } catch(e) {}
                    if (!lyrics) {
                        return interaction.editReply(cv2(`${this.client.emoji.cross} | No lyrics found for **${track.title}**.\nTry \`+lyrics Artist - Song Name\` for manual search.`));
                    }
                    const preview = lyrics.length > 1800 ? lyrics.slice(0, 1800) + '\n...' : lyrics;
                    const thumb = track.thumbnail || this.client.user.displayAvatarURL({ dynamic: true });
                    return interaction.editReply({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Lyrics — ${track.title}**\nby **${track.author}**`))
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb))
                            )
                            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(preview))
                        ]
                    });
                }

                const _isOwnerBtn = this.client.config.owners.includes(interaction.user.id);
                const _requesterId = player?.queue?.current?.requester?.id;
                const _isRequester = !_requesterId || interaction.user.id === _requesterId || _isOwnerBtn;

                if(interaction.customId === `pl1`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete().catch(() => {});
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!_isRequester)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));
                    player.destroy(); return;
                }
                if(interaction.customId === `pl2`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete().catch(() => {});
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!_isRequester)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));
                    player.pause(!player.paused);
                    const updatedPause = buildNowPlayingComponents(this.client, player);
                    if(updatedPause) return interaction.update(updatedPause);
                    return interaction.reply(cv2(`${this.client.emoji.tick} | ${player.paused ? 'Paused' : 'Resumed'}`, true));
                }
                if(interaction.customId === `pl3`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete().catch(() => {});
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!_isRequester)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));
                    if(player.loop === `queue`){ player.setLoop(`none`); }
                    else { player.setLoop(`queue`); }
                    const updatedLoop = buildNowPlayingComponents(this.client, player);
                    if(updatedLoop) return interaction.update(updatedLoop);
                    return interaction.reply(cv2(player.loop !== 'none' ? `${this.client.emoji.tick} | **Loop enabled**` : `${this.client.emoji.cross} | **Loop disabled**`, true));
                }
                if(interaction.customId === `pl4`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete().catch(() => {});
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!_isRequester)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));
                    const prevTrack = player.data.get('previousTrack') || player.queue.previous;
                    if(!prevTrack)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | No previous song available.`, true));
                    player.queue.unshift(prevTrack);
                    player.skip();
                    return interaction.reply(cv2(`${this.client.emoji.tick} | Playing previous track`, true));
                }
                if(interaction.customId === `pl5`){
                    if(interaction.message.id !== player.data.get('music').id) return interaction.message.delete().catch(() => {});
                    if(interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | You cannot use this button until you connect to ${interaction.guild.members.me.voice.channel}`, true));
                    if(!_isRequester)
                        return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));
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
                const _isOwnerFilter = this.client.config.owners.includes(interaction.user.id);
                const _filterRequesterId = player.queue.current?.requester?.id;
                if(_filterRequesterId && interaction.user.id !== _filterRequesterId && !_isOwnerFilter)
                    return interaction.reply(cv2(`${this.client.emoji.cross} | Only the song requester can use these controls.`, true));

                const selected = interaction.values[0];

                // Vote-only filters (free with vote, no premium needed)
                const VOTE_ONLY_FILTERS = new Set(['8d', 'bassboost', 'nightcore', 'treblebass', 'tremolo']);
                const isOwner = this.client.config.owners.includes(interaction.user.id);

                if(selected !== 'none' && !isOwner){
                    if(VOTE_ONLY_FILTERS.has(selected)){
                        // Only requires vote
                        const voted = await hasVoted(interaction.user.id);
                        if(!voted){
                            return interaction.reply({
                                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                                components: [
                                    new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                        `${this.client.emoji.tick} | **Vote Required** — [Click here](https://top.gg/bot/1097475016880304180/vote) to vote and unlock this filter!`
                                    )),
                                    new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote on Top.gg`).setURL(`https://top.gg/bot/1097475016880304180/vote`))
                                ]
                            });
                        }
                    } else {
                        // Requires premium
                        const active = await isPremium(this.client, interaction.guild.id);
                        if(!active){
                            return interaction.reply({
                                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                                components: [new ContainerBuilder()
                                    .addSectionComponents(
                                        new SectionBuilder()
                                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                                `**| Premium Required**\n\n` +
                                                `${this.client.emoji.cross} | This filter is **Premium Only!**\n\n` +
                                                `Ask the bot owner for a premium code and use \`+redeem <code>\` to activate premium for this server.\n\n` +
                                                `Check your status with \`+premium\``
                                            ))
                                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ dynamic: true })))
                                    )
                                ]
                            });
                        }
                    }
                }

                const reply = (text) => interaction.reply(cv2(text, true));

                const CLARITY_EQ = [
                    { band: 0,  gain: -0.05 }, { band: 1,  gain:  0.00 }, { band: 2,  gain:  0.03 },
                    { band: 3,  gain:  0.05 }, { band: 4,  gain:  0.04 }, { band: 5,  gain:  0.00 },
                    { band: 6,  gain: -0.03 }, { band: 7,  gain:  0.00 }, { band: 8,  gain:  0.03 },
                    { band: 9,  gain:  0.04 }, { band: 10, gain:  0.04 }, { band: 11, gain:  0.03 },
                    { band: 12, gain:  0.02 }, { band: 13, gain:  0.02 },
                ];

                // Clear all filters and reset all tracking flags
                await player.shoukaku.clearFilters();
                const ALL_FILTER_KEYS = ['8d','bass','night','vib','trem','treble','slow','chip','china','vapor','dolbyatmos','concert','lofi','heaven','slowedreverb'];
                ALL_FILTER_KEYS.forEach(k => player.data.set(k, false));

                const userVol = (player.volume || 100) / 100;
                const em = this.client.emoji;

                // Quality EQ used as base for filters that don't define their own EQ
                const Q_EQ = [
                    {band:0,gain:-0.05},{band:1,gain:0.00},{band:2,gain:0.03},{band:3,gain:0.05},
                    {band:4,gain:0.04},{band:5,gain:0.00},{band:6,gain:-0.03},{band:7,gain:0.00},
                    {band:8,gain:0.03},{band:9,gain:0.04},{band:10,gain:0.04},{band:11,gain:0.03},
                    {band:12,gain:0.02},{band:13,gain:0.02}
                ];

                if(selected === 'none'){
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, volume: userVol });
                    return reply(`${em.filter_none} **Cleared all filters**`);
                }
                if(selected === '8d'){
                    // Pure binaural rotation — this IS the 8D effect, no EQ mixed in
                    await player.shoukaku.setFilters({ rotation:{ rotationHz:0.2 }, volume: userVol });
                    player.data.set('8d',true);
                    return reply(`${em.filter_8d} **Enabled 8D**`);
                }
                if(selected === 'bassboost'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.30},{band:1,gain:0.25},{band:2,gain:0.20},{band:3,gain:0.15},{band:4,gain:0.10},{band:5,gain:0.05},{band:6,gain:0.00},{band:7,gain:-0.02},{band:8,gain:-0.02},{band:9,gain:0.00},{band:10,gain:0.02},{band:11,gain:0.02},{band:12,gain:0.02},{band:13,gain:0.02}], volume: userVol });
                    player.data.set('bass',true);
                    return reply(`${em.filter_bassboost} **Enabled Bass Boost**`);
                }
                if(selected === 'nightcore'){
                    // Q_EQ + speed/pitch up
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, timescale:{ speed:1.1, pitch:1.125, rate:1.05 }, volume: userVol });
                    player.data.set('night',true);
                    return reply(`${em.filter_nightcore} **Enabled Nightcore**`);
                }
                if(selected === 'vibrato'){
                    // Q_EQ + vibrato — moderate values to avoid distortion
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, vibrato:{ frequency:4.0, depth:0.55 }, volume: userVol });
                    player.data.set('vib',true);
                    return reply(`${em.filter_vibrato} **Enabled Vibrato**`);
                }
                if(selected === 'tremolo'){
                    // Q_EQ + tremolo volume pulse
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, tremolo:{ frequency:4.0, depth:0.55 }, volume: userVol });
                    player.data.set('trem',true);
                    return reply(`${em.filter_tremolo} **Enabled Tremolo**`);
                }
                if(selected === 'treblebass'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.40},{band:1,gain:0.35},{band:2,gain:0.25},{band:3,gain:0.00},{band:4,gain:-0.05},{band:5,gain:0.00},{band:6,gain:-0.05},{band:7,gain:0.00},{band:8,gain:0.10},{band:9,gain:0.20},{band:10,gain:0.30},{band:11,gain:0.40},{band:12,gain:0.45},{band:13,gain:0.40}], volume: userVol });
                    player.data.set('treble',true);
                    return reply(`${em.filter_treblebass} **Enabled Treblebass**`);
                }
                if(selected === 'slowmode'){
                    // Q_EQ + slow timescale
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, timescale:{ speed:0.75, pitch:1.0, rate:0.9 }, volume: userVol });
                    player.data.set('slow',true);
                    return reply(`${em.filter_slowmode} **Enabled Slowmode**`);
                }
                if(selected === 'chipmunk'){
                    // Q_EQ + high pitch/speed
                    await player.shoukaku.setFilters({ equalizer: Q_EQ, timescale:{ speed:1.05, pitch:1.35, rate:1.25 }, volume: userVol });
                    player.data.set('chip',true);
                    return reply(`${em.filter_chipmunk} **Enabled Chipmunk**`);
                }
                if(selected === 'china'){
                    // Pentatonic-style EQ + slightly higher pitch + faster rate
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:-0.05},{band:1,gain:-0.03},{band:2,gain:0.00},{band:3,gain:0.10},{band:4,gain:0.15},{band:5,gain:0.10},{band:6,gain:0.00},{band:7,gain:-0.03},{band:8,gain:0.00},{band:9,gain:0.05},{band:10,gain:0.08},{band:11,gain:0.10},{band:12,gain:0.15},{band:13,gain:0.15}], timescale:{ speed:1.0, pitch:1.25, rate:1.15 }, volume: userVol });
                    player.data.set('china',true);
                    return reply(`${em.filter_china} **Enabled China**`);
                }
                if(selected === 'vaporwave'){
                    // Warm bass EQ + slowed + slightly lower pitch (vaporwave aesthetic)
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.15},{band:1,gain:0.12},{band:2,gain:0.08},{band:3,gain:0.04},{band:4,gain:0.00},{band:5,gain:-0.02},{band:6,gain:-0.03},{band:7,gain:-0.02},{band:8,gain:0.00},{band:9,gain:0.02},{band:10,gain:0.03},{band:11,gain:0.03},{band:12,gain:0.02},{band:13,gain:0.00}], timescale:{ speed:0.85, pitch:0.88, rate:0.90 }, volume: userVol });
                    player.data.set('vapor',true);
                    return reply(`${em.filter_vaporwave} **Enabled Vaporwave**`);
                }
                if(selected === 'dolbyatmos'){
                    // Real Dolby Atmos simulation:
                    // - Slight bass lift + presence/air boost for wide open soundstage
                    // - Very slow rotation (0.05 Hz = 1 pass every 20s) for ambient spatial wrap
                    // - Low-pass smoothing to remove harshness and add depth
                    await player.shoukaku.setFilters({
                        equalizer:[
                            {band:0,gain:0.10},{band:1,gain:0.10},{band:2,gain:0.05},{band:3,gain:0.02},
                            {band:4,gain:0.00},{band:5,gain:0.00},{band:6,gain:0.00},{band:7,gain:0.00},
                            {band:8,gain:0.02},{band:9,gain:0.04},{band:10,gain:0.06},{band:11,gain:0.08},
                            {band:12,gain:0.10},{band:13,gain:0.08}
                        ],
                        rotation:{ rotationHz:0.05 },
                        lowPass:{ smoothing:5.0 },
                        volume: userVol
                    });
                    player.data.set('dolbyatmos',true);
                    return reply(`${em.filter_dolbyatmos || '🎧'} **Enabled Dolby Atmos**`);
                }
                if(selected === 'concert'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.06},{band:1,gain:0.08},{band:2,gain:0.10},{band:3,gain:0.08},{band:4,gain:0.05},{band:5,gain:0.03},{band:6,gain:0.02},{band:7,gain:0.03},{band:8,gain:0.05},{band:9,gain:0.07},{band:10,gain:0.06},{band:11,gain:0.04},{band:12,gain:0.02},{band:13,gain:0.01}], lowPass:{ smoothing:8.0 }, tremolo:{ frequency:2.0, depth:0.08 }, volume: userVol });
                    player.data.set('concert',true);
                    return reply(`${em.filters} **Enabled Concert**`);
                }
                if(selected === 'lofi'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.10},{band:1,gain:0.08},{band:2,gain:0.05},{band:3,gain:0.02},{band:4,gain:0.00},{band:5,gain:-0.02},{band:6,gain:-0.03},{band:7,gain:-0.03},{band:8,gain:-0.02},{band:9,gain:-0.01},{band:10,gain:0.00},{band:11,gain:0.00},{band:12,gain:-0.01},{band:13,gain:-0.02}], timescale:{ speed:0.92, pitch:0.97, rate:0.95 }, lowPass:{ smoothing:20.0 }, volume: userVol });
                    player.data.set('lofi',true);
                    return reply(`${em.filters} **Enabled Lofi**`);
                }
                if(selected === 'heaven'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:-0.02},{band:1,gain:0.00},{band:2,gain:0.04},{band:3,gain:0.08},{band:4,gain:0.10},{band:5,gain:0.12},{band:6,gain:0.12},{band:7,gain:0.10},{band:8,gain:0.08},{band:9,gain:0.06},{band:10,gain:0.05},{band:11,gain:0.04},{band:12,gain:0.03},{band:13,gain:0.02}], timescale:{ speed:1.0, pitch:1.15, rate:1.0 }, tremolo:{ frequency:3.5, depth:0.06 }, volume: userVol });
                    player.data.set('heaven',true);
                    return reply(`${em.filters} **Enabled Heaven**`);
                }
                if(selected === 'slowedreverb'){
                    await player.shoukaku.setFilters({ equalizer:[{band:0,gain:0.08},{band:1,gain:0.06},{band:2,gain:0.04},{band:3,gain:0.02},{band:4,gain:0.00},{band:5,gain:-0.01},{band:6,gain:-0.02},{band:7,gain:-0.02},{band:8,gain:0.00},{band:9,gain:0.02},{band:10,gain:0.03},{band:11,gain:0.03},{band:12,gain:0.02},{band:13,gain:0.01}], timescale:{ speed:0.78, pitch:0.88, rate:0.90 }, lowPass:{ smoothing:12.0 }, tremolo:{ frequency:1.5, depth:0.12 }, volume: userVol });
                    player.data.set('slowedreverb',true);
                    return reply(`${em.filters} **Enabled Slowed Reverb**`);
                }
            } catch(e){ console.log(e); }
        }

        if(interaction.isChatInputCommand()){
            try{
                await interaction.deferReply({ flags: [MessageFlags.IsComponentsV2] });
                const client = this.client;
                const commandName = interaction.commandName;

                // ── /filters <filter> — unified filter slash command ──
                if(commandName === 'filters'){
                    const chosen = interaction.options.getString('filter');
                    const player = client.poru.players.get(interaction.guild.id);
                    if(!player || !player.queue.current)
                        return interaction.editReply(cv2(`${client.emoji.cross} | Nothing is playing right now.`));
                    if(interaction.guild.members.me.voice.channel && interaction.member.voice?.channelId !== interaction.guild.members.me.voice.channelId)
                        return interaction.editReply(cv2(`${client.emoji.cross} | You must be in the same voice channel as me.`));

                    const SLASH_VOTE_ONLY = new Set(['8d', 'bassboost', 'nightcore', 'treblebass', 'tremolo']);
                    const isOwner = client.config.owners.includes(interaction.user.id);
                    if(!isOwner && chosen !== 'clearfilters'){
                        if(SLASH_VOTE_ONLY.has(chosen)){
                            const voted = await hasVoted(interaction.user.id);
                            if(!voted) return interaction.editReply({
                                flags: [MessageFlags.IsComponentsV2],
                                components: [
                                    new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                        `${client.emoji.tick} | **Vote Required** — [Click here](https://top.gg/bot/1097475016880304180/vote) to vote and unlock this filter!`
                                    )),
                                    new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote on Top.gg`).setURL(`https://top.gg/bot/1097475016880304180/vote`))
                                ]
                            });
                        } else {
                            const active = await isPremium(client, interaction.guild.id);
                            if(!active) return interaction.editReply(cv2(`${client.emoji.cross} | This filter is **Premium Only!** Use \`+redeem <code>\` to activate.`));
                        }
                    }

                    const filterCmd = client.AvonCommands.commands.get(chosen === 'clearfilters' ? 'clearfilters' : chosen);
                    if(!filterCmd) return interaction.editReply(cv2(`${client.emoji.cross} | Unknown filter.`));

                    let replied = false;
                    const sendFn = async (data) => {
                        if(!replied){ replied = true; return interaction.editReply(data); }
                        return interaction.followUp(data);
                    };
                    const fakeMessage = {
                        guild: interaction.guild,
                        author: interaction.user,
                        member: interaction.member,
                        content: `/${chosen}`,
                        channel: { id: interaction.channelId, send: sendFn, name: interaction.channel?.name || 'unknown' },
                        reply: sendFn,
                        mentions: { members: { first: () => null } }
                    };
                    return await filterCmd.run(client, fakeMessage, [], `+`, player);
                }
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
