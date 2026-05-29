const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require("discord.js");
const AvonClientEvent = require(`../../structures/Eventhandler`);
const moment = require(`moment`);
require(`moment-duration-format`);

// Quality EQ — applied ONCE per player session on the very first track.
// Lavalink persists filter state across tracks, so this never needs to be
// reapplied mid-stream (which caused the audio interruption/replay bug).
//
// Design: subtle V-curve with clarity boost
//   - Trims inaudible sub-rumble (25Hz)
//   - Adds bass warmth (63–160Hz)
//   - Cuts muddiness (400Hz)
//   - Lifts presence & definition (1–4kHz)
//   - Slight air on top (6–10kHz)
const QUALITY_EQ = [
    { band: 0,  gain: -0.05 },  // 25Hz   — cut inaudible sub rumble
    { band: 1,  gain:  0.00 },  // 40Hz   — neutral
    { band: 2,  gain:  0.03 },  // 63Hz   — bass warmth
    { band: 3,  gain:  0.05 },  // 100Hz  — bass body
    { band: 4,  gain:  0.04 },  // 160Hz  — bass punch
    { band: 5,  gain:  0.00 },  // 250Hz  — neutral lower mids
    { band: 6,  gain: -0.03 },  // 400Hz  — cut muddiness
    { band: 7,  gain:  0.00 },  // 630Hz  — neutral mids
    { band: 8,  gain:  0.03 },  // 1kHz   — presence
    { band: 9,  gain:  0.04 },  // 1.6kHz — clarity
    { band: 10, gain:  0.04 },  // 2.5kHz — upper mid detail
    { band: 11, gain:  0.03 },  // 4kHz   — definition
    { band: 12, gain:  0.02 },  // 6.3kHz — air
    { band: 13, gain:  0.02 },  // 10kHz  — sparkle
];

class TrackStart extends AvonClientEvent {
    get name() { return 'playerStart' }
    async run(player, track) {
        let url = track.uri || '';
        const channel = this.client.channels.cache.get(player.textId);
        let duration = moment.duration(player.queue.current.length).format("hh:mm:ss");

        if (player.queue.current.length < 30000) {
            player.skip();
            const skipContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${this.client.emoji.settings} Skipping this track as its duration is less than 30 seconds`)
                );
            return channel?.send({ flags: [MessageFlags.IsComponentsV2], components: [skipContainer] });
        }

        // Apply quality EQ only on the first track of this session.
        // The flag 'qualityInit' persists on the player so subsequent tracks
        // never trigger setFilters — no audio interruptions.
        const anyFilterActive = player.data.get('8d') || player.data.get('bass') ||
            player.data.get('night') || player.data.get('vib') || player.data.get('trem') ||
            player.data.get('treble') || player.data.get('slow') || player.data.get('chip') ||
            player.data.get('china') || player.data.get('vapor') || player.data.get('dolbyatmos');

        if (!player.data.get('qualityInit') && !anyFilterActive) {
            player.data.set('qualityInit', true);
            player.shoukaku.setFilters({ equalizer: QUALITY_EQ }).catch(() => {});
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
                                { label: `None (Clear Filters)`, value: `none`,        desc: `Remove all active filters`,      key: `filter_none`        },
                                { label: `8D`,                   value: `8d`,          desc: `Rotating 8D audio effect`,       key: `filter_8d`          },
                                { label: `Bass Boost`,           value: `bassboost`,   desc: `Boost the bass frequencies`,     key: `filter_bassboost`   },
                                { label: `Nightcore`,            value: `nightcore`,   desc: `Faster speed and higher pitch`,  key: `filter_nightcore`   },
                                { label: `Vibrato`,              value: `vibrato`,     desc: `Oscillating pitch effect`,       key: `filter_vibrato`     },
                                { label: `Tremolo`,              value: `tremolo`,     desc: `Oscillating volume effect`,      key: `filter_tremolo`     },
                                { label: `Treblebass`,           value: `treblebass`,  desc: `Boost both treble and bass`,     key: `filter_treblebass`  },
                                { label: `Slowmode`,             value: `slowmode`,    desc: `Slower speed, lower pitch`,      key: `filter_slowmode`    },
                                { label: `Chipmunk`,             value: `chipmunk`,    desc: `High-pitched chipmunk voice`,    key: `filter_chipmunk`    },
                                { label: `China`,                value: `china`,       desc: `China-style audio effect`,       key: `filter_china`       },
                                { label: `Vaporwave`,            value: `vaporwave`,   desc: `Slowed, lower-pitched vibe`,     key: `filter_vaporwave`   },
                                { label: `Dolby Atmos`,          value: `dolbyatmos`,  desc: `Spatial surround sound effect`,  key: `filter_dolbyatmos`  },
                                { label: `Concert`,              value: `concert`,     desc: `Concert hall reverb effect`,     key: `filter_concert`     },
                                { label: `Lofi`,                 value: `lofi`,        desc: `Chill lofi aesthetic`,           key: `filter_lofi`        },
                                { label: `Heaven`,               value: `heaven`,      desc: `Angelic high-pitch shimmer`,     key: `filter_heaven`      },
                                { label: `Slowed Reverb`,        value: `slowedreverb`,desc: `Slowed + deep reverb`,           key: `filter_slowedreverb`},
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
