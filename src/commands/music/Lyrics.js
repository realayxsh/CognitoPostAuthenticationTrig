const {
    EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags
} = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

async function fetchLyrics(query) {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://lyrist.vercel.app/api/${encoded}`).catch(() => null);
    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || !data.lyrics) return null;
    return data;
}

function chunkText(text, size = 3800) {
    const chunks = [];
    while (text.length > 0) {
        chunks.push(text.slice(0, size));
        text = text.slice(size);
    }
    return chunks;
}

function buildDropdown(client, selected) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`lyrics_view`)
            .setPlaceholder(`Select view...`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Full Lyrics`)
                    .setValue(`full`)
                    .setDescription(`Show the complete lyrics`)
                    .setDefault(selected === `full`)
                    .setEmoji(client.emoji.lyrics_full || `📜`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Current Verse`)
                    .setValue(`verse`)
                    .setDescription(`Show only the current verse`)
                    .setDefault(selected === `verse`)
                    .setEmoji(client.emoji.lyrics_verse || `🎵`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Song Info`)
                    .setValue(`info`)
                    .setDescription(`Show artist and album info`)
                    .setDefault(selected === `info`)
                    .setEmoji(client.emoji.lyrics_info || `ℹ️`)
            )
    );
}

function buildFullLyricsEmbed(client, data, track, page = 0) {
    const chunks = chunkText(data.lyrics);
    const totalPages = chunks.length;
    const embed = new EmbedBuilder()
        .setTitle(`${client.emoji.lyrics_full || `📜`} Lyrics — ${data.title || track.title}`)
        .setDescription(chunks[page] || `No lyrics content.`)
        .setColor(0xE53535)
        .setThumbnail(data.image || track.thumbnail || null)
        .setFooter({ text: `Artist: ${data.artist || track.author}${totalPages > 1 ? ` • Page ${page + 1}/${totalPages}` : ``}` })
        .setTimestamp();
    return { embed, totalPages };
}

function buildVerseEmbed(client, data, track, position) {
    const lines = data.lyrics.split(`\n`);
    const totalLines = lines.length;
    const progress = track.length > 0 ? position / track.length : 0;
    const lineIndex = Math.min(Math.floor(progress * totalLines), totalLines - 1);

    const start = Math.max(0, lineIndex - 3);
    const end   = Math.min(totalLines, lineIndex + 6);
    const verse = lines.slice(start, end)
        .map((l, i) => (start + i === lineIndex && l.trim()) ? `**${l}**` : l)
        .join(`\n`) || `*Could not determine current verse*`;

    const embed = new EmbedBuilder()
        .setTitle(`${client.emoji.lyrics_verse || `🎵`} Current Verse — ${data.title || track.title}`)
        .setDescription(verse)
        .setColor(0xE53535)
        .setThumbnail(data.image || track.thumbnail || null)
        .setFooter({ text: `Artist: ${data.artist || track.author}` })
        .setTimestamp();
    return embed;
}

function buildInfoEmbed(client, data, track) {
    const embed = new EmbedBuilder()
        .setTitle(`${client.emoji.lyrics_info || `ℹ️`} Song Info — ${data.title || track.title}`)
        .setColor(0xE53535)
        .setThumbnail(data.image || track.thumbnail || null)
        .addFields(
            { name: `Title`,    value: data.title  || track.title  || `Unknown`, inline: true  },
            { name: `Artist`,   value: data.artist || track.author || `Unknown`, inline: true  },
            { name: `Source`,   value: track.uri   ? `[Link](${track.uri})` : `Unknown`,       inline: true  },
            { name: `Duration`, value: track.length ? `\`${new Date(track.length).toISOString().slice(11,19)}\`` : `Unknown`, inline: true },
            { name: `Lyrics`,   value: data.lyrics ? `\`${data.lyrics.split(`\n`).filter(l => l.trim()).length} lines\`` : `Not found`, inline: true }
        )
        .setTimestamp();
    return embed;
}

class Lyrics extends AvonCommand {
    get name()      { return `lyrics`; }
    get aliases()   { return [`ly`, `lyric`]; }
    get cat()       { return `music`; }
    get player()    { return true; }
    get inVoice()   { return false; }
    get sameVoice() { return false; }
    get premium()   { return true; }

    async run(client, message, args, prefix, player) {
        try {
            const track = player.queue.current;
            if (!track) {
                const c = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${client.emoji.cross} | Nothing is currently playing.`)
                );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [c] });
            }

            // Show loading state
            const loading = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${client.emoji.lyrics_loading || `⏳`} | Searching lyrics for **${track.title}**...`)
            );
            const loadMsg = await message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [loading] });

            // Fetch lyrics — try full title + author first, fall back to title only
            let data = await fetchLyrics(`${track.title} ${track.author}`);
            if (!data) data = await fetchLyrics(track.title);

            if (!data) {
                await loadMsg.delete().catch(() => {});
                const notFound = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${client.emoji.cross} | Could not find lyrics for **${track.title}**.`)
                );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [notFound] });
            }

            await loadMsg.delete().catch(() => {});

            let currentView = `full`;
            let currentPage = 0;
            const { embed: fullEmbed, totalPages } = buildFullLyricsEmbed(client, data, track, 0);

            // Build page nav row if lyrics span multiple pages
            const buildPageRow = (page, total) => {
                if (total <= 1) return null;
                const { ActionRowBuilder: AR, ButtonBuilder: BB, ButtonStyle: BS } = require(`discord.js`);
                return new AR().addComponents(
                    new BB().setCustomId(`lyrics_prev`).setLabel(`◀ Prev`).setStyle(BS.Secondary).setDisabled(page === 0),
                    new BB().setCustomId(`lyrics_next`).setLabel(`Next ▶`).setStyle(BS.Secondary).setDisabled(page >= total - 1)
                );
            };

            const buildComponents = (view, page, total) => {
                const rows = [buildDropdown(client, view)];
                const pageRow = buildPageRow(page, total);
                if (pageRow) rows.push(pageRow);
                return rows;
            };

            const sent = await message.channel.send({
                embeds: [fullEmbed],
                components: buildComponents(currentView, currentPage, totalPages)
            });

            const collector = sent.createMessageComponentCollector({ time: 120000 });

            collector.on(`collect`, async (i) => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: `${client.emoji.cross} Only **${message.author.tag}** can use this.`, ephemeral: true });
                }

                if (i.isStringSelectMenu() && i.customId === `lyrics_view`) {
                    currentView = i.values[0];
                    currentPage = 0;

                    let embed;
                    let pages = 1;
                    if (currentView === `full`) {
                        const result = buildFullLyricsEmbed(client, data, track, 0);
                        embed = result.embed; pages = result.totalPages;
                    } else if (currentView === `verse`) {
                        embed = buildVerseEmbed(client, data, track, player.position || 0);
                    } else {
                        embed = buildInfoEmbed(client, data, track);
                    }

                    return i.update({ embeds: [embed], components: buildComponents(currentView, 0, pages) });
                }

                if (i.isButton()) {
                    if (i.customId === `lyrics_prev` && currentPage > 0) currentPage--;
                    if (i.customId === `lyrics_next`) currentPage++;
                    const { embed, totalPages: tp } = buildFullLyricsEmbed(client, data, track, currentPage);
                    return i.update({ embeds: [embed], components: buildComponents(`full`, currentPage, tp) });
                }
            });

            collector.on(`end`, () => {
                sent.edit({ components: [] }).catch(() => {});
            });

        } catch (e) { console.error(`[Lyrics]`, e); }
    }
}
module.exports = Lyrics;
