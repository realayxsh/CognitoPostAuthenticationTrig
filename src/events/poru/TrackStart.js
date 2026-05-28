const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require("discord.js");
const AvonClientEvent = require(`../../structures/Eventhandler`);
const moment = require(`moment`);
require(`moment-duration-format`);

// Subtle clarity-enhancing EQ applied by default — cuts harsh low rumble,
// boosts mid presence and definition. Not noticeable as a "filter".
const CLARITY_EQ = [
    { band: 0,  gain: -0.05 },
    { band: 1,  gain: -0.05 },
    { band: 2,  gain:  0.0  },
    { band: 3,  gain:  0.02 },
    { band: 4,  gain:  0.04 },
    { band: 5,  gain:  0.02 },
    { band: 6,  gain:  0.0  },
    { band: 7,  gain:  0.0  },
    { band: 8,  gain:  0.06 },
    { band: 9,  gain:  0.06 },
    { band: 10, gain:  0.04 },
    { band: 11, gain:  0.02 },
    { band: 12, gain:  0.0  },
    { band: 13, gain:  0.0  },
];

class TrackStart extends AvonClientEvent {
    get name() { return 'playerStart' }
    async run(player, track) {
        let url = track.uri;
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            url = this.client.config.server;
        }
        const channel = this.client.channels.cache.get(player.textId);
        let duration = moment.duration(player.queue.current.length).format("hh:mm:ss");

        if (duration < 30) {
            player.skip();
            const skipContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${this.client.emoji.settings} Skipping this track as its duration is less than 30 seconds`)
                );
            return channel.send({ flags: [MessageFlags.IsComponentsV2], components: [skipContainer] });
        }

        // Apply clarity EQ on every new track unless a user filter is active
        const anyFilterActive = player.data.get('8d') || player.data.get('bass') ||
            player.data.get('night') || player.data.get('vib') || player.data.get('trem') ||
            player.data.get('treble') || player.data.get('slow') || player.data.get('chip') ||
            player.data.get('china') || player.data.get('vapor');
        if (!anyFilterActive) {
            const userVol = (player.volume || 100) / 100;
            player.shoukaku.setFilters({ equalizer: CLARITY_EQ, volume: userVol }).catch(() => {});
        }

        const container = new ContainerBuilder()
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
