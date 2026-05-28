const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class DolbyAtmos extends AvonCommand {
    get name() { return 'dolbyatmos' }
    get aliases() { return ['dolby', 'atmos'] }
    get player() { return true }
    get vote() { return true; }
    get cat() { return 'filters' }
    get premium() { return true; }
    get inVoice() { return true }
    get sameVoice() { return true }
    async run(client, message, args, prefix, player) {
        try {
            const send = (text) => {
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };
            let data = player.data.get('dolbyatmos');
            if (!data || data === false || data === undefined) {
                await player.shoukaku.setFilters({
                    equalizer: [
                        { band: 0,  gain: 0.08  },
                        { band: 1,  gain: 0.10  },
                        { band: 2,  gain: 0.07  },
                        { band: 3,  gain: 0.04  },
                        { band: 4,  gain: 0.02  },
                        { band: 5,  gain: 0.00  },
                        { band: 6,  gain: 0.01  },
                        { band: 7,  gain: 0.03  },
                        { band: 8,  gain: 0.05  },
                        { band: 9,  gain: 0.07  },
                        { band: 10, gain: 0.06  },
                        { band: 11, gain: 0.04  },
                        { band: 12, gain: 0.03  },
                        { band: 13, gain: 0.02  }
                    ],
                    rotation: { rotationHz: 0.08 },
                    vibrato: { frequency: 4.0, depth: 0.05 }
                });
                player.data.set('dolbyatmos', true);
                return send(`${client.emoji.filters} **| Enabled Dolby Atmos**`);
            }
            if (data === true) {
                await player.shoukaku.clearFilters();
                player.data.set('dolbyatmos', false);
                return send(`${client.emoji.cross} **| Disabled Dolby Atmos**`);
            }
        } catch (e) { console.log(e) }
    }
}
module.exports = DolbyAtmos;
