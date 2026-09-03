import { AttachmentBuilder } from "discord.js";

export function loadCommonFunctions({ message }) {
  const reply = async (content, options = {}) => {
    if (typeof content === "string") {
      if (content.length > 2000) {
        return await message.reply({
          content: content.slice(0, 1990) + "...",
          ...options,
        });
      }
      return await message.reply({ content, ...options });
    }
    return await message.reply({ ...content, ...options });
  };

  const sendPresenceAndReply = async (text, delayMs = 600) => {
    await message.channel.sendTyping();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return await reply(text);
  };

  const sendReact = async (emoji) => {
    try {
      return await message.react(emoji);
    } catch {
      return null;
    }
  };

  const sendAudio = async (audioBuffer, filename = "audio.mp3") => {
    const attachment = new AttachmentBuilder(audioBuffer, { name: filename });
    return await message.reply({ files: [attachment] });
  };

  return {
    reply,
    sendPresenceAndReply,
    sendReact,
    sendAudio,
  };
}
