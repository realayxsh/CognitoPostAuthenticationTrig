const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
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
                if (!query.includes('spotify')) {
                    return editMsg(searchingMsg, `**| ${client.emoji.cross} | Only Spotify links are supported. Please paste a Spotify track, album, or playlist URL.**`);
                }

                try {
                    let result = await player.search(query, { requester: message.author });
                    if (!result || !result.tracks.length) {
                        return editMsg(searchingMsg, `**| ${client.emoji.cross} | No results found for that Spotify link. Make sure it is valid and public.**`);
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
                    console.error('[Play Spotify URL]', e);
                    return editMsg(searchingMsg, `**| ${client.emoji.cross} | Failed to load that Spotify link. Make sure it is valid and public.**`);
                }
            }

            // Search Spotify with up to 3 attempts — no other platforms
            {
                let p = client.poru.players.get(message.guild.id);
                if (!p) {
                    return editMsg(searchingMsg, `**| ${client.emoji.cross} | Player no longer exists. Please run the command again.**`);
                }

                let result = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const res = await p.search(query, { engine: 'spotify', requester: message.author });
                        if (res && res.tracks.length) { result = res; break; }
                        console.warn(`[Play] Spotify attempt ${attempt} returned no tracks for: ${query}`);
                    } catch (e) {
                        console.error(`[Play] Spotify attempt ${attempt} error:`, e.message);
                    }
                    if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
                }

                if (!result || !result.tracks.length) {
                    return editMsg(searchingMsg, `**| ${client.emoji.cross} | No results found on Spotify for \`${query}\`. Try a different search term.**`);
                }

                if (result.type === `PLAYLIST`) {
                    for (let track of result.tracks) {
                        p.queue.add(new KazagumoTrack(track.getRaw(), message.author));
                    }
                    if (!p.playing && !p.paused) p.play();
                    return editMsg(searchingMsg, `**| Added Playlist to Queue**\n\n${client.emoji.queue} **Added** \`${result.tracks.length}\` songs from *${result.playlistName}*\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** \`${ms(result.playlistInfo?.length ?? 0)}\``);
                } else {
                    p.queue.add(new KazagumoTrack(result.tracks[0].getRaw(), message.author));
                    if (!p.playing && !p.paused) p.play();
                    return editMsg(searchingMsg, `**| Added Song to Queue**\n\n${client.emoji.queue} **Added** [${result.tracks[0].title}](${result.tracks[0].uri || client.config.server})\n${client.emoji.users} **Requester:** ${message.author}\n${client.emoji.time} **Duration:** ${ms(result.tracks[0].length)}`);
                }
            }

        } catch (e) {
            console.error('[Play]', e);
            message.channel.send({ content: `${client.emoji.cross} | Something went wrong. Please try again.` }).catch(() => {});
        }
    }
}
module.exports = Play;
