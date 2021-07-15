import { Client } from "discord.js";
import { Manager } from "./structures/Manager";
import { Payload } from "./Static/Interfaces";
const client = new Client();

const manager = new Manager({
    node: {
        host: "localhost",
        password: "SwagLordNitroUser12345",
        port: 3000,
    },
    send(id: string, payload: Payload) {
        const guild = client.guilds.cache.get(id);
        guild.shard.send(payload.d);
    },
});

client.login("ODUxMDYxNTk3ODUzMDU3MDQ2.YLyy4A.Nkx0PJHBIPdp8o_u8tgbPKdqzj4");
client.on("ready", () => {
    console.log("Bot Online");
    manager.init(client.user.id);
});
client.on("message", (message) => {
    if (message.content === "!hello") {
        const player = manager.create({
            guild: message.guild.id,
            voiceChannel: message.member.voice.channel.id,
            textChannel: message.channel.id,
        });
        player.connect();
    }
});
