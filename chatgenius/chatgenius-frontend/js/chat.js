let selectedChatId = null;
let selectedChatType = null; // "private" or "group"
chatList.innerHTML += renderChatItem(chat,"private");
groupChatList.innerHTML += renderChatItem(chat,"group");

files.forEach(file => {
  const msg = {
    role: "user",
    text: `📎 ${file.name}`
  };
  setMessages(prev => [...prev, msg]);
});


function openSmartMenu(e, chatId) {
  e.stopPropagation();

  const rect = e.currentTarget.getBoundingClientRect();

  const MENU_WIDTH = 240;
  const MENU_HEIGHT = 280;
  const GAP = 8;

  let left = rect.right + GAP;
  let top = rect.top;

  // If going out of right screen → push left
  if (left + MENU_WIDTH > window.innerWidth) {
    left = rect.left - MENU_WIDTH - GAP;
  }

  // If not enough space below → open upward
  if (rect.bottom + MENU_HEIGHT > window.innerHeight) {
    top = rect.bottom - MENU_HEIGHT;
  }

  // If still goes above screen → clamp to top
  if (top < GAP) {
    top = GAP;
  }

  setMenuPosition({ top, left });
  setOpenChatMenuId(chatId);
}

/* ================= USER-SPECIFIC STORAGE ================= */

// Get current logged-in user's email
function getCurrentUserEmail() {
  return localStorage.getItem("userEmail") || null;
}

// Get user-specific storage key
function getUserStorageKey(baseKey) {
  const email = getCurrentUserEmail();
  return email ? `${baseKey}_${email}` : baseKey;
}

// Validate user is logged in before loading chat data
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = getCurrentUserEmail();
  
  // Redirect to login if no user is logged in
  if (!currentUser) {
    console.warn("No user logged in, redirecting to login page");
    window.location.href = "login.html";
    return;
  }
  
  // Log current user for debugging
  console.log(`Loading chat data for user: ${currentUser}`);
});

// Initialize empty chats (to be filled from backend)
let chats = [];
let groupChats = [];
let activeChatIndex = null;
let activeGroupChatIndex = null;

// ✅ FETCH CHATS FROM BACKEND
async function fetchUserConversations() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Separate into private and group chats based on type
      chats = data.filter(c => c.type === "direct").map(c => ({
        id: c.id,
        title: c.name || `Chat ${c.id}`,
        messages: [], // will be fetched on demand
        type: "direct"
      }));

      groupChats = data.filter(c => c.type === "group").map(c => ({
        id: c.id,
        title: c.name || `Group Chat ${c.id}`,
        messages: [], // will be fetched on demand
        type: "group"
      }));

      renderChats();
      if (groupChats.length > 0) {
        const groupSection = document.getElementById("groupChatsSection");
        if (groupSection) groupSection.style.display = "block";
        renderGroupChats();
      }
    }
  } catch (err) {
    console.error("Error fetching conversations:", err);
  }
}

function updateChatUIState() {
  const welcomeScreen = document.getElementById("welcomeScreen");
  const chatHeader = document.getElementById("chatHeader");
  const messagesArea = document.getElementById("messages");
  const chatInputArea = document.getElementById("chatInputArea");
  
  if (activeChatIndex === null && activeGroupChatIndex === null) {
    if (welcomeScreen) welcomeScreen.style.display = "flex";
    if (chatHeader) chatHeader.style.display = "none";
    if (messagesArea) messagesArea.style.display = "none";
    if (chatInputArea) chatInputArea.style.display = "none";
  } else {
    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (chatHeader) chatHeader.style.display = "flex";
    if (messagesArea) messagesArea.style.display = "block";
    if (chatInputArea) chatInputArea.style.display = "flex";
  }
}


/* ================= BASIC CHAT ================= */

const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");

function isImageRequest(text) {
  const keywords = [
    "draw",
    "image",
    "picture",
    "photo",
    "generate image",
    "create image",
    "make an image",
    "illustration"
  ];

  return keywords.some(k => text.toLowerCase().includes(k));
}

const newGroupChat = {
  id: Date.now(),
  title: "New Group Chat",
  isGroup: true,
  members: [],
  messages: [],     // 🔥 important
  createdAt: new Date().toISOString()
};

/* ================= MESSAGE & FILE PERSISTENCE ================= */

// Save message input to localStorage
function saveDraftMessage() {
  const userEmail = getCurrentUserEmail();
  const draftKey = `draft_message_${userEmail}`;
  localStorage.setItem(draftKey, messageInput.value);
}

// Restore message input from localStorage
function restoreDraftMessage() {
  const userEmail = getCurrentUserEmail();
  const draftKey = `draft_message_${userEmail}`;
  const draft = localStorage.getItem(draftKey);
  if (draft && messageInput) {
    messageInput.value = draft;
  }
}

// Clear draft message
function clearDraftMessage() {
  const userEmail = getCurrentUserEmail();
  const draftKey = `draft_message_${userEmail}`;
  localStorage.removeItem(draftKey);
}

// Save selected files to localStorage
function saveDraftFiles(filesData) {
  const userEmail = getCurrentUserEmail();
  const filesKey = `draft_files_${userEmail}`;
  localStorage.setItem(filesKey, JSON.stringify(filesData));
}

// Get draft files
function getDraftFiles() {
  const userEmail = getCurrentUserEmail();
  const filesKey = `draft_files_${userEmail}`;
  const data = localStorage.getItem(filesKey);
  return data ? JSON.parse(data) : [];
}

// Clear draft files
function clearDraftFiles() {
  const userEmail = getCurrentUserEmail();
  const filesKey = `draft_files_${userEmail}`;
  localStorage.removeItem(filesKey);
}

/* ================= TYPING INDICATOR ================= */

let typingIndicatorElement = null;

/* Show typing indicator */
function showTypingIndicator() {
  // Remove existing typing indicator if any
  hideTypingIndicator();
  
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typingIndicator";
  indicator.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;
  
  messagesDiv.appendChild(indicator);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  typingIndicatorElement = indicator;
}

/* Hide typing indicator */
function hideTypingIndicator() {
  if (typingIndicatorElement) {
    typingIndicatorElement.remove();
    typingIndicatorElement = null;
  }
}

/* ===== GLOBAL STAGED-FILES STORE ===== */
let stagedFiles = []; // { type, name, size?, dataUrl?, rawFile? }

/* Render the staging-preview strip above the input */
function renderAttachmentPreview() {
  const strip = document.getElementById("attachmentPreview");
  if (!strip) return;

  if (stagedFiles.length === 0) {
    strip.style.display = "none";
    strip.innerHTML = "";
    return;
  }

  strip.style.display = "flex";
  strip.innerHTML = "";

  stagedFiles.forEach((f, idx) => {
    const badge = document.createElement("div");
    badge.className = "attachment-badge";

    const sizeText = f.size ? `${(f.size / 1024).toFixed(1)} KB` : "";

    if (f.type === "image" && f.dataUrl) {
      badge.innerHTML = `
        <img class="badge-thumb" src="${f.dataUrl}" alt="${f.name}" />
        <div class="badge-info">
          <span class="badge-name">${f.name}</span>
          <span class="badge-size">${sizeText}</span>
        </div>
        <button class="badge-remove" title="Remove">✕</button>
      `;
    } else {
      const icon = getFileIcon(f.name);
      badge.innerHTML = `
        <span class="badge-icon">${icon}</span>
        <div class="badge-info">
          <span class="badge-name">${f.name}</span>
          <span class="badge-size">${sizeText}</span>
        </div>
        <button class="badge-remove" title="Remove">✕</button>
      `;
    }

    badge.querySelector(".badge-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      stagedFiles.splice(idx, 1);
      renderAttachmentPreview();
    });

    strip.appendChild(badge);
  });
}

/* Helper: pick an emoji icon based on file extension */
function getFileIcon(name) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map = {
    pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    ppt: "📊", pptx: "📊", txt: "📋", csv: "📋",
    zip: "🗜", rar: "🗜", mp3: "🎵", mp4: "🎬", mov: "🎬",
    json: "🔧", py: "🐍", js: "📜", html: "🌐", css: "🎨"
  };
  return map[ext] || "📎";
}

/* Send message (button / enter) */
async function sendMessage() {
  const message = messageInput.value.trim();
  const hasFiles = stagedFiles.length > 0;

  // Must have either text or files
  if (!message && !hasFiles) return;

  // --- 1. Build and show the user bubble with file cards + text ---
  const userBubble = document.createElement("div");
  userBubble.className = "msg user";

  let bubbleHTML = "";

  if (hasFiles) {
    stagedFiles.forEach(f => {
      const sizeText = f.size ? `${(f.size / 1024).toFixed(1)} KB` : "";
      if (f.type === "image" && f.dataUrl) {
        bubbleHTML += `
          <div class="msg-file-card">
            <img class="fc-thumb" src="${f.dataUrl}" alt="${f.name}" />
            <div class="fc-info">
              <div class="fc-name">${f.name}</div>
              <div class="fc-meta">🖼 Image · ${sizeText}</div>
            </div>
          </div>`;
      } else {
        const icon = getFileIcon(f.name);
        const ext = (f.name.split(".").pop() || "file").toUpperCase();
        bubbleHTML += `
          <div class="msg-file-card">
            <span class="fc-icon">${icon}</span>
            <div class="fc-info">
              <div class="fc-name">${f.name}</div>
              <div class="fc-meta">${ext} · ${sizeText}</div>
            </div>
          </div>`;
      }
    });
  }

  if (message) {
    bubbleHTML += `<div class="msg-text" style="margin-top:${hasFiles ? '6px' : '0'}">${message}</div>`;
  }

  userBubble.innerHTML = bubbleHTML;
  messagesDiv.appendChild(userBubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Save to chat history
  if (hasFiles) {
    for (const f of filesSnapshot) {
      if (f.type === "image") {
        await saveMessage("user", JSON.stringify({ type: "image", src: f.dataUrl, name: f.name }));
      } else {
        await saveMessage("user", JSON.stringify({ type: "file", name: f.name, size: f.size }));
      }
    }
  }
  if (message) await saveMessage("user", message);

  // --- 2. Clear inputs & strip ---
  messageInput.value = "";
  clearDraftMessage();
  clearDraftFiles();

  const filesSnapshot = [...stagedFiles];
  stagedFiles = [];
  renderAttachmentPreview();

  // --- 3. Show typing indicator ---
  showTypingIndicator();

  // --- 4. Check if it's a pure image-generate request (no files attached) ---
  if (!hasFiles && isImageRequest(message)) {
    await generateImageFromChat(message);
    hideTypingIndicator();
    return;
  }

  // --- 5. Build the AI prompt ---
  let aiPrompt = message || "";

  if (hasFiles) {
    const fileDescriptions = filesSnapshot.map(f => {
      const sizeText = f.size ? `${(f.size / 1024).toFixed(1)} KB` : "";
      const typeLabel = f.type === "image" ? "image" : (f.name.split(".").pop() || "file").toUpperCase() + " file";
      return `${f.name} (${typeLabel}${sizeText ? ", " + sizeText : ""})`;
    }).join("; ");

    const fileCount = filesSnapshot.length;
    const hasImages = filesSnapshot.some(f => f.type === "image");

    const contextLine = `The user has attached ${fileCount} file(s): ${fileDescriptions}. `;

    if (!message) {
      // No text typed — ask AI to describe/acknowledge the files
      if (hasImages) {
        aiPrompt = contextLine + "Please describe what type of image(s) this is and any details you can infer from the filename and format. Give useful information about the file.";
      } else {
        aiPrompt = contextLine + "Please describe what these files likely contain and give useful information about them based on their names, sizes, and types.";
      }
    } else {
      // User typed a question too
      aiPrompt = contextLine + "User's question: " + message;
    }
  }

  // --- 6. Call AI ---
  try {
    const response = await fetch(`${CONFIG.API_URL}/ai/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ message: aiPrompt })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const reply = data.reply || "Sorry, I couldn't generate a response.";

    hideTypingIndicator();
    addMessage("ai", reply);
    await saveMessage("ai", reply);
  } catch (error) {
    console.error("AI API Error:", error);
    hideTypingIndicator();
    addMessage("ai", "Sorry, I'm having trouble connecting. Please try again.");
  }
}

/* Enter key sends */
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    if (e.isComposing) return;
    e.preventDefault();
    sendMessage();
  }
});

/* ✅ Save message input on every keystroke */
messageInput.addEventListener("input", () => {
  saveDraftMessage();
});

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🙌"];

/* Add message to UI */
function addMessage(type, text, messageId = Date.now(), timestamp = null) {
  const msg = document.createElement("div");
  msg.className = `msg ${type}`;
  msg.dataset.id = messageId;

  if (!timestamp) {
    timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Handle both string and JSON content
  let displayContent = text;
  try {
    if (typeof text === 'string' && text.startsWith('{')) {
      const parsed = JSON.parse(text);
      if (parsed.type === "image") {
        displayContent = `<img src="${parsed.src}" alt="${parsed.name}" style="max-width: 300px; border-radius: 8px;" /><br>${parsed.name}`;
      } else if (parsed.type === "file") {
        displayContent = `📎 <strong>${parsed.name}</strong> (${(parsed.size / 1024).toFixed(1)} KB)`;
      }
    }
  } catch (e) {}

  msg.innerHTML = `
    <div class="msg-text">${displayContent}</div>
    <div class="msg-time">${timestamp}</div>
    <div class="msg-reactions"></div>
    <span class="msg-react-btn" onclick="toggleEmojiPicker(event, ${messageId})">😊</span>
    <div id="picker-${messageId}" class="emoji-picker-mini">
      ${EMOJIS.map(e => `<span class="emoji-option" onclick="handleReaction(${messageId}, '${e}')">${e}</span>`).join('')}
    </div>
  `;

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function toggleEmojiPicker(e, msgId) {
  e.stopPropagation();
  const picker = document.getElementById(`picker-${msgId}`);
  if (picker) {
    // Close other pickers 
    document.querySelectorAll('.emoji-picker-mini').forEach(p => {
      if (p !== picker) p.classList.remove('show');
    });
    picker.classList.toggle('show');
  }
}

// Close pickers on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.emoji-picker-mini').forEach(p => p.classList.remove('show'));
});

function handleReaction(msgId, emoji) {
  const currentUser = getCurrentUserEmail();
  console.log(`User ${currentUser} reacted with ${emoji} to message ${msgId}`);
  
  // Emit to socket
  if (typeof socket !== 'undefined' && socket) {
    socket.emit("add_reaction", {
      message_id: msgId,
      emoji: emoji,
      conversation_id: selectedChatId,
      user_email: currentUser
    });
  }

  // Local update (optimistic)
  renderReactionLocally(msgId, emoji, currentUser);
}

function renderReactionLocally(msgId, emoji, userEmail) {
  const msgEl = document.querySelector(`.msg[data-id="${msgId}"]`);
  if (!msgEl) return;

  const reactionsDiv = msgEl.querySelector('.msg-reactions');
  let badge = reactionsDiv.querySelector(`.reaction-badge[data-emoji="${emoji}"]`);

  if (badge) {
    let count = parseInt(badge.dataset.count) + 1;
    badge.dataset.count = count;
    badge.innerHTML = `${emoji} ${count}`;
  } else {
    badge = document.createElement('span');
    badge.className = 'reaction-badge';
    badge.dataset.emoji = emoji;
    badge.dataset.count = 1;
    badge.innerHTML = `${emoji} 1`;
    badge.onclick = () => removeReaction(msgId, emoji);
    reactionsDiv.appendChild(badge);
  }
}

function removeReaction(msgId, emoji) {
  // Logic to remove reaction and notify socket
  if (typeof socket !== 'undefined' && socket) {
    socket.emit("remove_reaction", {
      message_id: msgId,
      emoji: emoji,
      conversation_id: selectedChatId,
      user_email: getCurrentUserEmail()
    });
  }
}

/* Add image preview to UI */
function addImageMessage(dataUrl, fileName) {
  const msg = document.createElement("div");
  msg.className = "msg user file-preview";
  const messageId = Date.now();
  msg.dataset.id = messageId;
  
  msg.innerHTML = `
    <div class="msg-text">
      <img src="${dataUrl}" alt="${fileName}" style="max-width: 300px; max-height: 300px; border-radius: 8px; display: block;" />
      <div style="margin-top: 8px; font-size: 0.9em; color: #888;">${fileName}</div>
    </div>
    <div class="msg-reactions"></div>
    <span class="msg-react-btn" onclick="toggleEmojiPicker(event, ${messageId})">😊</span>
    <div id="picker-${messageId}" class="emoji-picker-mini">
      ${EMOJIS.map(e => `<span class="emoji-option" onclick="handleReaction(${messageId}, '${e}')">${e}</span>`).join('')}
    </div>
  `;
  
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* Add file attachment preview to UI */
function addFileMessage(file) {
  const msg = document.createElement("div");
  msg.className = "msg user file-preview";
  const messageId = Date.now();
  msg.dataset.id = messageId;
  
  const fileSize = (file.size / 1024).toFixed(2); // KB
  const fileName = file.name || 'Unknown file';
  
  msg.innerHTML = `
    <div class="msg-text">
      <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">📎</span>
        <div>
          <div style="font-weight: 500;">${fileName}</div>
          <div style="font-size: 0.85em; color: #888;">${fileSize} KB</div>
        </div>
      </div>
    </div>
    <div class="msg-reactions"></div>
    <span class="msg-react-btn" onclick="toggleEmojiPicker(event, ${messageId})">😊</span>
    <div id="picker-${messageId}" class="emoji-picker-mini">
      ${EMOJIS.map(e => `<span class="emoji-option" onclick="handleReaction(${messageId}, '${e}')">${e}</span>`).join('')}
    </div>
  `;
  
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* ================= SIMPLE AI LOGIC ================= */

function generateAIReply(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes("hello")) {
    return "Hello! How can I help you today?";
  }
  if (msg.includes("help")) {
    return "Sure 🙂 Tell me what you need help with.";
  }
  if (msg.includes("time")) {
    return "I can explain that clearly. What exactly do you want to know?";
  }

  return "That’s an interesting question. Let me explain it simply.";
}

/* ================= IMAGE GENERATION ================= */

/* Generate image from chat message */
async function generateImageFromChat(prompt) {
  try {
    // Show typing indicator instead of text message
    showTypingIndicator();
    
    const response = await fetch(`${CONFIG.API_URL}/ai/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.image_base64) {
      // Convert base64 to data URL
      const imageDataUrl = `data:image/png;base64,${data.image_base64}`;
      
      // Hide typing indicator before showing image
      hideTypingIndicator();
      
      // Display the image in chat
      const msg = document.createElement("div");
      msg.className = "msg ai";
      
      msg.innerHTML = `
        <div class="msg-text">
          <img src="${imageDataUrl}" alt="Generated image" style="max-width: 400px; max-height: 400px; border-radius: 8px; display: block;" />
          <div style="margin-top: 8px; font-size: 0.9em; color: #888;">Generated image</div>
        </div>
      `;
      
      messagesDiv.appendChild(msg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      
      // Save the image message to database
      await saveMessage("ai", JSON.stringify({ type: "image", src: imageDataUrl, name: "Generated image" }));
    } else {
      throw new Error("No image data received");
    }
  } catch (error) {
    console.error("Image generation error:", error);
    hideTypingIndicator();
    addMessage("ai", "Sorry, I couldn't generate the image. Please try again or check if the API key is configured.");
  }
}

/* Open Images Mode */
function openImagesMode() {
  const imagesPanel = document.getElementById("imagesPanel");
  const messagesSection = document.getElementById("messages");
  
  if (imagesPanel && messagesSection) {
    // Toggle visibility
    if (imagesPanel.style.display === "none" || !imagesPanel.style.display) {
      imagesPanel.style.display = "block";
      messagesSection.style.display = "none";
    } else {
      imagesPanel.style.display = "none";
      messagesSection.style.display = "block";
    }
  }
}

/* Generate image from Images panel */
async function generateImage() {
  const promptInput = document.getElementById("imagePrompt");
  const imageGallery = document.getElementById("imageGallery");
  
  if (!promptInput || !imageGallery) return;
  
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Please enter a prompt for the image");
    return;
  }
  
  try {
    // Show loading indicator
    imageGallery.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">🎨 Generating image...</div>';
    
    const response = await fetch(`${CONFIG.API_URL}/ai/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.image_base64) {
      const imageDataUrl = `data:image/png;base64,${data.image_base64}`;
      
      // Display in gallery
      imageGallery.innerHTML = `
        <div style="text-align: center;">
          <img src="${imageDataUrl}" alt="${prompt}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
          <p style="margin-top: 16px; color: #888; font-size: 0.9em;">${prompt}</p>
        </div>
      `;
      
      // Clear the input
      promptInput.value = "";
    } else {
      throw new Error("No image data received");
    }
  } catch (error) {
    console.error("Image generation error:", error);
    imageGallery.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Failed to generate image. Please check your API key and try again.</div>';
  }
}


/* ================= AI TOOLS ================= */

function summarizeChat() {
  addMessage("ai", "Here is a concise summary of your conversation.");
}
function translateLastMessage() {
  addMessage("ai", "The last message has been translated.");
}
function explainLastMessage() {
  addMessage("ai", "Here is a clear explanation of the last message.");
}
function rewriteMessage() {
  addMessage("ai", "Here is a rewritten version of the message.");
}
function clearChat() {
  messagesDiv.innerHTML = "";
}


/* ================= SETTINGS ================= */

function openSettings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const modal = document.getElementById("accountModal");
  if (modal) {
    const nameInput = modal.querySelector('input[type="text"]');
    const emailInput = modal.querySelector('input[type="email"]');
    if (nameInput) nameInput.value = user.name || "User";
    if (emailInput) emailInput.value = user.email || "";
    modal.style.display = "flex";
  }
}

/* ================= SIDEBAR MORE TOOLS ================= */

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // ✅ RESTRUCTURE SIDEBAR FOR CHATGPT-STYLE SCROLLING
  // Get all sections except the first one (Online Users stays at top)
  const sections = Array.from(sidebar.querySelectorAll(".sidebar-section"));

  // Create scrollable wrapper
  const scrollableWrapper = document.createElement("div");
  scrollableWrapper.className = "sidebar-scrollable";

  // Move all sections into the scrollable wrapper
  sections.forEach(section => {
    scrollableWrapper.appendChild(section);
  });

  // Clear sidebar and add scrollable wrapper
  sidebar.innerHTML = "";
  sidebar.appendChild(scrollableWrapper);

  // ✅ CREATE SCROLL-TO-TOP BUTTON
  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.className = "scroll-to-top-btn";
  scrollToTopBtn.innerHTML = "▲";
  scrollToTopBtn.title = "Scroll to top";
  scrollableWrapper.appendChild(scrollToTopBtn);

  // ✅ SCROLL-TO-TOP BUTTON FUNCTIONALITY
  scrollableWrapper.addEventListener("scroll", () => {
    if (scrollableWrapper.scrollTop > 200) {
      scrollToTopBtn.classList.add("show");
    } else {
      scrollToTopBtn.classList.remove("show");
    }
  });

  // Click to scroll to top
  scrollToTopBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    scrollableWrapper.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // Wrapper for bottom tools
  const wrapper = document.createElement("div");
  wrapper.className = "sidebar-tools-wrapper";

  // Dropdown panel
  const toolsPanel = document.createElement("div");
  toolsPanel.id = "toolsPanel";
  toolsPanel.className = "tools-panel";

  toolsPanel.innerHTML = `
    <button onclick="summarizeChat(); closeMoreTools()">🧠 Summarize Chat</button>
    <button onclick="translateLastMessage(); closeMoreTools()">🌐 Translate</button>
    <button onclick="explainLastMessage(); closeMoreTools()">📖 Explain</button>
    <button onclick="rewriteMessage(); closeMoreTools()">✍️ Rewrite</button>
    <hr>
    <button onclick="clearChat(); closeMoreTools()" style="color:#ef4444;font-weight:600">
      🗑 Clear Chat
    </button>
  `;

  // Button
  const toolsBtn = document.createElement("button");
  toolsBtn.className = "sidebar-tools-btn";
  toolsBtn.innerHTML = `⚙️ More Tools <span id="moreToolsArrow">▲</span>`;


  toolsBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const arrow = document.getElementById("moreToolsArrow");
    const isOpen = toolsPanel.style.display === "flex";

    if (isOpen) {
      // CLOSE → arrow UP
      toolsPanel.style.display = "none";
      arrow.textContent = "▲";
    } else {
      // OPEN → arrow DOWN
      toolsPanel.style.display = "flex";
      arrow.textContent = "▼";
    }
  });
  wrapper.appendChild(toolsPanel);
  wrapper.appendChild(toolsBtn);
  sidebar.appendChild(wrapper);

  // Close on outside click
  document.addEventListener("click", () => closeMoreTools());
});

function closeMoreTools() {
  const panel = document.getElementById("toolsPanel");
  const arrow = document.getElementById("moreToolsArrow");

  if (panel) panel.style.display = "none";
  if (arrow) arrow.textContent = "▲"; // ✅ CLOSED = UP
}


/* ================= SETTINGS DROPDOWN ================= */

document.addEventListener("DOMContentLoaded", () => {
  const settingsSection = document.querySelector(".settings-section");
  if (!settingsSection) return;

  const title = settingsSection.querySelector("h4");
  const list = settingsSection.querySelector(".settings-list");

  list.style.display = "none";

  // Arrow element
  const arrow = document.createElement("span");
  arrow.textContent = "▼";
  arrow.style.marginLeft = "6px";
  title.appendChild(arrow);

  title.addEventListener("click", (e) => {
    e.stopPropagation();

    const isOpen = list.style.display === "block";

    // Toggle menu
    list.style.display = isOpen ? "none" : "block";

    // 🔥 THIS IS THE IMPORTANT PART
    arrow.textContent = isOpen ? "▼" : "▲";
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!settingsSection.contains(e.target)) {
      list.style.display = "none";
      arrow.textContent = "▼";
    }
  });
});


/* ================= PLUS (+) FILE / FOLDER PICKER ================= */

document.addEventListener("DOMContentLoaded", () => {
  const plusBtn = document.querySelector(".plus-inside");
  if (!plusBtn) return;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = "*/*";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  plusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    if (!files.length) return;

    let pending = 0; // track async readers

    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        pending++;
        const reader = new FileReader();
        reader.onload = () => {
          stagedFiles.push({
            type: "image",
            name: file.name,
            size: file.size,
            dataUrl: reader.result,
            rawFile: file
          });
          pending--;
          renderAttachmentPreview();
        };
        reader.readAsDataURL(file);
      } else {
        stagedFiles.push({
          type: "file",
          name: file.name,
          size: file.size,
          rawFile: file
        });
        renderAttachmentPreview();
      }
    });

    fileInput.value = "";
  });
});


/* ================= THEME TOGGLE ================= */

const themes = ["dark", "light", "dim", "blue"];
let currentThemeIndex = 0;

async function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  const token = localStorage.getItem("token");
  if (token) {
    try {
      await fetch(`${CONFIG.API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ theme_preference: theme })
      });
    } catch (err) {
      console.error("Error saving theme preference:", err);
    }
  }
}

// THEME MENU TOGGLE
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeMenu = document.getElementById("themeMenu");
  const themeArrow = document.getElementById("themeArrow");

  if (!themeToggle || !themeMenu || !themeArrow) return;

  let isThemeOpen = false;

  themeToggle.addEventListener("click", (e) => {
    e.stopPropagation();

    isThemeOpen = !isThemeOpen;

    themeMenu.style.display = isThemeOpen ? "block" : "none";
    themeArrow.textContent = isThemeOpen ? "▲" : "▼";
  });

  // Close theme menu on outside click
  document.addEventListener("click", () => {
    isThemeOpen = false;
    themeMenu.style.display = "none";
    themeArrow.textContent = "▼";
  });
});

// APPLY THEME
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  updateThemeTicks(theme);
}

// TICK UPDATE
function updateThemeTicks(active) {
  ["light", "dark", "blue"].forEach(t => {
    const tick = document.getElementById(`tick-${t}`);
    if (tick) tick.textContent = t === active ? "✔" : "";
  });
}

// LOAD SAVED THEME
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);
});


document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "dark";
  currentThemeIndex = themes.indexOf(saved);
  if (currentThemeIndex < 0) currentThemeIndex = 0;
  applyTheme(saved);
});

/* ================= ACCOUNT MODAL CLOSE ================= */

document.addEventListener("click", (e) => {
  const modal = document.getElementById("accountModal");
  const card = document.querySelector(".account-card");
  if (modal?.style.display === "flex" && !card.contains(e.target)) {
    modal.style.display = "none";
  }
});

/* ================= GROUP CHAT MODAL CLOSE ================= */

document.addEventListener("click", (e) => {
  const modal = document.getElementById("startGroupChatModal");
  const card = document.querySelector(".group-chat-card");
  if (modal?.style.display === "flex" && !card?.contains(e.target)) {
    modal.style.display = "none";
  }
});

/* ================= YEAR REVIEW MODAL CLOSE ================= */

document.addEventListener("click", (e) => {
  const modal = document.getElementById("yearReviewModal");
  const content = document.querySelector(".year-review-content");
  if (modal?.classList.contains("active") && !content?.contains(e.target)) {
    closeYearReview();
  }
});

// Close year review on ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("yearReviewModal");
    if (modal?.classList.contains("active")) {
      closeYearReview();
    }
  }
});


/* ================= CHAT ITEM MENU (⋯) ================= */

document.addEventListener("click", (e) => {
  // Close all open menus
  document.querySelectorAll(".chat-menu").forEach(menu => {
    menu.style.display = "none";
  });

  const btn = e.target.closest(".chat-more-btn");
  if (!btn) return;

  e.stopPropagation();
  const menu = btn.nextElementSibling;
  if (menu) menu.style.display = "flex";
});

async function renameChat(index) {
  const chat = chats[index];
  if (!chat || !chat.id) return;
  
  const name = prompt("Rename chat:", chat.title);
  if (!name) return;

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations/${chat.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      chat.title = name;
      renderChats();
    }
  } catch (err) {
    console.error("Error renaming chat:", err);
  }
}

async function deleteChat(index) {
  const chat = chats[index];
  if (!chat || !chat.id) return;

  const confirmDelete = confirm("Delete this chat?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations/${chat.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      chats.splice(index, 1);
      if (activeChatIndex === index) {
        activeChatIndex = null;
        messagesDiv.innerHTML = "";
      } else if (activeChatIndex > index) {
        activeChatIndex--;
      }
      renderChats();
      updateChatUIState();
    }
  } catch (err) {
    console.error("Error deleting chat:", err);
  }
}

function shareChat(index) {
  alert("Share feature coming soon 🚀");
}

function startGroupFromChat(index) {
  alert("Group chat from this chat coming soon 👥");
}

function pinChat(index) {
  alert("Pin chat coming soon 📌");
}

function archiveChat(index) {
  alert("Archive coming soon 🗄");
}


async function createNewChat() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "direct",
        name: `Chat ${chats.length + 1}`
      })
    });

    if (response.ok) {
      const newConv = await response.json();
      
      // Add locally and select
      chats.unshift({
        id: newConv.id,
        title: `Chat ${chats.length + 1}`,
        messages: []
      });

      activeChatIndex = 0;
      activeGroupChatIndex = null;
      renderChats();
      
      const titleEl = document.getElementById("activeChatTitle");
      if(titleEl) titleEl.innerText = chats[0].title;
      
      messagesDiv.innerHTML = "";
      updateChatUIState();
    }
  } catch (err) {
    console.error("Error creating chat:", err);
  }
}


async function loadChat(index) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const chat = chats[index];
  if (!chat || !chat.id) return;

  messagesDiv.innerHTML = "";
  activeChatIndex = index;
  activeGroupChatIndex = null;
  
  selectedChatId = chat.id;
  window.selectedChatId = selectedChatId;
  
  // Join real-time room
  if (typeof socket !== 'undefined' && socket) {
    socket.emit("join_conversation", { conversation_id: selectedChatId });
  }

  const titleEl = document.getElementById("activeChatTitle");
  if(titleEl) titleEl.innerText = chat.title;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/messages/conversation/${chat.id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const messages = await response.json();
      chat.messages = messages; // save locally for this session

      messages.forEach(m => {
        const type = String(m.sender_id) === localStorage.getItem("userId") ? "user" : "ai";
        
        try {
          const content = typeof m.content === 'string' && m.content.startsWith('{') ? JSON.parse(m.content) : null;
          if (content && content.type === "image") {
            renderImageMessage(content.src, content.name, m.created_at);
          } else if (content && content.type === "file") {
            renderFileMessage(content.name, content.size, m.created_at);
          } else {
            addMessage(type, m.content, m.id, m.created_at);
          }
        } catch (e) {
          addMessage(type, m.content, m.id, m.created_at);
        }
      });
    }
  } catch (err) {
    console.error("Error loading messages:", err);
  }

  renderChats();
  updateChatUIState();
}


async function saveMessage(type, text) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const activeChat = activeChatIndex !== null ? chats[activeChatIndex] : (activeGroupChatIndex !== null ? groupChats[activeGroupChatIndex] : null);
  if (!activeChat || !activeChat.id) return;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        conversation_id: activeChat.id,
        content: text,
        type: type === "user" ? "text" : "ai"
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Message saved to backend:", result);
    }
  } catch (err) {
    console.error("Error saving message:", err);
  }
}


/* Search chats */
function searchChats() {
  const q = prompt("Search chats");
  if (!q) return;
  alert("Search feature coming soon 🔍");
}

/* Year review */
function applyYearReviewTheme() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const content = document.querySelector('.year-review-content');
  const title = document.querySelector('.year-title');
  const subtitle = document.querySelector('.year-subtitle');
  const btn = document.querySelector('.year-get-started');
  const closeBtn = document.querySelector('.year-review-close');
  const modal = document.getElementById('yearReviewModal');

  if (!content) return;

  if (theme === 'light') {
    // DEEP INDIGO-VIOLET PREMIUM CARD
    content.style.cssText = `
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 65%, #2e1065 100%) !important;
      border: 1px solid rgba(167, 139, 250, 0.4) !important;
      box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 25px 70px rgba(76,29,149,0.75), 0 50px 120px rgba(67,56,202,0.5), inset 0 1px 0 rgba(255,255,255,0.12) !important;
      border-radius: 24px;
      padding: 60px;
      max-width: 900px;
      width: 90%;
      position: relative;
      animation: slideUp 0.4s ease;
    `;
    if (title) {
      title.style.cssText = `
        background: linear-gradient(135deg, #ffffff 0%, #ddd6fe 50%, #c4b5fd 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 16px;
        line-height: 1.2;
      `;
    }
    if (subtitle) {
      subtitle.style.cssText = `
        color: rgba(221, 214, 254, 0.9) !important;
        font-size: 18px;
        margin-bottom: 40px;
        line-height: 1.6;
      `;
    }
    if (btn) {
      btn.style.cssText = `
        background: linear-gradient(135deg, #f97316, #ec4899, #a855f7, #6366f1) !important;
        border: none !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 18px;
        padding: 16px 48px;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 8px 30px rgba(236,72,153,0.55), 0 4px 15px rgba(99,102,241,0.45) !important;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
      `;
      btn.onmouseenter = () => {
        btn.style.boxShadow = '0 14px 40px rgba(236,72,153,0.7), 0 6px 20px rgba(99,102,241,0.6)';
        btn.style.transform = 'translateY(-3px)';
      };
      btn.onmouseleave = () => {
        btn.style.boxShadow = '0 8px 30px rgba(236,72,153,0.55), 0 4px 15px rgba(99,102,241,0.45)';
        btn.style.transform = 'translateY(0)';
      };
    }
    if (closeBtn) {
      closeBtn.style.cssText = `
        color: rgba(255,255,255,0.8) !important;
        background: rgba(255,255,255,0.1) !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 28px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      `;
    }
    if (modal) {
      modal.style.background = 'rgba(67, 56, 202, 0.3)';
    }
  } else {
    // Reset to CSS-driven styles for dark/dim/blue themes
    content.style.cssText = '';
    if (title) title.style.cssText = '';
    if (subtitle) subtitle.style.cssText = '';
    if (btn) { btn.style.cssText = ''; btn.onmouseenter = null; btn.onmouseleave = null; }
    if (closeBtn) closeBtn.style.cssText = '';
    if (modal) modal.style.background = '';
  }
}

function openYearReview() {
  const modal = document.getElementById('yearReviewModal');
  if (modal) {
    // Get user's registration year
    const userEmail = getCurrentUserEmail();
    const userKey = `user_${userEmail}`;
    const userData = localStorage.getItem(userKey);
    
    let displayYear = new Date().getFullYear(); // Default to current year
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        displayYear = parsed.registeredYear || displayYear;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Update the year in the modal
    const yearText = document.querySelector('.year-text');
    if (yearText) {
      yearText.textContent = displayYear;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Apply theme-specific inline styles (bulletproof override)
    applyYearReviewTheme();
  }
}


function closeYearReview() {
  const modal = document.getElementById('yearReviewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

function showYearStats() {
  // Get user's registration info
  const userEmail = getCurrentUserEmail();
  const userKey = `user_${userEmail}`;
  const userData = localStorage.getItem(userKey);
  
  let joinYear = new Date().getFullYear();
  let joinDate = 'Recently';
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      joinYear = parsed.registeredYear || joinYear;
      if (parsed.registeredDate) {
        const date = new Date(parsed.registeredDate);
        joinDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Calculate user statistics
  const totalChats = chats.length + groupChats.length;
  const totalMessages = chats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0) +
                       groupChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
  
  // Calculate days since joining
  let daysSinceJoining = 0;
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed.registeredDate) {
        const joinedDate = new Date(parsed.registeredDate);
        const today = new Date();
        daysSinceJoining = Math.floor((today - joinedDate) / (1000 * 60 * 60 * 24));
      }
    } catch (e) {
      console.error('Error calculating days:', e);
    }
  }
  
  // Show comprehensive stats
  const statsMessage = `
🎉 Your ${joinYear} ChatGenius Journey!

📅 Joined: ${joinDate}
⏱️ Days Active: ${daysSinceJoining} ${daysSinceJoining === 1 ? 'day' : 'days'}

💬 Total Chats: ${totalChats}
   • Private Chats: ${chats.length}
   • Group Chats: ${groupChats.length}

✉️ Total Messages: ${totalMessages}
📊 Average Messages per Chat: ${totalChats > 0 ? Math.round(totalMessages / totalChats) : 0}

🎯 Status: ${totalChats > 0 ? '🔥 Active User!' : '🌟 Just Getting Started!'}

${totalMessages > 100 ? '🏆 Power User Badge Unlocked!' : ''}
${totalChats > 10 ? '💎 Chat Master Badge Unlocked!' : ''}

Keep chatting to build your year! 🚀
  `;
  
  alert(statsMessage);
  closeYearReview();
}

/* Load user profile and chats on startup */
async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/users/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.full_name || user.username
      }));
      
      // Update avatar initials
      const avatar = document.getElementById("userAvatarText");
      if (avatar && (user.full_name || user.username)) {
        const name = user.full_name || user.username;
        const initials = name
          .trim()
          .split(" ")
          .map(word => word.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("");
        avatar.textContent = initials;
      }

      // Apply saved theme preference
      if (user.theme_preference) {
        document.documentElement.setAttribute("data-theme", user.theme_preference);
        localStorage.setItem("theme", user.theme_preference);
      }
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserProfile();
  await fetchUserConversations();
  updateChatUIState();
  
  // ✅ Restore draft message and files
  restoreDraftMessage();
  
  // ✅ Restore draft files
  const draftFiles = getDraftFiles();
  if (draftFiles.length > 0) {
    draftFiles.forEach(fileData => {
      if (fileData.type === 'image') {
        addImageMessage(fileData.data, fileData.name);
      } else if (fileData.type === 'file') {
        // Create a file-like object for display
        addFileMessage({ name: fileData.name, size: fileData.size });
      }
    });
  }
});


/* ================= GROUP CHAT ================= */

function openGroupChat() {
  // ✅ Just open the modal, don't show the section yet
  // Section will appear only after user creates their first group chat
  document.getElementById("startGroupChatModal").style.display = "flex";
}

function closeGroupChatModal() {
  const modal = document.getElementById("startGroupChatModal");
  modal.style.display = "none";
}

function confirmStartGroupChat() {
  closeGroupChatModal();
  
  // ✅ Create the first group chat when user confirms
  createNewGroupChat();
}

async function createNewGroupChat() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const groupName = `Group Chat ${groupChats.length + 1}`;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "group",
        name: groupName
      })
    });

    if (response.ok) {
      const newConv = await response.json();
      
      groupChats.unshift({
        id: newConv.id,
        title: groupName,
        messages: []
      });

      // Show the GROUP CHATS section
      const groupSection = document.getElementById("groupChatsSection");
      if (groupSection) groupSection.style.display = "block";
      
      renderGroupChats();

      // Switch to this group chat
      messagesDiv.innerHTML = "";
      activeGroupChatIndex = 0;
      activeChatIndex = null;
      
      const titleEl = document.getElementById("activeChatTitle");
      if(titleEl) titleEl.innerText = groupName;
      
      updateChatUIState();
      // Optionally add a welcome message locally or via backend
      addMessage("ai", "Welcome to the new group chat! 👥");
    }
  } catch (err) {
    console.error("Error creating group chat:", err);
  }
}

function renderGroupChats() {
  const groupChatList = document.getElementById("groupChatList");
  if (!groupChatList) return;

  groupChatList.innerHTML = "";

  groupChats.forEach((chat, index) => {
    const li = document.createElement("li");
    li.className = "chat-item";

    li.innerHTML = `
      <span class="chat-name">${chat.title}</span>

      <button class="chat-more-btn">⋯</button>

      <div class="chat-menu">
        <button onclick="renameGroupChat(${index})">✏️ Rename</button>
        <hr>
        <button class="danger" onclick="deleteGroupChat(${index})">🗑 Delete</button>
      </div>
    `;

    li.querySelector(".chat-name").onclick = () => {
      loadGroupChat(index);
    };

    groupChatList.appendChild(li);
  });
}


async function loadGroupChat(index) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const chat = groupChats[index];
  if (!chat || !chat.id) return;

  messagesDiv.innerHTML = "";
  activeGroupChatIndex = index;
  activeChatIndex = null;
  
  selectedChatId = chat.id;
  window.selectedChatId = selectedChatId;

  // Join real-time room
  if (typeof socket !== 'undefined' && socket) {
    socket.emit("join_conversation", { conversation_id: selectedChatId });
  }

  const titleEl = document.getElementById("activeChatTitle");
  if(titleEl) titleEl.innerText = chat.title;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/messages/conversation/${chat.id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const messages = await response.json();
      chat.messages = messages;

      messages.forEach(m => {
        const type = String(m.sender_id) === localStorage.getItem("userId") ? "user" : "ai";
        
        try {
          const content = typeof m.content === 'string' && m.content.startsWith('{') ? JSON.parse(m.content) : null;
          if (content && content.type === "image") {
            renderImageMessage(content.src, content.name, m.created_at);
          } else if (content && content.type === "file") {
            renderFileMessage(content.name, content.size, m.created_at);
          } else {
            addMessage(type, m.content, m.id, m.created_at);
          }
        } catch (e) {
          addMessage(type, m.content, m.id, m.created_at);
        }
      });
    }
  } catch (err) {
    console.error("Error loading group messages:", err);
  }

  renderGroupChats();
  updateChatUIState();
}


function renameGroup(id) {
  const name = prompt("Enter new group name:");
  if (!name) return;
  fetch(`/api/group/rename/${id}`, { method: "PUT" });
}

function addMembers(id) {
  alert("Add members UI here");
}

function leaveGroup(id) {
  fetch(`/api/group/leave/${id}`, { method: "POST" });
}

function deleteGroup(id) {
  fetch(`/api/group/delete/${id}`, { method: "DELETE" });
}

async function renameGroupChat(index) {
  const chat = groupChats[index];
  if (!chat || !chat.id) return;

  const name = prompt("Rename group chat:", chat.title);
  if (!name) return;

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations/${chat.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      chat.title = name;
      renderGroupChats();
    }
  } catch (err) {
    console.error("Error renaming group chat:", err);
  }
}

async function deleteGroupChat(index) {
  const chat = groupChats[index];
  if (!chat || !chat.id) return;

  const confirmDelete = confirm("Delete this group chat?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/conversations/${chat.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      groupChats.splice(index, 1);
      
      if (groupChats.length === 0) {
        const groupSection = document.getElementById("groupChatsSection");
        if (groupSection) groupSection.style.display = "none";
      }
      
      if (activeGroupChatIndex === index) {
        activeGroupChatIndex = null;
        messagesDiv.innerHTML = "";
      } else if (activeGroupChatIndex > index) {
        activeGroupChatIndex--;
      }
      
      renderGroupChats();
      updateChatUIState();
    }
  } catch (err) {
    console.error("Error deleting group chat:", err);
  }
}

function inviteToGroup(index) {
  alert("Add people via group link feature coming soon! 🔗");
}

function shareGroupChat(index) {
  alert("Share group chat feature coming soon! 🚀");
}

function pinGroupChat(index) {
  alert("Pin group chat coming soon! 📌");
}

function archiveGroupChat(index) {
  alert("Archive group chat coming soon! 🗄");
}

// Helper function to render image message without saving
function renderImageMessage(src, name, timestamp = null) {
  const msg = document.createElement("div");
  msg.className = "msg user";

  if (!timestamp) {
    timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  msg.innerHTML = `
    <div class="msg-text">
      <img src="${src}" alt="${name}" style="
        max-width: 240px;
        border-radius: 10px;
        margin-bottom: 6px;
      ">
      <div style="font-size:0.75rem;opacity:.7">${name}</div>
    </div>
    <div class="msg-time">${timestamp}</div>
  `;

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Helper function to render file message without saving
function renderFileMessage(name, size, timestamp = null) {
  const msg = document.createElement("div");
  msg.className = "msg user";

  if (!timestamp) {
    timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  msg.innerHTML = `
    <div class="msg-text">
      📎 <strong>${name}</strong>
      <div style="font-size:0.75rem;opacity:.7">
        ${(size / 1024).toFixed(1)} KB
      </div>
    </div>
    <div class="msg-time">${timestamp}</div>
  `;

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function addImageMessage(src, name) {
  const msg = document.createElement("div");
  msg.className = "msg user";

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  msg.innerHTML = `
    <div class="msg-text">
      <img src="${src}" alt="${name}" style="
        max-width: 240px;
        border-radius: 10px;
        margin-bottom: 6px;
      ">
      <div style="font-size:0.75rem;opacity:.7">${name}</div>
    </div>
    <div class="msg-time">${time}</div>
  `;

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Save the image message with metadata
  saveMessage("user", JSON.stringify({ type: "image", src, name }));
}

function addFileMessage(file) {
  const msg = document.createElement("div");
  msg.className = "msg user";

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  msg.innerHTML = `
    <div class="msg-text">
      📎 <strong>${file.name}</strong>
      <div style="font-size:0.75rem;opacity:.7">
        ${(file.size / 1024).toFixed(1)} KB
      </div>
    </div>
    <div class="msg-time">${time}</div>
  `;

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Save the file message with metadata
  saveMessage("user", JSON.stringify({ type: "file", name: file.name, size: file.size }));
}

let selectedProjectType = null;

function openProjectModal() {
  document.getElementById("projectModal").style.display = "flex";
}

function closeProjectModal() {
  document.getElementById("projectModal").style.display = "none";
  document.getElementById("projectName").value = "";
  selectedProjectType = null;
  toggleCreateProjectBtn();

  document
    .querySelectorAll(".project-tags button")
    .forEach(btn => btn.classList.remove("active"));
}

function selectProjectType(btn) {
  document
    .querySelectorAll(".project-tags button")
    .forEach(b => b.classList.remove("active"));

  btn.classList.add("active");
  selectedProjectType = btn.innerText;
}

function toggleCreateProjectBtn() {
  const name = document.getElementById("projectName").value.trim();
  const btn = document.getElementById("createProjectBtn");

  if (name) {
    btn.disabled = false;
    btn.classList.add("enabled");
  } else {
    btn.disabled = true;
    btn.classList.remove("enabled");
  }
}

function createProject() {
  const name = document.getElementById("projectName").value.trim();
  if (!name) return;

  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  projects.unshift({
    name,
    type: selectedProjectType || "General",
    createdAt: Date.now()
  });

  localStorage.setItem("projects", JSON.stringify(projects));

  closeProjectModal();
  alert(`✅ Project "${name}" created`);
}

// Remove demo user setup
document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("user");
  const avatarText = document.getElementById("userAvatarText");

  if (!avatarText || !userStr) return;

  try {
    const user = JSON.parse(userStr);
    if (user && user.name) {
      avatarText.textContent = user.name.trim().charAt(0).toUpperCase();
    }
  } catch(e) {}
});

function selectChat(el){
    // remove old active
    document.querySelectorAll('.chat-item').forEach(c=>{
        c.classList.remove('active');
        c.classList.remove('active-chat');
    });

    // set new active
    el.classList.add('active');
    el.classList.add('active-chat');

    selectedChatId = el.dataset.id;
    window.selectedChatId = selectedChatId; // Sync to global window for socket.js
    selectedChatType = el.dataset.type;

    // Join room for real-time sync
    if (typeof socket !== 'undefined' && socket) {
        socket.emit("join_conversation", { conversation_id: selectedChatId });
        console.log("Joined real-time room for conversation:", selectedChatId);
    }

    // 🔥 Show group section only if group chat clicked
    if(selectedChatType === "group"){
        document.getElementById("groupChatsSection").style.display = "block";
    }else{
        // document.getElementById("groupChatsSection").style.display = "none";
    }
}

function openChatMenu(e,btn){
    e.stopPropagation();
    // show your rename / add / delete popup here
}


function renderChatItem(chat, type){
    return `
      <li class="chat-item"
          data-id="${chat.id}"
          data-type="${type}"
          onclick="selectChat(this)">
          
          <span class="chat-name">${chat.name}</span>

          <button class="chat-more-btn" onclick="openChatMenu(event,this)">
              ⋯
          </button>
      </li>
    `;
}


function renderChats() {
  const chatList = document.getElementById("chatList");
  if (!chatList) return;

  chatList.innerHTML = "";

  chats.forEach((chat, index) => {
    const li = document.createElement("li");
    li.className = "chat-item";

    if (index === activeChatIndex) {
      li.classList.add("active-chat");
    }

    li.innerHTML = `
      <span class="chat-name">${chat.title}</span>

      <button class="chat-more-btn">⋯</button>

      <div class="chat-menu">
        <button onclick="shareChat(${index})">🔗 Share</button>
        <button onclick="startGroupFromChat(${index})">👥 Start a group chat</button>
        <button onclick="renameChat(${index})">✏️ Rename</button>
        <hr>
        <button onclick="pinChat(${index})">📌 Pin chat</button>
        <button onclick="archiveChat(${index})">🗄 Archive</button>
        <button class="danger" onclick="deleteChat(${index})">🗑 Delete</button>
      </div>
    `;

    // Load chat on name click
    li.querySelector(".chat-name").onclick = () => {
      activeChatIndex = index;
      loadChat(index);
      renderChats();
    };

    chatList.appendChild(li);
  });
}

document.addEventListener("click", () => {
  document.querySelectorAll(".chat-menu").forEach(menu => {
    menu.style.display = "none";
  });
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".chat-more-btn");
  if (!btn) return;

  e.stopPropagation();

  document.querySelectorAll(".chat-menu").forEach(menu => {
    menu.style.display = "none";
  });

  const menu = btn.nextElementSibling;
  if (menu) menu.style.display = "flex";
});

// AFTER successful register
localStorage.setItem("user", JSON.stringify({
  name: fullName,   // example: "Tamiri Tanishq"
  email: email
}));

document.addEventListener("DOMContentLoaded", () => {
  const avatar = document.getElementById("userAvatarText");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!avatar || !user || !user.name) return;

  // Split full name and take initials
  const initials = user.name
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  avatar.textContent = initials;
});
