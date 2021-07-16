<div align="center">
  <br />
  <p>
    <a href="https://chirojs.openian.dev"><img src="https://menhera-chan.in/img/Chiro.JS.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://menhera-chan.in/support"><img src="https://img.shields.io/discord/735899211677041099?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/chiro.js"><img src="https://img.shields.io/npm/v/chiro.js.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/chiro.js"><img src="https://img.shields.io/npm/dt/chiro.js.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://www.patreon.com/rohank05"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
</div>

## About

Chiro.js is a powerful [Node.js](https://nodejs.org) module that allows you to easily interact with the
[Nexus](https://github.com/DevSnowflake/Nexus). Chiro.js is highly inspired from [Erela.JS](https://github.com/MenuDocs/erela.js) which is a module for lavalink.


## Installation

**Node.js 14.0.0 or newer is required.**  

```sh-session
npm install chiro.js
```

## Example usage

```js
const { Client } = require("discord.js");
const { Manager } = require("chiro.js");
const client = new Client();
const manager = new Manager({    
    nodes:      
        {
            host: "localhost",
            port: 3000,
            password: "mostsecurepassword",
        },
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
}).on("trackStart", (player, track) => {
    console.log(`${track.title} has started`);
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    if (message.content === "play") {
        const player = manager.create({
            guild: message.guild.id,
            textChannel: message.channel.id,
            voiceChannel: message.member.voice.channel.id,
        });
        const res = await player.send({
            query: "play that funky music",
        });

        player.queue.add(res.tracks[0]);
        player.play();
    }
});

client.on('raw', (d)=>{
    manager.updateVoiceState(d);
})

client.login("token");
```

## Links

- [Website](https://chirojs.openian.dev/)
- [Documentation](https://chirojs.openian.dev/)
- [Discord server](https://menhera-chan.in/support)
- [Nexus Discord server](https://discord.gg/snowflakedev)
- [GitHub](https://github.com/OpenianDevelopment/chiro.js)
- [NPM](https://www.npmjs.com/package/chiro.js)


## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle
nudge in the right direction, please don't hesitate to join our official [Chiro.js Server](https://menhera-chan.in/support).

## Notice
The documentation is WIP. This is just a temporary docs