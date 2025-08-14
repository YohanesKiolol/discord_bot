const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const vccreate = require("../schema/vccreate");
const vccreateuser = require("../schema/vccreateuser");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    console.log("🔊 VoiceStateUpdate event triggered!");
    console.log(`User: ${newState.member?.user?.username || "Unknown"}`);
    console.log(
      `Old channel: ${oldState.channel?.name || "None"} (${
        oldState.channel?.id || "None"
      })`
    );
    console.log(
      `New channel: ${newState.channel?.name || "None"} (${
        newState.channel?.id || "None"
      })`
    );

    // Delete VC when user leaves or moves to a different channel (run this FIRST)
    if (oldState.channel && oldState.channel.id !== newState.channel?.id) {
      console.log(
        `🗑️ Deletion logic triggered for channel: ${oldState.channel.name} (${oldState.channel.id})`
      );

      // Check if this is a temporary channel and remove user data immediately
      const userData = await vccreateuser.findOne({
        Channel: oldState.channel.id,
      });

      if (userData) {
        console.log(
          `✅ Found user data for channel ${oldState.channel.id}, owned by user ${userData.User}`
        );

        // Remove the user data immediately to allow new channel creation
        await vccreateuser.deleteOne({ Channel: oldState.channel.id });
        console.log(`🗃️ Removed user data from database immediately`);

        // Small delay to ensure Discord API updates the member count, then delete channel
        setTimeout(async () => {
          console.log(
            `🔍 Checking if channel ${oldState.channel.id} should be deleted...`
          );

          const channel = await oldState.guild.channels.resolve(
            oldState.channel.id
          );

          if (!channel) {
            console.log(`❌ Channel ${oldState.channel.id} no longer exists`);
            return; // Only return from setTimeout, not the main function
          }

          console.log(
            `📊 Channel ${channel.name} has ${channel.members.size} members`
          );

          // Check if channel exists and is empty
          if (channel.members.size === 0) {
            console.log(
              `🗑️ Deleting empty temporary channel: ${channel.name} (${channel.id})`
            );
            await channel.delete().catch((err) => {
              console.error("Failed to delete voice channel:", err);
            });
          } else {
            console.log(
              `⏳ Channel ${channel.name} still has ${channel.members.size} members, transferring ownership`
            );

            // Transfer ownership to the first remaining member
            const remainingMembers = Array.from(channel.members.values());
            const newOwner = remainingMembers[0];

            if (newOwner) {
              console.log(
                `👑 Transferring ownership to ${newOwner.user.username} (${newOwner.id})`
              );

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

              console.log(`✅ Channel renamed to: ${newChannelName}`);
            }
          }
        }, 200); // 0.2 second delay to let Discord API update
      } else {
        console.log(
          `❌ No user data found for channel ${oldState.channel.id}, not a temporary channel`
        );
      }
    }

    // Create VC when user joins the designated trigger channel (run this SECOND)
    if (
      newState.channel &&
      (!oldState.channel || oldState.channel.id !== newState.channel.id)
    ) {
      const serverData = await vccreate.findOne({ Guild: newState.guild.id });
      if (!serverData || newState.channel.id !== serverData.Channel) return;

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
  },
};
