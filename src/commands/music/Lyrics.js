const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Lyrics extends AvonCommand {
    get name()      { return 'lyrics'; }
    get aliases()   { return ['ly', 'lyric']; }
    get cat()       { return 'music'; }
    get vote()      { return true; }
    get player()    { return true; }
    get inVoice()   { return false; }
    get sameVoice() { return false; }

    async run(client, message, args, prefix, player) {
        const track = player.queue.current;

        // Allow manual query: +lyrics <song name>
        const query = args.length ? args.join(' ') : null;

        let artist = track.author  || '';
        let title  = track.title   || '';

        // If user typed a manual query, try to split "artist - title" or use whole thing as title
        if (query) {
            const split = query.split(' - ');
            if (split.length >= 2) {
                artist = split[0].trim();
                title  = split.slice(1).join(' - ').trim();
            } else {
                artist = '';
                title  = query.trim();
            }
        }

        // Clean up common suffixes that break lyrics search
        title = title
            .replace(/\(.*?(official|video|audio|lyrics|hd|4k|mv|ft\.?|feat\.?).*?\)/gi, '')
            .replace(/\[.*?(official|video|audio|lyrics|hd|4k|mv|ft\.?|feat\.?).*?\]/gi, '')
            .trim();

        const loadingContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${client.emoji.music} Searching lyrics for **${title}**...`)
            );
        const loadMsg = await message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [loadingContainer] });

        try {
            const encodedArtist = encodeURIComponent(artist);
            const encodedTitle  = encodeURIComponent(title);

            let lyrics = null;
            let usedQuery = `${artist} - ${title}`.trim().replace(/^-\s*/, '');

            // Try with artist first, fallback to title-only if no result
            const attempts = artist
                ? [`https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`, `https://api.lyrics.ovh/v1/_/${encodedTitle}`]
                : [`https://api.lyrics.ovh/v1/_/${encodedTitle}`];

            for (const url of attempts) {
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.lyrics && data.lyrics.trim().length > 10) {
                        lyrics = data.lyrics.trim();
                        break;
                    }
                }
            }

            if (!lyrics) {
                const notFoundContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${client.emoji.cross} No lyrics found for **${usedQuery}**.\nTry: \`${prefix}lyrics <song name>\``)
                    );
                return loadMsg.edit({ flags: [MessageFlags.IsComponentsV2], components: [notFoundContainer] });
            }

            // Split into chunks of max 1800 chars at a newline boundary
            const CHUNK = 1800;
            const pages = [];
            let remaining = lyrics;
            while (remaining.length > 0) {
                if (remaining.length <= CHUNK) {
                    pages.push(remaining);
                    break;
                }
                let cut = remaining.lastIndexOf('\n', CHUNK);
                if (cut <= 0) cut = CHUNK;
                pages.push(remaining.slice(0, cut));
                remaining = remaining.slice(cut).trimStart();
            }

            let page = 0;
            const thumb = track.thumbnail || client.user.displayAvatarURL({ dynamic: true });

            const buildPage = (p) => {
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`**Lyrics — ${track.title}**\nby **${track.author}**`)
                            )
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb))
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(pages[p])
                    );

                if (pages.length > 1) {
                    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`-# Page ${p + 1} of ${pages.length}`)
                        );
                }
                return container;
            };

            const buildRow = (p) => {
                if (pages.length <= 1) return null;
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`lyr_prev`).setLabel(`Previous`).setDisabled(p === 0),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`lyr_next`).setLabel(`Next`).setDisabled(p === pages.length - 1)
                );
            };

            const components = [buildPage(page)];
            if (pages.length > 1) components.push(buildRow(page));

            await loadMsg.edit({ flags: [MessageFlags.IsComponentsV2], components });

            if (pages.length <= 1) return;

            const collector = loadMsg.createMessageComponentCollector({
                filter: b => {
                    if (b.user.id === message.author.id) return true;
                    b.reply({ content: `${client.emoji.cross} This is not your session.`, ephemeral: true });
                    return false;
                },
                time: 120000
            });

            collector.on('collect', async b => {
                if (!b.isButton()) return;
                await b.deferUpdate().catch(() => {});
                if (b.customId === 'lyr_next' && page < pages.length - 1) page++;
                else if (b.customId === 'lyr_prev' && page > 0) page--;
                await loadMsg.edit({ flags: [MessageFlags.IsComponentsV2], components: [buildPage(page), buildRow(page)] }).catch(() => {});
            });

            collector.on('end', async () => {
                const finalRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`lyr_prev`).setLabel(`Previous`).setDisabled(true),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`lyr_next`).setLabel(`Next`).setDisabled(true)
                );
                await loadMsg.edit({ flags: [MessageFlags.IsComponentsV2], components: [buildPage(page), finalRow] }).catch(() => {});
            });

        } catch (e) {
            console.error('[Lyrics]', e);
            const errContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${client.emoji.cross} Failed to fetch lyrics. Try again later.`)
                );
            loadMsg.edit({ flags: [MessageFlags.IsComponentsV2], components: [errContainer] }).catch(() => {});
        }
    }
}

module.exports = Lyrics;
