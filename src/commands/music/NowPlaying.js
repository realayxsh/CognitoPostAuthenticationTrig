const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require("@discordjs/builders");
const AvonCommand = require("../../structures/avonCommand");
const { getServerBrand } = require("../../structures/serverBrand");
const ms = require("ms");

const FILTERS = [
    { label: '8D',           value: '8d',           description: 'Rotating 8D audio effect',         key: '8d',           emoji: '🎧' },
    { label: 'Bass Boost',   value: 'bassboost',     description: 'Boost the bass frequencies',       key: 'bass',         emoji: '🔊' },
    { label: 'China',        value: 'china',         description: 'China-style audio effect',         key: 'china',        emoji: '🎵' },
    { label: 'Chipmunk',     value: 'chipmunk',      description: 'High-pitched chipmunk voice',      key: 'chipmunk',     emoji: '🐿️' },
    { label: 'Concert',      value: 'concert',       description: 'Concert hall reverb effect',       key: 'concert',      emoji: '🎤' },
    { label: 'Dolby Atmos',  value: 'dolbyatmos',    description: 'Spatial surround sound',           key: 'dolbyatmos',   emoji: '🔉' },
    { label: 'Heaven',       value: 'heaven',        description: 'Angelic high-pitch shimmer',       key: 'heaven',       emoji: '✨' },
    { label: 'Lofi',         value: 'lofi',          description: 'Chill lofi aesthetic',             key: 'lofi',         emoji: '🌙' },
    { label: 'Nightcore',    value: 'nightcore',     description: 'Faster speed, higher pitch',       key: 'night',        emoji: '🌙' },
    { label: 'Slow Mode',    value: 'slowmode',      description: 'Slower speed, lower pitch',        key: 'slow',         emoji: '🐢' },
    { label: 'Slowed Reverb',value: 'slowedreverb',  description: 'Slowed + deep reverb',             key: 'slowedreverb', emoji: '💫' },
    { label: 'Treble Bass',  value: 'treblebass',    description: 'Boost treble and bass',            key: 'treblebass',   emoji: '🎸' },
    { label: 'Tremolo',      value: 'tremolo',       description: 'Oscillating volume effect',        key: 'tremolo',      emoji: '〰️' },
    { label: 'Vaporwave',    value: 'vaporwave',     description: 'Slowed, lower-pitched vibe',       key: 'vapor',        emoji: '🌊' },
    { label: 'Vibrato',      value: 'vibrato',       description: 'Oscillating pitch effect',         key: 'vibrato',      emoji: '🎼' },
    { label: 'Clear Filters',value: 'clearfilters',  description: 'Remove all active filters',        key: null,           emoji: '🗑️' },
];

const FILTER_PRESETS = {
    '8d':          (p) => p.shoukaku.setFilters({ rotation: { rotationHz: 0.2 } }),
    'bassboost':   (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.6},{band:1,gain:0.5},{band:2,gain:0.4},{band:3,gain:0.3},{band:4,gain:0.2},{band:5,gain:0.1},{band:6,gain:0.0},{band:7,gain:0.0},{band:8,gain:0.0},{band:9,gain:0.0},{band:10,gain:0.0},{band:11,gain:0.0},{band:12,gain:0.0},{band:13,gain:0.0}] }),
    'china':       (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.0},{band:1,gain:0.0},{band:2,gain:0.0},{band:3,gain:0.15},{band:4,gain:0.15},{band:5,gain:0.15},{band:6,gain:0.0},{band:7,gain:0.0},{band:8,gain:0.0},{band:9,gain:0.0},{band:10,gain:0.0},{band:11,gain:0.0},{band:12,gain:0.15},{band:13,gain:0.15}], timescale: { speed: 1.0, pitch: 0.125, rate: 1.25 } }),
    'chipmunk':    (p) => p.shoukaku.setFilters({ timescale: { speed: 1.05, pitch: 1.35, rate: 1.25 } }),
    'concert':     (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.06},{band:1,gain:0.08},{band:2,gain:0.10},{band:3,gain:0.08},{band:4,gain:0.05},{band:5,gain:0.03},{band:6,gain:0.02},{band:7,gain:0.03},{band:8,gain:0.05},{band:9,gain:0.07},{band:10,gain:0.06},{band:11,gain:0.04},{band:12,gain:0.02},{band:13,gain:0.01}], lowPass: { smoothing: 8.0 }, tremolo: { frequency: 2.0, depth: 0.08 } }),
    'dolbyatmos':  (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.08},{band:1,gain:0.10},{band:2,gain:0.07},{band:3,gain:0.04},{band:4,gain:0.02},{band:5,gain:0.00},{band:6,gain:0.01},{band:7,gain:0.03},{band:8,gain:0.05},{band:9,gain:0.07},{band:10,gain:0.06},{band:11,gain:0.04},{band:12,gain:0.03},{band:13,gain:0.02}], rotation: { rotationHz: 0.08 }, vibrato: { frequency: 4.0, depth: 0.05 } }),
    'heaven':      (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:-0.02},{band:1,gain:0.00},{band:2,gain:0.04},{band:3,gain:0.08},{band:4,gain:0.10},{band:5,gain:0.12},{band:6,gain:0.12},{band:7,gain:0.10},{band:8,gain:0.08},{band:9,gain:0.06},{band:10,gain:0.05},{band:11,gain:0.04},{band:12,gain:0.03},{band:13,gain:0.02}], timescale: { speed: 1.0, pitch: 1.15, rate: 1.0 }, tremolo: { frequency: 3.5, depth: 0.06 } }),
    'lofi':        (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.10},{band:1,gain:0.08},{band:2,gain:0.05},{band:3,gain:0.02},{band:4,gain:0.00},{band:5,gain:-0.02},{band:6,gain:-0.03},{band:7,gain:-0.03},{band:8,gain:-0.02},{band:9,gain:-0.01},{band:10,gain:0.00},{band:11,gain:0.00},{band:12,gain:-0.01},{band:13,gain:-0.02}], timescale: { speed: 0.92, pitch: 0.97, rate: 0.95 }, lowPass: { smoothing: 20.0 } }),
    'nightcore':   (p) => p.shoukaku.setFilters({ timescale: { speed: 1.1, pitch: 1.125, rate: 1.05 } }),
    'slowmode':    (p) => p.shoukaku.setFilters({ timescale: { speed: 0.5, pitch: 1.0, rate: 0.8 } }),
    'slowedreverb':(p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.08},{band:1,gain:0.06},{band:2,gain:0.04},{band:3,gain:0.02},{band:4,gain:0.00},{band:5,gain:-0.01},{band:6,gain:-0.02},{band:7,gain:-0.02},{band:8,gain:0.00},{band:9,gain:0.02},{band:10,gain:0.03},{band:11,gain:0.03},{band:12,gain:0.02},{band:13,gain:0.01}], timescale: { speed: 0.78, pitch: 0.88, rate: 0.90 }, lowPass: { smoothing: 12.0 }, tremolo: { frequency: 1.5, depth: 0.12 } }),
    'treblebass':  (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0.6},{band:1,gain:0.4},{band:2,gain:0.2},{band:3,gain:0.0},{band:4,gain:0.0},{band:5,gain:0.0},{band:6,gain:0.0},{band:7,gain:0.0},{band:8,gain:0.0},{band:9,gain:0.0},{band:10,gain:0.2},{band:11,gain:0.4},{band:12,gain:0.6},{band:13,gain:0.8}] }),
    'tremolo':     (p) => p.shoukaku.setFilters({ tremolo: { frequency: 5.0, depth: 0.5 } }),
    'vaporwave':   (p) => p.shoukaku.setFilters({ equalizer: [{band:0,gain:0},{band:1,gain:0},{band:2,gain:0},{band:3,gain:0},{band:4,gain:0},{band:5,gain:0},{band:6,gain:0},{band:7,gain:0},{band:8,gain:0.15},{band:9,gain:0.15},{band:10,gain:0.15},{band:11,gain:0.15},{band:12,gain:0.15},{band:13,gain:0.15}], timescale: { pitch: 0.55 } }),
    'vibrato':     (p) => p.shoukaku.setFilters({ vibrato: { frequency: 10.0, depth: 0.9 } }),
};

function buildFilterRow(player) {
    const options = FILTERS.map(f => {
        const active = f.key ? player.data.get(f.key) === true : false;
        return {
            label: active ? `✅ ${f.label}` : f.label,
            value: f.value,
            description: f.description,
            emoji: f.emoji,
        };
    });
    const menu = new StringSelectMenuBuilder()
        .setCustomId(`np_filter`)
        .setPlaceholder(`🎛️ Apply a Filter`)
        .addOptions(options);
    return new ActionRowBuilder().addComponents(menu);
}

function buildContainer(client, track, player, brandIcon, brandBanner) {
    let position = player.position || 0;
    let duration = track.length || 0;
    let size = 15;
    let filled = duration > 0 ? Math.min(Math.round((position / duration) * size), size - 1) : 0;
    let bar = `${'▬'.repeat(filled)}●${'▬'.repeat(size - 1 - filled)}`;
    let loopMode = player.loop === 'track' ? '🔂 Track' : player.loop === 'queue' ? '🔁 Queue' : '➡️ Off';
    const thumb = track.thumbnail || brandIcon || client.user.displayAvatarURL({ dynamic: true });

    const container = new ContainerBuilder()
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**| Now Playing**\n\n**[${track.title}](${track.uri || client.config.server})**\n\n${bar}\n\`${ms(position)} / ${ms(duration)}\`\n\n${client.emoji.users} **Requester:** ${track.requester}\n${client.emoji.music} **Loop:** ${loopMode}\n${client.emoji.ping} **Volume:** ${player.volume}%`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(thumb)
                )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Updates every 5 seconds`)
        );

    if (brandBanner) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(brandBanner)
            )
        );
    }

    return container;
}

class NowPlaying extends AvonCommand {
    get name() { return 'nowplaying'; }
    get aliases() { return ['np', 'current', 'playing']; }
    get cat() { return 'music'; }
    get player() { return true; }
    get inVoice() { return false; }
    get sameVoice() { return false; }

    async run(client, message, args, prefix, player) {
        try {
            let track = player.queue.current;
            if (!track) {
                const noTrackContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${client.emoji.cross} No track is currently playing.`)
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [noTrackContainer] });
            }

            const brand = await getServerBrand(client, message.guild.id);
            const brandIcon   = brand.icon   || null;
            const brandBanner = brand.banner || null;

            let msg = await message.channel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [buildContainer(client, track, player, brandIcon, brandBanner), buildFilterRow(player)]
            });

            let updates = 0;
            let interval = setInterval(async () => {
                try {
                    updates++;
                    let currentPlayer = client.poru.players.get(message.guild.id);
                    let currentTrack = currentPlayer?.queue?.current;

                    if (!currentPlayer || !currentTrack || updates >= 24) {
                        clearInterval(interval);
                        if (msg.editable) {
                            const doneContainer = new ContainerBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`${client.emoji.music} No longer updating.`)
                                );
                            await msg.edit({ flags: [MessageFlags.IsComponentsV2], components: [doneContainer] }).catch(() => {});
                        }
                        return;
                    }

                    await msg.edit({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [buildContainer(client, currentTrack, currentPlayer, brandIcon, brandBanner), buildFilterRow(currentPlayer)]
                    }).catch(() => { clearInterval(interval); });
                } catch (e) {
                    clearInterval(interval);
                }
            }, 5000);

            let collector = msg.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async (int) => {
                if (!int.isStringSelectMenu() || int.customId !== `np_filter`) return;

                let currentPlayer = client.poru.players.get(message.guild.id);
                if (!currentPlayer) {
                    return int.reply({ content: `${client.emoji.cross} No active player found.`, ephemeral: true });
                }

                const member = message.guild.members.cache.get(int.user.id);
                const voiceChannel = member?.voice?.channel;
                const botChannel = message.guild.members.me?.voice?.channel;
                if (!voiceChannel || voiceChannel.id !== botChannel?.id) {
                    return int.reply({ content: `${client.emoji.cross} You must be in the same voice channel to apply filters.`, ephemeral: true });
                }

                const chosen = int.values[0];

                if (chosen === 'clearfilters') {
                    await currentPlayer.shoukaku.clearFilters();
                    FILTERS.filter(f => f.key).forEach(f => currentPlayer.data.set(f.key, false));
                    await int.reply({ content: `${client.emoji.cross} **| Cleared all filters**`, ephemeral: true });
                    await msg.edit({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [buildContainer(client, currentPlayer.queue.current, currentPlayer, brandIcon, brandBanner), buildFilterRow(currentPlayer)]
                    }).catch(() => {});
                    return;
                }

                const filterInfo = FILTERS.find(f => f.value === chosen);
                if (!filterInfo || !FILTER_PRESETS[chosen]) return int.reply({ content: `${client.emoji.cross} Unknown filter.`, ephemeral: true });

                const isActive = filterInfo.key ? currentPlayer.data.get(filterInfo.key) === true : false;

                if (isActive) {
                    await currentPlayer.shoukaku.clearFilters();
                    if (filterInfo.key) currentPlayer.data.set(filterInfo.key, false);
                    await int.reply({ content: `${client.emoji.cross} **| Disabled ${filterInfo.label}**`, ephemeral: true });
                } else {
                    await FILTER_PRESETS[chosen](currentPlayer);
                    if (filterInfo.key) currentPlayer.data.set(filterInfo.key, true);
                    await int.reply({ content: `${client.emoji.filters} **| Enabled ${filterInfo.label}**`, ephemeral: true });
                }

                await msg.edit({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [buildContainer(client, currentPlayer.queue.current, currentPlayer, brandIcon, brandBanner), buildFilterRow(currentPlayer)]
                }).catch(() => {});
            });

        } catch (e) { console.log(e); }
    }
}
module.exports = NowPlaying;
