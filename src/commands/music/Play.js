const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const ms = require("ms");
const { KazagumoTrack } = require(`kazagumo`);
const AvonCommand = require(`../../structures/avonCommand`);

class Play extends AvonCommand {
    get name() { return 'play' }
    get aliases() { return ['p', 'play'] }
    get cat() { return 'music' }
    get inVoice() { return true; }
    get sameVoice() { return true; }

    async run(client, message, args, prefix) {
        try {

            const sendContainer = (text, avatarURL) => {
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL))
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };

            const updateContainer = (interaction, text, avatarURL) => {
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL))
                    );
                return interaction.update({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };

            if (!args[0]) {
                return sendContainer(
                    `**| Command Usage**\n\`\`\`js\n${prefix}play <songurl>\`\`\``,
                    message.author.displayAvatarURL({ dynamic: true })
                );
            }

            let channel = message.member.voice.channel;
            var player = client.poru.players.get(message.guild.id);
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

            let query = args.join(" ");
            player.setTextChannel(message.channel.id);

            if (query.startsWith('https://')) {
                if (query.includes(`youtube`) || query.includes(`youtu.be`)) {
                    return sendContainer(
                        `**| I don't resolve YouTube links anymore due to YouTube's TOS**`,
                        message.author.displayAvatarURL({ dynamic: true })
                    );
                }

                if (query.includes(`spotify`)) {
                    try {
                        await client.lavasfy.requestToken();
                        let node = client.lavasfy.nodes.get('Avon');
                        let result = await node.load(query);
                        if (result.loadType === `LOAD_FAILED`) {
                            return sendContainer(`**| Failed while loading**`, message.author.displayAvatarURL({ dynamic: true }));
                        }
                        if (result.loadType === `PLAYLIST_LOADED`) {
                            let songs = [];
                            for (let i = 0; i < result.tracks.length; i++) {
                                songs.push(new KazagumoTrack(result.tracks[i], message.author));
                            }
                            player.queue.add(songs);
                            if (!player.playing && !player.paused) player.play();
                            return sendContainer(
                                `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistInfo.name}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks.reduce((a, v) => a + v.info.length, 0))}`,
                                message.author.displayAvatarURL({ dynamic: true })
                            );
                        }
                        if (result.loadType === `TRACK_LOADED` || result.loadType === `SEARCH_RESULT`) {
                            let convertedTrack = new KazagumoTrack(result.tracks[0], message.author);
                            player.queue.add(convertedTrack);
                            if (!player.playing && !player.paused) player.play();
                            return sendContainer(
                                `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].info.title}](${result.tracks[0].info.uri})\n${client.emoji.users} **Requester:** ${message.author}`,
                                message.author.displayAvatarURL({ dynamic: true })
                            );
                        }
                    } catch (e) { console.log(e) }
                } else {
                    let result = await player.search(query, { requester: message.author });
                    if (!result.tracks.length) {
                        return sendContainer(`**| No results were found**`, message.author.displayAvatarURL({ dynamic: true }));
                    }
                    if (result.type === `PLAYLIST`) {
                        for (let track of result.tracks) {
                            player.queue.add(track);
                        }
                        if (!player.playing && !player.paused) player.play();
                        return sendContainer(
                            `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.playlistInfo?.length ?? 0)}\``,
                            message.author.displayAvatarURL({ dynamic: true })
                        );
                    } else {
                        player.queue.add(result.tracks[0]);
                        if (!player.playing && !player.paused) player.play();
                        return sendContainer(
                            `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`,
                            message.author.displayAvatarURL({ dynamic: true })
                        );
                    }
                }
            }

            const selectorContainer = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**| Choose the search engine you want to use**\n\nSearching for: \`${query}\``)
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true }))
                        )
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

            let msg = await message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [selectorContainer] });

            let co = msg.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    b.reply({ content: `${client.emoji.cross} | You are not the author of this command`, ephemeral: true });
                    return false;
                },
                time: 600000 * 5
            });

            co.on('collect', async (interaction) => {
                if (!interaction.isButton()) return;
                if (interaction.user.id !== message.author.id) return interaction.deferUpdate();
                try {
                    const engines = { def: null, spoti: 'spotify', deez: 'deezer', sc: 'soundcloud' };
                    const engineName = engines[interaction.customId];
                    const avatar = message.author.displayAvatarURL({ dynamic: true });

                    let result;
                    if (interaction.customId === 'spoti') {
                        result = await player.search(query, { engine: 'spotify', requester: message.author });
                    } else if (interaction.customId === 'deez') {
                        result = await player.search(query, { engine: 'deezer', requester: message.author });
                    } else if (interaction.customId === 'sc') {
                        result = await player.search(query, { engine: 'soundcloud', requester: message.author });
                    } else {
                        result = await player.search(query, { requester: message.author });
                    }

                    if (!result.tracks.length) {
                        return updateContainer(interaction, `**| No results were found**`, avatar);
                    }

                    if (result.type === `PLAYLIST`) {
                        for (let track of result.tracks) {
                            let tr = interaction.customId === 'spoti'
                                ? new KazagumoTrack(track.getRaw(), message.author)
                                : track;
                            player.queue.add(tr);
                        }
                        if (!player.playing && !player.paused) player.play();
                        return updateContainer(interaction,
                            `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.playlistInfo?.length ?? 0)}\``,
                            avatar
                        );
                    } else {
                        let track = interaction.customId === 'spoti'
                            ? new KazagumoTrack(result.tracks[0].getRaw(), message.author)
                            : result.tracks[0];
                        player.queue.add(track);
                        if (!player.playing && !player.paused) player.play();
                        return updateContainer(interaction,
                            `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`,
                            avatar
                        );
                    }
                } catch (e) { console.log(e) }
            });

            co.on('end', () => {});

        } catch (e) { console.log(e) }
    }
}
module.exports = Play;
