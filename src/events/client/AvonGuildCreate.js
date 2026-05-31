const AvonClientEvent = require(`../../structures/Eventhandler`);

class AvonGuildCreate extends AvonClientEvent{
    get name(){ return 'guildCreate' }
    async run(guild){
        try{
            this.client.data.set(`${guild.id}-247`, `disabled`);
            this.client.data.set(`${guild.id}-autoPlay`, `disabled`);
            this.client.data2.set(`noprefix_${guild.id}`, []);
            console.log(`[GUILD] Joined: ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`);
        } catch(e){ console.log(e) }
    }
}
module.exports = AvonGuildCreate;
