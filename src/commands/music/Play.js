const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const ms = require("ms");
const { KazagumoTrack } = require(`kazagumo`);
const AvonCommand = require(`../../structures/avonCommand`);

class Play extends AvonCommand {
    get name() { return 'play' }
    get aliases() { return ['p'] }
    get cat() { return 'music' }
    get inVoice() { return true; }
    get sameVoice() { return true; }

    async run(client, message, args, prefix) {
        const avatar = message.author.displayAvatarURL({ dynamic: true });

        const send = (text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };

        const editMsg = (msg, text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
                );
            return msg.edit({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };

        try {
            if (!args[0]) {
                return send(`**| Command Usage**\n\`\`\`js\n${prefix}play <songurl>\`\`\``);
            }

            let query = args.join(" ");

            // Resolve spotify.link short URLs to the full open.spotify.com URL
            if (query.startsWith('https://spotify.link/')) {
                try {
                    const res = await fetch(query, { method: 'HEAD', redirect: 'follow' });
                    if (res.url && res.url.includes('open.spotify.com')) query = res.url;
                } catch(e) { /* keep original if fetch fails */ }
            }

            const searchingContainer = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Searching...**\n\nLooking up: \`${query}\``))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
                );
            let searchingMsg = await message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [searchingContainer] });

            let channel = message.member.voice.channel;
            let player = client.poru.players.get(message.guild.id);
            if (!player) {
                player = await client.poru.createPlayer({
                    guildId: message.guild.id,
                    voiceId: channel.id,
                    textId: message.channel.id,
                    deaf: true,
                    volume: 100,
                    shardId: message.guild.shardId
                });
            }

            player.setTextChannel(message.channel.id);

            if (query.startsWith('https://')) {
                if (query.includes(`youtube`) || query.includes(`youtu.be`)) {
                    return editMsg(searchingMsg, `**| I don't resolve YouTube links anymore due to YouTube's TOS**`);
                }

                if (query.includes(`spotify`)) {
                    try {
                        let result = await player.search(query, { requester: message.author });
                        if (!result || !result.tracks.length) {
                            return editMsg(searchingMsg, `**| ${client.emoji.cross} | No results found for that Spotify link**`);
                        }
                        if (result.type === `PLAYLIST`) {
                            for (let track of result.tracks) player.queue.add(track);
                            if (!player.playing && !player.paused) player.play();
                            return editMsg(searchingMsg, `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.tracks.reduce((a, v) => a + (v.length || 0), 0))}\``);
                        } else {
                            player.queue.add(result.tracks[0]);
                            if (!player.playing && !player.paused) player.play();
                            return editMsg(searchingMsg, `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${result.tracks[0].uri || client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`);
                        }
                    } catch (e) {
                        console.error('[Play Spotify]', e);
                        return editMsg(searchingMsg, `**| ${client.emoji.cross} | Failed to load that Spotify link. Make sure the link is valid and public.**`);
                    }
                } else {
                    try {
                        let result = await player.search(query, { requester: message.author });
                        if (!result || !result.tracks.length) return editMsg(searchingMsg, `**| No results were found**`);
                        if (result.type === `PLAYLIST`) {
                            for (let track of result.tracks) player.queue.add(track);
                            if (!player.playing && !player.paused) player.play();
                            return editMsg(searchingMsg, `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.playlistInfo?.length ?? 0)}\``);
                        } else {
                            player.queue.add(result.tracks[0]);
                            if (!player.playing && !player.paused) player.play();
                            return editMsg(searchingMsg, `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${result.tracks[0].uri || client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`);
                        }
                    } catch (e) {
                        console.error('[Play URL]', e);
                        return editMsg(searchingMsg, `**| ${client.emoji.cross} | Failed to load that link**`);
                    }
                }
            }

            const selectorContainer = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**| Choose the search engine**\n\nSearching for: \`${query}\``)
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Default`).setCustomId(`def`),
                        new ButtonBuilder().setStyle(ButtonStyle.Success).setEmoji(`<:spotify_avon:1065634374906814525>`).setCustomId(`spoti`),
                        new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId(`deez`).setEmoji(`<:Deezer_avon:1065634451603861545>`),
                        new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`sc`).setEmoji(`<:Soundcloud_avon:1065634569262473277>`)
                    )
                );

            await searchingMsg.delete().catch(() => {});
            let msg = await message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [selectorContainer] });

            let co = msg.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    b.reply({ content: `${client.emoji.cross} | You are not the author of this command`, ephemeral: true }).catch(() => {});
                    return false;
                },
                time: 120000,
                max: 1
            });

            co.on('collect', async (interaction) => {
                if (!interaction.isButton()) return;
                if (interaction.user.id !== message.author.id) return interaction.deferUpdate().catch(() => {});

                await interaction.deferUpdate().catch(() => {});

                try {
                    let p = client.poru.players.get(message.guild.id);
                    if (!p) {
                        return editMsg(msg, `**| ${client.emoji.cross} | Player no longer exists. Please run the command again.**`);
                    }

                    let result;
                    if (interaction.customId === 'spoti') {
                        result = await p.search(query, { engine: 'spotify', requester: message.author });
                    } else if (interaction.customId === 'deez') {
                        result = await p.search(query, { engine: 'deezer', requester: message.author });
                    } else if (interaction.customId === 'sc') {
                        result = await p.search(query, { engine: 'soundcloud', requester: message.author });
                    } else {
                        result = await p.search(query, { requester: message.author });
                    }

                    if (!result || !result.tracks.length) {
                        return editMsg(msg, `**| No results were found for \`${query}\`**`);
                    }

                    if (result.type === `PLAYLIST`) {
                        for (let track of result.tracks) {
                            let tr = interaction.customId === 'spoti'
                                ? new KazagumoTrack(track.getRaw(), message.author)
                                : track;
                            p.queue.add(tr);
                        }
                        if (!p.playing && !p.paused) p.play();
                        return editMsg(msg, `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.playlistInfo?.length ?? 0)}\``);
                    } else {
                        let track = interaction.customId === 'spoti'
                            ? new KazagumoTrack(result.tracks[0].getRaw(), message.author)
                            : result.tracks[0];
                        p.queue.add(track);
                        if (!p.playing && !p.paused) p.play();
                        return editMsg(msg, `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${result.tracks[0].uri || client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`);
                    }
                } catch (e) {
                    console.error('[Play Collector]', e);
                    editMsg(msg, `**| ${client.emoji.cross} | Something went wrong while searching. Please try again.**`).catch(() => {});
                }
            });

            co.on('end', (collected) => {
                if (collected.size === 0) {
                    msg.delete().catch(() => {
                        editMsg(msg, `**| ${client.emoji.cross} | Search timed out. Run the command again.**`).catch(() => {});
                    });
                }
            });

        } catch (e) {
            console.error('[Play]', e);
            message.channel.send({ content: `${client.emoji.cross} | Something went wrong. Please try again.` }).catch(() => {});
        }
    }
}
module.exports = Play;
