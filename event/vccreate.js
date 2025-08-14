const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const vccreate = require("../schema/vccreate");
const vccreateuser = require("../schema/vccreateuser");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    // Delete VC when user leaves or moves to a different channel (run this FIRST)
    if (oldState.channel && oldState.channel.id !== newState.channel?.id) {
      // Check if this is a temporary channel and remove user data immediately
      const userData = await vccreateuser.findOne({
        Channel: oldState.channel.id,
      });

      if (userData) {
        // Remove the user data immediately to allow new channel creation
        await vccreateuser.deleteOne({ Channel: oldState.channel.id });

        // Small delay to ensure Discord API updates the member count, then delete channel
        setTimeout(async () => {
          const channel = await oldState.guild.channels.resolve(
            oldState.channel.id
          );

          if (!channel) return;

          // Check if channel exists and is empty
          if (channel.members.size === 0) {
            await channel.delete().catch((err) => {
              console.error("Failed to delete voice channel:", err);
            });
          } else {
            // Transfer ownership to the first remaining member
            const remainingMembers = Array.from(channel.members.values());
            const newOwner = remainingMembers[0];

            if (newOwner) {
              // Create new ownership record for the first remaining member
              await vccreateuser.create({
                Guild: newState.guild.id,
                Channel: channel.id,
                User: newOwner.id,
              });

              // Rename channel to reflect new owner
              const newOwnerName =
                newOwner.displayName || newOwner.user.displayName;
              const newChannelName = `${newOwnerName}'s Channel`;

              await channel.setName(newChannelName).catch((err) => {
                console.error("Failed to rename channel:", err);
              });
            }
          }
        }, 200); // 0.2 second delay to let Discord API update
      }
    }

    // Create VC when user joins any designated trigger channel (run this SECOND)
    if (
      newState.channel &&
      (!oldState.channel || oldState.channel.id !== newState.channel.id)
    ) {
      // Check if the new channel is any of the trigger channels
      const triggerChannelData = await vccreate.findOne({
        Guild: newState.guild.id,
        Channel: newState.channel.id,
      });

      if (!triggerChannelData) return; // Not a trigger channel

      // Check if user already owns a temporary channel
      const existingUserData = await vccreateuser.findOne({
        User: newState.member.id,
        Guild: newState.guild.id,
      });

      // If user already owns a channel, don't create a new one
      if (existingUserData) return;

      // Use the user's display name (nickname if available, otherwise username) + "'s Channel"
      const userName =
        newState.member.displayName || newState.member.user.displayName;
      const channelName = `${userName}'s Channel`;

      const channel = await newState.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: triggerChannelData.Category,
        userLimit: triggerChannelData.Limit || 0,
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
  },
};
