const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require("discord.js");
const AvonClientEvent = require(`../../structures/Eventhandler`);
const moment = require(`moment`);
require(`moment-duration-format`);

class TrackStart extends AvonClientEvent {
    get name() { return 'playerStart' }
    async run(player, track) {
        let url = track.uri;
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            url = this.client.config.server;
        }
        const channel = this.client.channels.cache.get(player.textId);
        let duration = moment.duration(player.queue.current.length).format("hh:mm:ss");
        const accentColor = parseInt(this.client.config.color.replace('#', ''), 16);

        if (duration < 30) {
            player.skip();
            const skipContainer = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${this.client.emoji.settings} Skipping this track as its duration is less than 30 seconds`)
                );
            return channel.send({ flags: [MessageFlags.IsComponentsV2], components: [skipContainer] });
        }

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**| Now Playing**\n\n**[${track.title}](${url})**\nby **${track.author}** — \`${duration}\`\n\n${this.client.emoji.users} **Requester:** ${track.requester}`
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(track.requester.displayAvatarURL({ dynamic: true }))
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(`Stop`).setCustomId(`pl1`),
                    new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel(`Pause`).setCustomId(`pl2`),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel(`Loop`).setCustomId(`pl3`),
                    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Previous`).setCustomId(`pl4`),
                    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel(`Skip`).setCustomId(`pl5`)
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`filter_select`)
                        .setPlaceholder(`🎛️ Select a filter...`)
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel(`None (Clear Filters)`).setValue(`none`).setDescription(`Remove all active filters`).setEmoji(`❌`),
                            new StringSelectMenuOptionBuilder().setLabel(`8D`).setValue(`8d`).setDescription(`Rotating 8D audio effect`).setEmoji(`🎧`),
                            new StringSelectMenuOptionBuilder().setLabel(`Bass Boost`).setValue(`bassboost`).setDescription(`Boost the bass frequencies`).setEmoji(`🔊`),
                            new StringSelectMenuOptionBuilder().setLabel(`Nightcore`).setValue(`nightcore`).setDescription(`Faster speed and higher pitch`).setEmoji(`🌙`),
                            new StringSelectMenuOptionBuilder().setLabel(`Vibrato`).setValue(`vibrato`).setDescription(`Oscillating pitch effect`).setEmoji(`〰️`),
                            new StringSelectMenuOptionBuilder().setLabel(`Tremolo`).setValue(`tremolo`).setDescription(`Oscillating volume effect`).setEmoji(`🌊`),
                            new StringSelectMenuOptionBuilder().setLabel(`Treblebass`).setValue(`treblebass`).setDescription(`Boost both treble and bass`).setEmoji(`🎚️`),
                            new StringSelectMenuOptionBuilder().setLabel(`Slowmode`).setValue(`slowmode`).setDescription(`Slower speed, lower pitch`).setEmoji(`🐢`),
                            new StringSelectMenuOptionBuilder().setLabel(`Chipmunk`).setValue(`chipmunk`).setDescription(`High-pitched chipmunk voice`).setEmoji(`🐿️`),
                            new StringSelectMenuOptionBuilder().setLabel(`China`).setValue(`china`).setDescription(`China-style audio effect`).setEmoji(`🀄`),
                            new StringSelectMenuOptionBuilder().setLabel(`Vaporwave`).setValue(`vaporwave`).setDescription(`Slowed, lower-pitched vibe`).setEmoji(`🌸`)
                        )
                )
            );

        if (channel) {
            return channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] })
                .then(x => player.data.set("music", x));
        }
    }
}
module.exports = TrackStart;
