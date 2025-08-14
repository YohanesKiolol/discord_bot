const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const vccreate = require("../schema/vccreate");
const vccreateuser = require("../schema/vccreateuser");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    // Create VC
    if (!oldState.channel && newState.channel) {
      const serverData = await vccreate.findOne({ Guild: newState.guild.id });
      if (!serverData || newState.channel.id !== serverData.Channel) return;

      const channel = await newState.guild.channels.create({
        name: serverData.Name,
        type: ChannelType.GuildVoice,
        parent: serverData.Category,
        userLimit: serverData.Limit || 0,
      });

      await vccreateuser.create({
        Guild: newState.guild.id,
        Channel: channel.id,
        User: newState.member.id,
      });

      await newState.member.voice.setChannel(channel).catch((err) => {
        console.error("Failed to move user to new voice channel:", err);
      });
    }

    // Delete VC
    if (oldState.channel && !newState.channel) {
      const userData = await vccreateuser.findOne({
        Channel: oldState.channel.id,
      });
      if (!userData) return;

      const channel = await oldState.guild.channels.resolve(
        oldState.channel.id
      );
      if (channel && channel.members.size === 0) {
        await vccreateuser.deleteOne({ Channel: oldState.channel.id });
        await channel.delete().catch((err) => {
          console.error("Failed to delete voice channel:", err);
        });
      }
    }
  },
};
