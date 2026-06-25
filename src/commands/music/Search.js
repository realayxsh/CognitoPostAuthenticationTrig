const {
    ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder,
    SeparatorBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder, MessageFlags
} = require("discord.js");
const ms = require("ms");
const AvonCommand = require(`../../structures/avonCommand`);

class Search extends AvonCommand {
    get name()     { return 'search' }
    get aliases()  { return ['sp', 'find'] }
    get cat()      { return 'music' }
    get inVoice()  { return true; }
    get sameVoice(){ return true; }

    async run(client, message, args, prefix) {
        const avatar = message.author.displayAvatarURL?.({ dynamic: true })
            || client.user.displayAvatarURL();

        const buildContainer = (text, withMenu = false, tracks = []) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
                );

            if (withMenu && tracks.length) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('search_pick')
                    .setPlaceholder('Pick a song to play...')
                    .addOptions(
                        tracks.map((t, i) => {
                            const label = `${i + 1}. ${t.title || 'Unknown'}`.slice(0, 100);
                            const desc = `${t.author || 'Unknown Artist'} · ${ms(t.length || 0)}`.slice(0, 100);
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(label)
                                .setValue(String(i))
                                .setDescription(desc);
                        })
                    );

                container
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
            }

            return { flags: [MessageFlags.IsComponentsV2], components: [container] };
        };

        try {
            if (!args[0]) {
                return message.channel.send(buildContainer(
                    `**| Command Usage**\n\`\`\`js\n${prefix}search <song name>\`\`\``
                ));
            }

            const query = args.join(' ');

            const searchingMsg = await message.channel.send(buildContainer(
                `**| Searching Spotify...**\n\nLooking up: \`${query}\``
            ));

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

            // Search Spotify — up to 3 attempts
            let result = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const res = await player.search(`spsearch:${query}`, { requester: message.author });
                    if (res && res.tracks.length) { result = res; break; }
                    console.warn(`[Search] attempt ${attempt} returned no results for: ${query}`);
                } catch (e) {
                    console.error(`[Search] attempt ${attempt} error:`, e.message);
                }
                if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
            }

            if (!result || !result.tracks.length) {
                return searchingMsg.edit(buildContainer(
                    `**| ${client.emoji.cross} | No results found on Spotify for \`${query}\`. Try a different search term.**`
                ));
            }

            const tracks = result.tracks.slice(0, 5);

            const trackList = tracks.map((t, i) => {
                const title  = (t.title  || 'Unknown').slice(0, 50);
                const author = (t.author || 'Unknown Artist').slice(0, 35);
                const dur    = ms(t.length || 0);
                return `\`${i + 1}.\` **[${title}](${t.uri || client.config.server})** — ${author} \`[${dur}]\``;
            }).join('\n');

            // Edit the searching message to show results + select menu
            await searchingMsg.edit(buildContainer(
                `**| Spotify Search Results**\n\nQuery: \`${query}\`\n\n${trackList}\n\n-# Pick a song below — expires in 60s`,
                true,
                tracks
            ));

            const collector = searchingMsg.createMessageComponentCollector({
                filter: (i) => {
                    if (i.user.id === message.author.id) return true;
                    i.reply({ content: `${client.emoji.cross} | Only **${message.author.username}** can pick from this search.`, ephemeral: true }).catch(() => {});
                    return false;
                },
                time: 60_000,
                max: 1
            });

            collector.on('collect', async (interaction) => {
                try {
                    await interaction.deferUpdate().catch(() => {});
                    const idx = parseInt(interaction.values[0], 10);
                    const chosen = tracks[idx];
                    if (!chosen) return;

                    const p = client.poru.players.get(message.guild.id);
                    if (!p) {
                        return searchingMsg.edit(buildContainer(
                            `**| ${client.emoji.cross} | Player no longer exists. Please run the command again.**`
                        ));
                    }

                    p.queue.add(chosen);
                    if (!p.playing && !p.paused) p.play();

                    return searchingMsg.edit(buildContainer(
                        `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${chosen.title}](${chosen.uri || client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(chosen.length || 0)}\``
                    ));
                } catch (e) {
                    console.error('[Search collector]', e);
                    searchingMsg.edit(buildContainer(`**| ${client.emoji.cross} | Something went wrong. Please try again.**`)).catch(() => {});
                }
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    searchingMsg.edit(buildContainer(
                        `**| ${client.emoji.cross} | Search timed out — no song was selected. Run the command again.**`
                    )).catch(() => {});
                }
            });

        } catch (e) {
            console.error('[Search]', e);
            message.channel.send({ content: `${client.emoji.cross} | Something went wrong. Please try again.` }).catch(() => {});
        }
    }
}
module.exports = Search;
