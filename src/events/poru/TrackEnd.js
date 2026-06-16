const AvonClientEvent = require("../../structures/Eventhandler");

class TrackEnd extends AvonClientEvent{
    get name(){
        return 'playerEnd';
    }
    async run(player, track){
        try{
            if(track) player.data.set('previousTrack', track);
            player.data.get('music')?.delete().catch(() => {});
        } catch(e){}
    }
}
module.exports = TrackEnd;
