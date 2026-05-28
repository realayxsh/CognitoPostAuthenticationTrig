const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Sources extends AvonCommand{
    get name(){ return 'sources' }
    get aliases(){ return ['source'] }
    get vote(){ return true; }
    get cat(){ return 'info' }
    async run(client, message, args, prefix){
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**__Supported Sources__**\n\n\`Spotify\`, \`Apple Music\`, \`SoundCloud\`, \`Deezer\``
            ));
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = Sources;
