const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Concert extends AvonCommand {
    get name() { return 'concert' }
    get aliases() { return null; }
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
        let data = player.data.get(`concert`);
        if (!data || data === false || data === undefined) {
            await player.shoukaku.setFilters({
                equalizer: [
                    { band: 0,  gain: 0.06 },
                    { band: 1,  gain: 0.08 },
                    { band: 2,  gain: 0.10 },
                    { band: 3,  gain: 0.08 },
                    { band: 4,  gain: 0.05 },
                    { band: 5,  gain: 0.03 },
                    { band: 6,  gain: 0.02 },
                    { band: 7,  gain: 0.03 },
                    { band: 8,  gain: 0.05 },
                    { band: 9,  gain: 0.07 },
                    { band: 10, gain: 0.06 },
                    { band: 11, gain: 0.04 },
                    { band: 12, gain: 0.02 },
                    { band: 13, gain: 0.01 }
                ],
                lowPass: { smoothing: 8.0 },
                tremolo: { frequency: 2.0, depth: 0.08 }
            });
            player.data.set(`concert`, true);
            return send(`${client.emoji.filters} **| Enabled Concert**`);
        }
        if (data === true) {
            await player.shoukaku.clearFilters();
            player.data.set(`concert`, false);
            return send(`${client.emoji.cross} **| Disabled Concert**`);
        }
    }
}
module.exports = Concert;
