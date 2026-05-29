const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class SlowedReverb extends AvonCommand {
    get name() { return 'slowedreverb' }
    get aliases() { return ['slowed'] }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters' }
    get vote() { return true; }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
        const send = (text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        let data = player.data.get(`slowedreverb`);
        if (!data || data === false || data === undefined) {
            await player.shoukaku.setFilters({
                equalizer: [
                    { band: 0,  gain: 0.08 },
                    { band: 1,  gain: 0.06 },
                    { band: 2,  gain: 0.04 },
                    { band: 3,  gain: 0.02 },
                    { band: 4,  gain: 0.00 },
                    { band: 5,  gain: -0.01 },
                    { band: 6,  gain: -0.02 },
                    { band: 7,  gain: -0.02 },
                    { band: 8,  gain: 0.00 },
                    { band: 9,  gain: 0.02 },
                    { band: 10, gain: 0.03 },
                    { band: 11, gain: 0.03 },
                    { band: 12, gain: 0.02 },
                    { band: 13, gain: 0.01 }
                ],
                timescale: { speed: 0.78, pitch: 0.88, rate: 0.90 },
                lowPass: { smoothing: 12.0 },
                tremolo: { frequency: 1.5, depth: 0.12 }
            });
            player.data.set(`slowedreverb`, true);
            return send(`${client.emoji.filters} **| Enabled Slowed Reverb**`);
        }
        if (data === true) {
            await player.shoukaku.clearFilters();
            player.data.set(`slowedreverb`, false);
            return send(`${client.emoji.cross} **| Disabled Slowed Reverb**`);
        }
    }
}
module.exports = SlowedReverb;
