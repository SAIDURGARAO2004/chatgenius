function sendAI() {
  const input = document.getElementById("messageInput").value;
  addMessage("🤖 AI: Thinking...");

  setTimeout(() => {
    addMessage("🤖 AI: This is a Gemini AI response.");
  }, 1500);
}
