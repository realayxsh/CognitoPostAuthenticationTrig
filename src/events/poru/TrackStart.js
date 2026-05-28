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
                        .setPlaceholder(`Select a filter...`)
                        .addOptions(
                            ...[ 
                                { label: `None (Clear Filters)`, value: `none`,       desc: `Remove all active filters`,      key: `filter_none`       },
                                { label: `8D`,                   value: `8d`,         desc: `Rotating 8D audio effect`,       key: `filter_8d`         },
                                { label: `Bass Boost`,           value: `bassboost`,  desc: `Boost the bass frequencies`,     key: `filter_bassboost`  },
                                { label: `Nightcore`,            value: `nightcore`,  desc: `Faster speed and higher pitch`,  key: `filter_nightcore`  },
                                { label: `Vibrato`,              value: `vibrato`,    desc: `Oscillating pitch effect`,       key: `filter_vibrato`    },
                                { label: `Tremolo`,              value: `tremolo`,    desc: `Oscillating volume effect`,      key: `filter_tremolo`    },
                                { label: `Treblebass`,           value: `treblebass`, desc: `Boost both treble and bass`,     key: `filter_treblebass` },
                                { label: `Slowmode`,             value: `slowmode`,   desc: `Slower speed, lower pitch`,      key: `filter_slowmode`   },
                                { label: `Chipmunk`,             value: `chipmunk`,   desc: `High-pitched chipmunk voice`,    key: `filter_chipmunk`   },
                                { label: `China`,                value: `china`,      desc: `China-style audio effect`,       key: `filter_china`      },
                                { label: `Vaporwave`,            value: `vaporwave`,  desc: `Slowed, lower-pitched vibe`,     key: `filter_vaporwave`  },
                            ].map(({ label, value, desc, key }) => {
                                const opt = new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(desc);
                                const e = this.client.emoji[key];
                                if (e) opt.setEmoji(e);
                                return opt;
                            })
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
