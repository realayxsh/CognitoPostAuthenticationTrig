const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Chipmunk extends AvonCommand {
    get name() { return 'chipmunk'; }
    get vote() { return true; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters'; }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
        const accentColor = parseInt(client.config.color.replace('#', ''), 16);
        const send = (text) => {
            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        let data = player.data.get(`chip`);
        if (!data || data == false || data == undefined) {
            player.send({ guildId: message.guild.id, op: 'filters', timescale: { speed: 1.05, pitch: 1.35, rate: 1.25 } });
            player.data.set(`chip`, true);
            return send(`**| Enabled Chipmunk**`);
        }
        if (data == true) {
            player.data.set(`chip`, false);
            player.send({ guildId: message.guild.id, op: 'filters', timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 } });
            return send(`**| Disabled Chipmunk**`);
        }
    }
}
module.exports = Chipmunk;
