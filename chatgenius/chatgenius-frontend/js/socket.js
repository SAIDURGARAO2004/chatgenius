let socket;

function connectSocket() {
  socket = io(CONFIG.SOCKET_URL, {
    auth: {
      token: localStorage.getItem("token")
    }
  });

  socket.on("new_message", msg => {
    console.log("New real-time message received:", msg);
    if (typeof addMessage === 'function') {
      if (String(msg.conversation_id) === String(window.selectedChatId)) {
        const currentUserId = localStorage.getItem("userId");
        const isAI = msg.role === "ai" || msg.username === "ChatGenius";
        const isOtherUser = String(msg.user_id) !== String(currentUserId);
        
        // Add to UI if it's from AI or from another user
        if (isAI || isOtherUser) {
          const type = isAI ? "ai" : "user";
          addMessage(type, msg.text, msg.id, msg.created_at);
        }
      }
    }
  });

  socket.on("ai_typing", data => {
    if (String(data.conversation_id) === String(window.selectedChatId)) {
      if (data.is_typing) {
        if (typeof showTypingIndicator === 'function') showTypingIndicator();
      } else {
        if (typeof hideTypingIndicator === 'function') hideTypingIndicator();
      }
    }
  });

  socket.on("group_updated", data => {
    console.log("Group updated:", data);
    // Update local state if it exists
    if (window.groupChats) {
      const group = window.groupChats.find(g => String(g.id) === String(data.id));
      if (group) {
        group.title = data.title;
        if (typeof renderGroupChats === 'function') renderGroupChats();
        
        // Update header if active
        if (String(window.selectedChatId) === String(data.id)) {
           const titleEl = document.getElementById("activeChatTitle");
           if (titleEl) titleEl.innerText = data.title;
        }
      }
    }
  });

  socket.on("typing", user => {
    // Legacy typing indicator
    if (typeof showTypingIndicator === 'function') {
      showTypingIndicator();
      setTimeout(() => {
        if (typeof hideTypingIndicator === 'function') hideTypingIndicator();
      }, 1000);
    }
  });

  socket.on("reaction_added", data => {
    if (typeof renderReactionLocally === 'function') {
      renderReactionLocally(data.message_id, data.emoji, data.user_email);
    }
  });

  socket.on("reaction_removed", data => {
    // Implement logic to remove from UI if needed
    console.log("Reaction removed:", data);
  });
}


connectSocket();
