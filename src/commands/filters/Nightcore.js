const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Nightcore extends AvonCommand {
    get name() { return 'nightcore' }
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
        let data = player.data.get(`night`);
        if (!data || data == false || data == undefined) {
            await player.shoukaku.setFilters({ timescale: { speed: 1.1, pitch: 1.125, rate: 1.05 } });
            player.data.set(`night`, true);
            return send(`**| Enabled Nightcore**`);
        }
        if (data == true) {
            player.data.set(`night`, false);
            await player.shoukaku.setFilters({ timescale: null });
            return send(`**| Disabled Nightcore**`);
        }
    }
}
module.exports = Nightcore;
