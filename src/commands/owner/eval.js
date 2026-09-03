import { PREFIX } from "../../config.js";
import util from "util";

export default {
  name: "eval",
  description: "Executa código JavaScript diretamente",
  commands: ["ev", "exec"],
  usage: `${PREFIX}eval <code>`,
  handle: async ({ fullArgs, reply, client, message }) => {
    if (!fullArgs) return await reply("❌ Envie um código para executar.");

    try {
      let evaled = eval(fullArgs);
      if (evaled instanceof Promise) evaled = await evaled;

      let result = util.inspect(evaled, { depth: 1 });
      if (result.length > 1900) result = result.slice(0, 1900) + "...";

      await reply(`\`\`\`javascript\n${result}\n\`\`\``);
    } catch (err) {
      await reply(`❌ **Erro:** \`\`\`javascript\n${err.message}\n\`\`\``);
    }
  },
};
