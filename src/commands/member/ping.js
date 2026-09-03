import { PREFIX } from "../../config.js";

export default {
  name: "ping",
  description: "Testa a latência e status do bot",
  commands: ["p", "latencia"],
  usage: `${PREFIX}ping`,
  handle: async ({ reply, sendReact, client, message }) => {
    await sendReact("⚡");
    const ping = Date.now() - message.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);
    await reply(`🏓 **Pong!**\n⏱️ Resposta: \`${ping}ms\` | Gateway: \`${apiPing}ms\``);
  },
};
