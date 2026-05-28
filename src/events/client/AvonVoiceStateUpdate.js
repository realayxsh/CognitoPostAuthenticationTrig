const delay = require(`delay`);
const AvonClientEvent = require("../../structures/Eventhandler");

class AvonVoiceStateUpdate extends AvonClientEvent{
    get name(){
        return 'voiceStateUpdate';
    }
    async run(os,ns){
        let guild = ns.guild || os.guild;
        let player = this.client.poru.players.get(guild.id);
        if(!player) return;

        if(ns.guild.members.me.serverMute === true) ns.guild.members.me.voice.setMute(false);

        if(os.id === this.client.user.id){
            if(!ns.channelId){
                player.destroy();
            }
            return;
        }
    }
}
module.exports = AvonVoiceStateUpdate;