const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Ping extends AvonCommand {
    get name(){ return 'ping' }
    get cat(){ return 'info' }
    async run(client, message, args, prefix){
        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `**${client.user.username} — Ping**\n\n` +
                        `${client.emoji.ping || '🏓'} **Pong!** — \`${client.ws.ping} ms\`\n\n` +
                        `-# Requested by ${message.author.tag}`
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
            );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = Ping;
