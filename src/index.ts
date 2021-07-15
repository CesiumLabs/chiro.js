import { Client, Constants } from "discord.js";
import { Manager } from "./structures/Manager";
import { Payload, TrackData } from "./Static/Interfaces";
const client = new Client();

const manager = new Manager({
    node: {
        host: "localhost",
        password: "SwagLordNitroUser12345",
        port: 3000,
    },
    send(id: string, payload: Payload) {
        const guild = client.guilds.cache.get(id);
        console.log(payload);
        guild.shard.send(payload);
    },
});

client.login("ODUxMDYxNTk3ODUzMDU3MDQ2.YLyy4A.vqVckMMSVONYk6GRZn-9OhKnj78");
client.on("ready", () => {
    console.log("Bot Online");
    manager.init(client.user.id);
});
client.on("message", async (message) => {
    if (message.content === "!hello") {
        const player = manager.create({
            guild: message.guild.id,
            voiceChannel: message.member.voice.channel.id,
            textChannel: message.channel.id,
        });
        await player.connect();
        const res = await player.search(
            { query: "Human", identifier: "ytsearch" },
            message.author
        );
        player.queue.add(res.tracks[0]);
        await player.play();
    }
});

client.on("raw", (d) => {
    manager.updateVoiceState(d);
});
