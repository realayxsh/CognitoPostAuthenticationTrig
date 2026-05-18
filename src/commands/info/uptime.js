const AvonCommand = require("../../structures/avonCommand");
const moment = require(`moment`);
require(`moment-duration-format`);
class Uptime extends AvonCommand{
    get name(){
        return 'uptime';
    }
    get aliases(){
        return ['upt']
    }
    get cat(){
        return 'info'
    }
    async run(client, message, args, prefix){
        try{
            let uptime = moment.duration(client.uptime).format(`D[d] H[h] m[m] s[s]`);
            return message.channel.send({content: `${client.emoji.uptime} | My Uptime: \`${uptime}\``});
        } catch(e){ console.log(e); }
    }
}
module.exports = Uptime;