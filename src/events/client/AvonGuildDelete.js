const AvonClientEvent = require("../../structures/Eventhandler");

class AvonGuildDelete extends AvonClientEvent{
    get name(){ return 'guildDelete'; }
    async run(guild){
        this.client.data2.delete(`noprefix_${guild.id}`);
        this.client.data.delete(`${guild.id}-247`);
        this.client.data.delete(`${guild.id}-autoPlay`);
        console.log(`[GUILD] Left: ${guild.name} (${guild.id})`);
    }
}
module.exports = AvonGuildDelete;
