import { API_URL, appLink, currentRoutePath } from "../config";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?worker";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useLocation, useNavigate } from "react-router-dom";

import GroupChatModal from "../modals/GroupChatModal.jsx";
import ProfileModal from "../modals/ProfileModal";
import ProjectModal from "../modals/ProjectModal.jsx";
import "../styles/chat.css";
import socket from "../socket/socket";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();
export default function Chat() {
  /* ================= STATE ================= */
  // Final instruction to ensure style matches ChatGPT
  const system_instruction = (
    "You are a helpful, friendly AI assistant.\n" +
    "Respond naturally like a human in a chat.\n" +
    "Handle both complex questions and simple casual messages.\n" +
    "Keep responses short and friendly when appropriate."
  );
  const [theme, setTheme] = useState("light"); // default light
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [archivedChats, setArchivedChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [menuChatId, setMenuChatId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [menuType, setMenuType] = useState(null); // "chat" | "group"
  const settingsRef = useRef(null);
  // New state for UI controls
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const groupMenuRef = useRef(null);
  const userKey = localStorage.getItem("userUsername");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const navigate = useNavigate();
  const location = useLocation();
  const [translateOpen, setTranslateOpen] = useState(false);
  const TRANSLATE_LANGS = [
    { code: "te", label: "Telugu" },
    { code: "hi", label: "Hindi" },
    { code: "ta", label: "Tamil" },
    { code: "ml", label: "Malayalam" },
    { code: "kn", label: "Kannada" },
    { code: "bn", label: "Bengali" },
    { code: "ur", label: "Urdu" }
  ];
  const [rewriteDeleteIndex, setRewriteDeleteIndex] = useState(null);
  const [isRewriteMode, setIsRewriteMode] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const archivedRef = useRef(null);
  //  Start Group Chat flow
  const [startGroupConfirmOpen, setStartGroupConfirmOpen] = useState(false);
  const [groupLinkOpen, setGroupLinkOpen] = useState(false);
  const [sourceChatForGroup, setSourceChatForGroup] = useState(null);
  const [groupInviteLink, setGroupInviteLink] = useState("");
  const finalTranscriptRef = useRef("");
  const micBtnRef = useRef(null);
  const PROJECT_KEY = `projects_${userKey}`;
  const aiInsertedRef = useRef(false);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null);
  const [projectMenuPos, setProjectMenuPos] = useState({ top: 0, left: 0 });
  const projectMenuRef = useRef(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const activeChatIdRef = useRef(activeChatId);

  // Sync ref with state
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  const [replyTarget, setReplyTarget] = useState(null);
  const sendingRef = useRef(false);
  // ================= PINNED CHAT SORT =================
  const sortedChats = [...chats].sort((a, b) => {
    const ap = a.pinned ?? false;
    const bp = b.pinned ?? false;

    if (ap === bp) return 0;
    return ap ? -1 : 1;
  });

  const sortedGroupChats = [...groupChats].sort((a, b) => {
    const ap = a.pinned ?? false;
    const bp = b.pinned ?? false;

    if (ap === bp) return 0;
    return ap ? -1 : 1;
  });


  const [draftText, setDraftText] = useState("");




  // or userEmail or userId (best)
  const CHAT_KEY = `chats_${userKey}`;
  const GROUP_KEY = `groupChats_${userKey}`;
  const ARCHIVE_KEY = `archivedChats_${userKey}`;

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [groupChatModalOpen, setGroupChatModalOpen] = useState(false);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const moreToolsRef = useRef(null);
  const chatMenuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setOpenChatMenuId(null);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /*======================== LOAD THEME =======================*/
  useEffect(() => {
    if (!userKey) return;

    const savedTheme = localStorage.getItem(`theme_${userKey}`);

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("light"); // first time login = light
    }

  }, [userKey]);

  /*==================== DRAFT MESSAGE ============================*/
  useEffect(() => {
    if (!userKey || !activeChatId) {
      setDraftText("");
      return;
    }

    const key = `draftText_${userKey}_${activeChatId}`;
    const savedDraft = localStorage.getItem(key) || "";

    setDraftText(savedDraft);

    if (inputRef.current) {
      inputRef.current.value = savedDraft;
      autoResize({ target: inputRef.current });
    }
  }, [activeChatId, userKey]);
  /*======================Restore page ============================*/
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = draftText;
      autoResize({ target: inputRef.current });
    }
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("draftAttachments") || "[]");

    if (saved.length > 0) {
      setAttachments(saved);
    }
  }, []);



  /*===================== MENU ==========================*/

  useEffect(() => {
    if (!openChatMenuId || !chatMenuRef.current) return;

    const menu = chatMenuRef.current;
    const menuRect = menu.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const GAP = 8;

    let top = menuRect.top;

    //  If menu goes below viewport → move UP
    if (menuRect.bottom > viewportHeight) {
      top =
        menuRect.top -
        (menuRect.bottom - viewportHeight) -
        GAP;
    }

    //  If menu goes above viewport → move DOWN
    if (top < GAP) {
      top = GAP;
    }

    setMenuPosition(prev => ({
      ...prev,
      top: top + window.scrollY
    }));
  }, [openChatMenuId]);

  function handleReply(index) {
    const msg = messages[index];

    setReplyTarget(msg);

    if (inputRef.current) {
      inputRef.current.value = `> ${msg.text}\n`;
      inputRef.current.focus();

      autoResize({ target: inputRef.current });
    }
  }
  /*================== EMOJI ============================*/
  function addReaction(index, emoji) {
    setMessages(prev => {
      const updated = [...prev];
      updated[index].reactions = [emoji];

      // Sync with chats/groupChats for persistence across switches
      setChats(prevChats => {
        const newChats = prevChats.map(c => 
          c.id === activeChatId ? { ...c, messages: updated } : c
        );
        localStorage.setItem(CHAT_KEY, JSON.stringify(newChats));
        return newChats;
      });

      setGroupChats(prevGroups => {
        const newGroups = prevGroups.map(g => 
          g.id === activeChatId ? { ...g, messages: updated } : g
        );
        localStorage.setItem(GROUP_KEY, JSON.stringify(newGroups));
        return newGroups;
      });

      // SAVE REACTION TO DATABASE
      try {
        const token = localStorage.getItem("userToken");
        const userId = localStorage.getItem("userId");
        const msgId = updated[index].id;

        if (token && msgId) {
          fetch(`${API_URL}/api/messages/${msgId}/react`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: Number(userId),
              emoji: emoji
            })
          });
        }

      } catch (err) {
        console.error("Reaction save failed:", err);
      }

      return updated;
    });
  }
  /*================== PIN MESSAGE =======================*/
  function togglePinMessage(index) {
    setMessages(prev => {
      const updated = [...prev];
      updated[index].pinned = !updated[index].pinned;
      return updated;
    });
  }
  /*================== Copy Message =======================*/
  function handleCopyMessage(text) {
    if (!text) return;

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  /*=========================== EDIT MESSAGE =======================*/
  function handleEditMessage(index) {
    const msg = messages[index];
    if (!msg || msg.role !== "user") return;

    // 1️⃣ Put text back into input
    if (inputRef.current) {
      inputRef.current.value = msg.text;
      autoResize({ target: inputRef.current });
      inputRef.current.focus();
    }

    // 2️⃣ Remove conversation after this message
    const newMessages = messages.slice(0, index);

    setMessages(newMessages);

    // 3️⃣ Update storage
    setChats(prev => {
      const updated = prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: newMessages }
          : chat
      );

      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    setIsRewriteMode(true);
  }


  //  Fallback method (works everywhere)
  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // avoid scrolling to bottom
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Copy failed", err);
    }

    document.body.removeChild(textarea);
  }


  useEffect(() => {
    const path = currentRoutePath();
    if (!path.startsWith("/group/")) return;

    const groupId = Number(path.split("/group/")[1]);
    if (!groupId) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      localStorage.setItem("pendingGroupJoin", groupId);
      navigate("/login");
      return;
    }

    async function loadGroup() {
      try {
        console.log("Active Group ID:", groupId);
        await fetch(`${API_URL}/api/conversations/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ conversation_id: groupId })
        });

        // Ensure group details are saved to state
        try {
          const groupRes = await fetch(`${API_URL}/api/groups/${groupId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const groupData = await groupRes.json();
          if (groupData && !groupData.error) {
            setGroupName(groupData.title);
            setGroupChats(prev => {
              if (prev.find(g => g.id === groupId)) {
                return prev.map(g => g.id === groupId ? { ...g, title: groupData.title } : g);
              }
              const newGroup = {
                id: groupData.id,
                title: groupData.title,
                isGroup: true,
                messages: []
              };
              const updated = [newGroup, ...prev];
              localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } catch (e) { /* ignore error, continue */ }

        const resMsg = await fetch(`${API_URL}/api/messages/conversation/${groupId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await resMsg.json();

        setActiveChatId(groupId);
        setMessages(Array.isArray(data) ? data : data.messages || []);
      } catch {
        alert("Group link invalid or expired");
      }
    }

    loadGroup();
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        archivedRef.current &&
        !archivedRef.current.contains(event.target)
      ) {
        setArchivedOpen(false);
      }
    }

    if (archivedOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [archivedOpen]);


  /*==================== load project =========================*/
  useEffect(() => {
    if (!userKey) return;

    const savedProjects = JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]");
    setProjects(savedProjects);
  }, [userKey]);

  /*==================== project menu ============*/
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(e.target)
      ) {
        setOpenProjectMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language;

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interimTranscript = transcript;
        }
      }

      inputRef.current.value =
        finalTranscriptRef.current + interimTranscript;

      autoResize({ target: inputRef.current });
    };

    recognitionRef.current = recognition;
  }, []);



  function autoResize(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }


  function isImagePrompt(text) {
    return (
      text.toLowerCase().includes("image") ||
      text.toLowerCase().includes("photo") ||
      text.toLowerCase().includes("picture") ||
      text.toLowerCase().includes("hd")
    );
  }

  /*================================== Group link ===============================*/
  async function confirmStartGroupChat() {
    if (!sourceChatForGroup) return;

    const token = localStorage.getItem("userToken");
    let groupId;

    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sourceChatForGroup.title,
          description: "Group Chat generated from previous chat",
          members: []
        })
      });
      const data = await res.json();
      if (!data.id) throw new Error("No group ID returned");
      groupId = data.id;
    } catch {
      alert("Failed to create group on server");
      return;
    }

    const newGroupChat = {
      id: groupId,
      title: sourceChatForGroup.title,
      isGroup: true,
      members: [userKey],
      messages: [...(sourceChatForGroup.messages || [])],
      createdAt: new Date().toISOString(),
      pinned: false
    };

    //  SAVE LOCALLY
    setGroupChats(prev => {
      const updated = [newGroupChat, ...prev];
      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      return updated;
    });

    setStartGroupConfirmOpen(false);
    setSourceChatForGroup(null);

    setActiveChatId(groupId);
    setMessages(newGroupChat.messages);
  }

  /*============================= Rename project ==============================*/

  function handleRenameProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newName = prompt("Rename project:", project.name);
    if (!newName || !newName.trim()) return;

    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? { ...p, name: newName.trim() } : p
      );
      localStorage.setItem(PROJECT_KEY, JSON.stringify(updated));
      return updated;
    });

    setOpenProjectMenuId(null);
  }

  /*================================== Delete Project ==================================*/
  function handleDeleteProject(projectId) {
    if (!confirm("Delete this project?")) return;

    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECT_KEY, JSON.stringify(updated));
      return updated;
    });

    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setMessages([]);
    }

    setOpenProjectMenuId(null);
  }

  /*================================ Share Project ===============================*/

  function handleShareProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const text = `Project: ${project.name}\n\n` +
      (project.messages || [])
        .map(m => `${m.role === "user" ? "You" : "AI"}: ${m.text || ""}`)
        .join("\n\n");

    if (navigator.share) {
      navigator.share({ title: project.name, text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Project copied to clipboard");
    }

    setOpenProjectMenuId(null);
  }




  async function handleRenameGroup(id) {
    const newName = prompt("Enter new group name:");
    if (!newName) return;

    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        await fetch(`${API_URL}/api/groups/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title: newName })
        });
      }
    } catch (error) {
      console.error("Failed to rename group on server", error);
    }

    setGroupChats(prev => {
      const updated = prev.map(g =>
        g.id === id ? { ...g, title: newName } : g
      );
      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      return updated;
    });

    if (activeChatId === id) {
      setGroupName(newName);
    }

    setMenuChatId(null);
  }

  function handlePinGroup(groupId) {
    setGroupChats(prev => {
      const updated = prev.map(group =>
        group.id === groupId
          ? { ...group, pinned: !group.pinned }
          : group
      );

      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      return updated;
    });

    setMenuChatId(null);
  }

  function handleDeleteGroup(id) {
    if (!confirm("Delete this group chat?")) return;

    setGroupChats(prev => {
      const updated = prev.filter(g => g.id !== id);
      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      return updated;
    });

    setMenuChatId(null);
  }

  async function handleSelectGroupChat(id) {
    stopMicIfRunning();   //  ADD

    const chat = groupChats.find(g => g.id === id);
    if (!chat) return;

    setActiveChatId(id);
    setMessages(chat.messages || []);

    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        const gRes = await fetch(`${API_URL}/api/groups/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const gData = await gRes.json();
        if (gData && !gData.error) {
          setGroupName(gData.title);
        }

        const resMsg = await fetch(`${API_URL}/api/messages/conversation/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await resMsg.json();
        const updatedMessages = Array.isArray(data) ? data : data.messages || [];
        setMessages(updatedMessages);
        setGroupChats(prev => {
          const updated = prev.map(g => g.id === id ? { ...g, title: gData.title || g.title, messages: updatedMessages } : g);
          localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }


  /*==================== listener to stop mic =========================*/
  useEffect(() => {
    function handleClickAnywhere(e) {
      // If mic is NOT recording → do nothing
      if (!isRecording) return;

      // If click is ON mic button → ignore
      if (micBtnRef.current?.contains(e.target)) return;

      //  Otherwise stop mic
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    }

    document.addEventListener("mousedown", handleClickAnywhere);

    return () => {
      document.removeEventListener("mousedown", handleClickAnywhere);
    };
  }, [isRecording]);





  useEffect(() => {
    function handleClickOutside(e) {
      // Close YOUR chats menu
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setOpenChatMenuId(null);
      }

      // Close GROUP chats menu
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setMenuChatId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
        setThemeMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);



  /* ================= THEME ================= */
  useEffect(() => {
    if (!userKey) return;

    document.documentElement.className = "";
    document.documentElement.classList.add(`theme-${theme}`);

    localStorage.setItem(`theme_${userKey}`, theme);

  }, [theme, userKey]);

  /* ================= LOAD CHATS ================= */
  useEffect(() => {
    if (!userKey) return;

    const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
    const archived = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]");
    const groups = JSON.parse(localStorage.getItem(GROUP_KEY) || "[]");

    setChats(saved.map(c => ({ pinned: false, ...c })));
    setArchivedChats(archived);
    setGroupChats(groups);
  }, [userKey]);


  /* ================= NAV BUG FIX ================= */
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
    }
  }, [activeChatId]);

  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ================= REAL-TIME WEBSOCKETS ================= */
  useEffect(() => {
    if (!socket) return;

    // Join room when activeChatId changes (stay here for room sync)
    if (activeChatId) {
       socket.emit("join_conversation", { conversation_id: activeChatId });
    }

    const handleNewMessage = (msg) => {
      console.log("DEBUG FRONTEND: Received message via socket ->", msg);
      const msgConvId = Number(msg.conversation_id);
      const currentId = Number(activeChatIdRef.current);

      if (msgConvId === currentId) {
        setMessages(prev => {
          // 1. Exact ID match (already in list)
          if (prev.some(m => m.id === msg.id)) return prev;

          // 2. Optimistic match: If this message matches an optimistic one from the same user
          // Optimistic messages have large numeric IDs (Date.now()) and isMe = true or role = 'user'
          const currentUserId = Number(localStorage.getItem("userId"));
          const isFromMe = msg.user_id === currentUserId || msg.role === "user";
          
          if (isFromMe) {
            const optimisticIndex = prev.findIndex(m => 
              (m.role === "user" || m.isMe) && 
              m.text === msg.text && 
              typeof m.id === 'number' && m.id > 1700000000000
            );

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = msg; // Replace optimistic with real one
              return updated;
            }
          }
          
          return [...prev, msg];
        });
      }

      // 2. Globally update sidebar lists (persistence)
      setChats(prev => {
        const updated = prev.map(c => {
          if (Number(c.id) === msgConvId) {
            // Deduplicate in sidebar as well
            if (c.messages?.some(m => m.id === msg.id)) return c;
            
            const currentUserId = Number(localStorage.getItem("userId"));
            const isFromMe = msg.user_id === currentUserId || msg.role === "user";
            
            if (isFromMe) {
              const hasOptimistic = c.messages?.some(m => 
                (m.role === "user" || m.isMe) && 
                m.text === msg.text && 
                typeof m.id === 'number' && m.id > 1700000000000
              );
              if (hasOptimistic) {
                return { 
                  ...c, 
                  messages: c.messages.map(m => 
                    ((m.role === "user" || m.isMe) && m.text === msg.text && typeof m.id === 'number' && m.id > 1700000000000) ? msg : m
                  ),
                  lastMessage: msg.text 
                };
              }
            }

            return { ...c, messages: [...(c.messages || []), msg], lastMessage: msg.text };
          }
          return c;
        });
        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

      setGroupChats(prev => {
        const updated = prev.map(g => {
          if (Number(g.id) === msgConvId) {
            if (g.messages?.some(m => m.id === msg.id)) return g;
            return { ...g, messages: [...(g.messages || []), msg] };
          }
          return g;
        });
        localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    const handleAiTyping = (data) => {
      if (Number(data.conversation_id) === Number(activeChatIdRef.current)) {
        setIsAiTyping(data.is_typing);
      }
    };

    const handleReaction = (data) => {
      setMessages(prev => prev.map(m =>
        m.id === data.message_id
          ? { ...m, reactions: [...(m.reactions || []).filter(r => r.user_id !== data.user_id), data] }
          : m
      ));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("ai_typing", handleAiTyping);
    socket.on("reaction_added", handleReaction);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("ai_typing", handleAiTyping);
      socket.off("reaction_added", handleReaction);
    };
  }, [socket, activeChatId]); // Re-register handle selects room or socket reset
  // Note: activeChatId in dependencies ensures we join the room. 
  // The handleNewMessage closure uses activeChatIdRef for message filtering to be stable.


  /* ================= CLICK OUTSIDE TO CLOSE ================= */
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target)) {
        setMoreToolsOpen(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setOpenChatMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  /* ================= USER AVATAR ================= */
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser.name || localStorage.getItem("userName") || "User";

  function getInitials(name) {
    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const initials =
    userName.trim().split(" ").length === 1
      ? userName[0].toUpperCase()
      : (
        userName[0] +
        userName.trim().split(" ").slice(-1)[0][0]
      ).toUpperCase();



  useEffect(() => {
    if (location.state?.imagePrompt) {
      autoImageMessage(location.state.imagePrompt);

      //  clear state so it doesn't run again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);






  /* ================= CREATE CHAT ================= */
  async function createNewChat() {
    stopMicIfRunning();

    // Ask backend to clear server-side session chat history (best-effort)
    try {
      fetch(`${API_URL}/ai/clear_history`, {
        method: "POST",
        credentials: "include"
      }).catch(() => { });
    } catch { }

    const id = Date.now();
    const newChat = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      pinned: false
    };

    const updated = [newChat, ...chats];
    setChats(updated);
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated));

    setActiveChatId(id);
    setMessages([]);
  }

  /* ================= SELECT CHAT ================= */
  async function handleSelectChat(chatId) {
    stopMicIfRunning();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    setActiveChatId(chatId);
    
    // Optimistic set from LocalStorage
    setMessages(chat.messages || []);

    // Also fetch the latest from the backend
    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        console.log(`Fetching messages for chat: ${chatId}`);
        const res = await fetch(`${API_URL}/api/messages/conversation/${chatId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const updatedMessages = Array.isArray(data) ? data : data.messages || [];
        setMessages(updatedMessages);
        
        // sync to local storage too
        setChats(prev => {
          const updated = prev.map(c => c.id === chatId ? { ...c, messages: updatedMessages } : c);
          localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to fetch messages from backend:", err);
    }
  }


  // 🔥 SEND REACTION TO BACKEND
  async function sendReaction(messageId, emoji) {

    const token = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");

    await fetch(`${API_URL}/api/messages/${messageId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: Number(userId),
        emoji: emoji
      })
    });

  }


  /* ================= SEND MESSAGE ================= */
  async function sendMessage() {
    console.log("SEND MESSAGE CALLED");
    const text = inputRef.current?.value || "";
    const cleanText = text.trim();

    if (!cleanText && attachments.length === 0) {
      console.log("Empty message, ignoring.");
      return;
    }

    if (sendingRef.current) {
      console.log("Already sending, ignoring.");
      return;
    }
    sendingRef.current = true;
    setLoading(true);

    // reset textarea
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "44px";
    }
    
    if (activeChatId && userKey) {
      localStorage.removeItem(`draftText_${userKey}_${activeChatId}`);
    }
    setDraftText("");
    finalTranscriptRef.current = "";

    let chatId = activeChatId;

    /* ================= CREATE CHAT IF NEEDED ================= */
    if (!chatId) {
      chatId = Date.now();
      const newChat = {
        id: chatId,
        title: cleanText ? cleanText.slice(0, 30) : (attachments.length > 0 ? attachments[0].name : "New Chat"),
        messages: [],
        createdAt: new Date().toISOString()
      };

      setChats(prev => [newChat, ...prev]);
      localStorage.setItem(CHAT_KEY, JSON.stringify([newChat, ...chats]));
      setActiveChatId(chatId);
    }

    try {
      const userMsg = {
        id: Date.now(),
        role: "user",
        text: cleanText,
        attachments: attachments.map(f => ({ name: f.name })),
        createdAt: new Date().toISOString(),
        reactions: [],
        pinned: false,
        replyTo: replyTarget?.id || null,
        username: userName
      };

      /* ================= UPDATE UI: show user's message immediately (OPTIMISTIC) ================= */
      setMessages(prev => [...prev, userMsg]);
      setReplyTarget(null);

      const token = localStorage.getItem("userToken");
      let res;
      if (attachments.length > 0) {
        const fileData = new FormData();
        fileData.append("conversation_id", String(chatId));
        fileData.append("content", cleanText || "[Attachment]");
        fileData.append("type", "file");
        if (replyTarget) fileData.append("parent_id", replyTarget.id);
        attachments.forEach(file => fileData.append("files", file));

        res = await fetch(`${API_URL}/api/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: fileData
        });
      } else {
        res = await fetch(`${API_URL}/api/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            conversation_id: chatId,
            content: cleanText || "[Attachment]",
            type: "text",
            parent_id: replyTarget?.id || null
          })
        });
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data && data.id) {
        // Update the optimistic message with the real ID from server
        setMessages(prev => {
          // If socket already added this message, remove the optimistic placeholder
          if (prev.some(m => m.id === data.id)) {
            return prev.filter(m => m.id !== userMsg.id);
          }
          // Otherwise replace the placeholder with real data
          return prev.map(m => m.id === userMsg.id ? data : m);
        });
      }

      // Check if it's a normal chat
      const isGroupChat = groupChats.some(g => g.id === chatId);
      if (!isGroupChat) {
        // Show typing indicator
        setMessages(prev => [...prev, { role: "ai", typing: true }]);

        try {
          let aiRes;
          if (attachments.length > 0) {
            const aiFileData = new FormData();
            aiFileData.append("conversation_id", String(chatId));
            aiFileData.append("message", cleanText || "");
            attachments.forEach(file => aiFileData.append("files", file));
            
            aiRes = await fetch(`${API_URL}/ai/chat`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` },
              body: aiFileData
            });
          } else {
            aiRes = await fetch(`${API_URL}/ai/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                conversation_id: chatId,
                message: cleanText || ""
              })
            });
          }

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            console.log("DEBUG FRONTEND: Received AI Data ->", aiData);
            const aiMsg = {
              id: Date.now(),
              role: "ai",
              text: aiData.reply || "⚠️ AI connection failed. Retrying with backend rotation...",
              createdAt: new Date().toISOString()
            };
            
            setMessages(prev => {
              const withoutTyping = prev.filter(m => !m.typing);
              return [...withoutTyping, aiMsg];
            });

            // Update chats in localStorage so it persists before reload
            setChats(prevChats => {
              const updatedChats = prevChats.map(c => {
                if (c.id === chatId) {
                  const msgsWithoutTyping = (c.messages || []).filter(m => !m.typing);
                  
                  // Deduplicate: check if this AI message or user message already exists
                  if (msgsWithoutTyping.some(m => m.id === aiMsg.id)) return c;

                  const hasUserMsg = msgsWithoutTyping.some(m => m.id === data.id || m.id === userMsg.id);
                  const newMsgs = hasUserMsg ? [...msgsWithoutTyping, aiMsg] : [...msgsWithoutTyping, data, aiMsg];
                  return { ...c, messages: newMsgs };
                }
                return c;
              });
              localStorage.setItem(CHAT_KEY, JSON.stringify(updatedChats));
              return updatedChats;
            });
          } else {
            setMessages(prev => {
              const withoutTyping = prev.filter(m => !m.typing);
              return [...withoutTyping, { role: "ai", text: "❌ AI failed to respond." }];
            });
          }
        } catch (aiErr) {
          console.error("AI connection error:", aiErr);
          setMessages(prev => {
            const withoutTyping = prev.filter(m => !m.typing);
            return [...withoutTyping, { role: "ai", text: "❌ AI connection error." }];
          });
        }
      }

    } catch (err) {
      console.error("Backend failed to save user msg", err);
      // Optional: show error message to user in UI
    } finally {
      setAttachments([]);
      setLoading(false);
      sendingRef.current = false;
    }
  }

  async function autoImageMessage(prompt) {
    let chatId = activeChatId;

    if (!chatId) {
      chatId = Date.now();
      const newChat = {
        id: chatId,
        title: prompt.slice(0, 30),
        messages: [],
        createdAt: new Date().toISOString(),
        pinned: false
      };

      setChats(prev => {
        const updated = [newChat, ...prev];
        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

      setActiveChatId(chatId);
      setMessages([]);
    }

    const userMsg = { role: "user", text: prompt };
    setMessages(prev => [...prev, userMsg]);

    setChats(prev => {
      const updated = prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, userMsg] }
          : c
      );
      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      const aiMsg = {
        role: "ai",
        image: `data:image/png;base64,${data.image_base64}`
      };

      setMessages(prev => [...prev, aiMsg]);

      setChats(prev => {
        const updated = prev.map(c =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, aiMsg] }
            : c
        );
        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

    } catch {
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "❌ Image failed" }
      ]);
    } finally {
      setLoading(false);
    }
  }



  /*=============voice==================*/

  async function transliterateToEnglish(text, langCode) {
    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
        text
      )}&itc=${langCode}-t-i0-und&num=1`;

      const res = await fetch(url);
      const data = await res.json();

      if (data[0] === "SUCCESS") {
        return data[1][0][1][0]; // romanized output
      }

      return text;
    } catch {
      return text;
    }
  }

  function detectLangFromText(text) {
    if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
    if (/[\u0D00-\u0D7F]/.test(text)) return "ml"; // Malayalam
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi
    return null;
  }

  function handleLogout() {
    setLogoutModalOpen(true);
  }

  function confirmLogout() {
    console.log("CONFIRM LOGOUT");
    
    // remove ONLY login session
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userUsername");
    localStorage.removeItem("user");

    // Clear messages and chats from UI state
    setMessages([]);
    setChats([]);
    setGroupChats([]);
    setActiveChatId(null);

    // Final redirection
    navigate("/login");
  }

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, []);

  /*============== Add people via group link =================*/




  /*================= OPEN ARCHIVED CHAT ==================*/
  function handleOpenArchivedChat(chat) {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
    setArchivedOpen(false);
  }


  /* ================= MORE TOOLS ACTIONS ================= */
  async function handleSummarize() {
    if (!activeChatId || messages.length === 0) {
      alert("Nothing to summarize");
      setMoreToolsOpen(false);
      return;
    }

    // 🔍 find LAST AI message
    const lastAiIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .reverse()
      .find(m => m.role === "ai" && m.text)?.i;

    if (lastAiIndex === undefined) {
      alert("No AI response to summarize");
      setMoreToolsOpen(false);
      return;
    }

    const lastAiMessage = messages[lastAiIndex].text;

    // 🧠 simple-understanding prompt
    const prompt = `
Rewrite the following AI answer in a VERY SIMPLE and SHORT way.
Use easy words.
Do not add extra information.

Answer:
${lastAiMessage}
`;

    // 1️⃣ Remove old AI message from UI
    setMessages(prev => [
      ...prev.filter((_, i) => i !== lastAiIndex),
      { role: "ai", typing: true }   // ⭐ typing placeholder
    ]);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("message", prompt);
          return fd;
        })()
      });

      const data = await res.json();

      const simplifiedMsg = {
        role: "ai",
        text: `🧠 Simplified Answer:\n\n${data.reply}`
      };

      // 2️⃣ Insert simplified answer
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, simplifiedMsg];
      });

      // 3️⃣ Update stored chat (IMPORTANT)
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id !== activeChatId) return chat;

          const newMsgs = chat.messages.filter((_, i) => i !== lastAiIndex);
          newMsgs.push(simplifiedMsg);

          return { ...chat, messages: newMsgs };
        });

        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "❌ Failed to simplify answer" }
      ]);
    } finally {
      setLoading(false);
      setMoreToolsOpen(false);
    }
  }


  function handleTranslate() {
    if (!activeChatId || messages.length === 0) {
      alert("Nothing to translate");
      setMoreToolsOpen(false);
      return;
    }

    setTranslateOpen(true);     // open language picker
    setMoreToolsOpen(false);
  }

  async function translateLastAiMessage(langLabel) {
    // 🔍 find last AI message
    const lastAiIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .reverse()
      .find(m => m.role === "ai" && m.text)?.i;

    if (lastAiIndex === undefined) {
      alert("No AI answer to translate");
      return;
    }

    const originalText = messages[lastAiIndex].text;

    const prompt = `
Translate the following AI answer into ${langLabel},
but write ONLY in ENGLISH letters (romanized form).

Rules:
- Do NOT use native script
- Keep it simple and natural
- Do NOT explain anything

Text:
${originalText}
`;

    // remove old AI message
    setMessages(prev => [
      ...prev.filter((_, i) => i !== lastAiIndex),
      { role: "ai", typing: true }
    ]);

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("message", prompt);

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      const translatedMsg = {
        role: "ai",
        text: `🌐 ${langLabel} (Easy English Letters)\n\n${data.reply}`
      };

      // insert translated message
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, translatedMsg];
      });

      // save to chat history
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id !== activeChatId) return chat;

          const msgs = chat.messages.filter((_, i) => i !== lastAiIndex);
          msgs.push(translatedMsg);
          return { ...chat, messages: msgs };
        });

        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

    } catch {
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "❌ Translation failed" }
      ]);
    } finally {
      setLoading(false);
      setTranslateOpen(false);
    }
  }

  async function handleExplain() {
    if (!activeChatId || messages.length === 0) {
      alert("Nothing to explain");
      setMoreToolsOpen(false);
      return;
    }

    // 🔍 find last AI message
    const lastAiIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .reverse()
      .find(m => m.role === "ai" && m.text)?.i;

    if (lastAiIndex === undefined) {
      alert("No AI answer to explain");
      setMoreToolsOpen(false);
      return;
    }

    const lastAiMessage = messages[lastAiIndex].text;

    const prompt = `
Explain the following AI answer STEP BY STEP.
Use simple words.
Explain like teaching a beginner.
Use numbered points.

Answer:
${lastAiMessage}
`;

    // ❌ remove old AI message
    setMessages(prev => [
      ...prev.filter((_, i) => i !== lastAiIndex),
      { role: "ai", typing: true }
    ]);

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("message", prompt);

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      const explainedMsg = {
        role: "ai",
        text: `📖 Step-by-step Explanation:\n\n${data.reply}`
      };

      // ✅ insert explained answer
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, explainedMsg];
      });

      // 💾 save to chat history
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id !== activeChatId) return chat;

          const msgs = chat.messages.filter((_, i) => i !== lastAiIndex);
          msgs.push(explainedMsg);
          return { ...chat, messages: msgs };
        });

        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

    } catch {
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "❌ Failed to explain the answer" }
      ]);
    } finally {
      setLoading(false);
      setMoreToolsOpen(false);
    }
  }

  function handleRewrite() {
    if (!messages.length) {
      alert("Nothing to rewrite");
      setMoreToolsOpen(false);
      return;
    }

    // 🔍 find last USER message index
    const lastUserIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .reverse()
      .find(m => m.role === "user" && m.text)?.i;

    if (lastUserIndex === undefined) {
      alert("No user message found");
      setMoreToolsOpen(false);
      return;
    }

    const userText = messages[lastUserIndex].text;

    // 1️⃣ Put text back into input
    if (inputRef.current) {
      inputRef.current.value = userText;
      autoResize({ target: inputRef.current });
      inputRef.current.focus();
    }

    // 2️⃣ Delete previous conversation (user + AI after it)
    const newMessages = messages.slice(0, lastUserIndex);

    setMessages(newMessages);
    setRewriteDeleteIndex(lastUserIndex);

    // 3️⃣ Update chat storage
    setChats(prev => {
      const updated = prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: newMessages }
          : chat
      );
      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    setMoreToolsOpen(false);
    setIsRewriteMode(true);
  }

  function handleViewArchivedChats() {
    if (archivedChats.length === 0) {
      alert("No archived chats found.");
      setMoreToolsOpen(false);
      return;
    }

    setArchivedOpen(true);     // open archived popup
    setMoreToolsOpen(false);  // close more tools
  }



  async function handleCreateGroupChat() {
    const token = localStorage.getItem("userToken");
    let groupId;

    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: "New Group Chat",
          description: "Group Chat",
          members: []
        })
      });
      const data = await res.json();
      if (!data.id) throw new Error("No group ID returned");
      groupId = data.id;
    } catch {
      alert("Failed to create group on server");
      return;
    }

    const newGroupChat = {
      id: groupId,
      title: "New Group Chat",
      isGroup: true,
      members: [userKey],
      createdAt: new Date().toISOString(),
      pinned: false
    };

    setGroupChats(prev => {
      const updated = [newGroupChat, ...prev];
      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      return updated;
    });

    // Optionally activate the new group chat
    setActiveChatId(newGroupChat.id);
    setMessages([]);
  }

  function handleSearchChats() {
    const searchTerm = prompt("Enter chat name:");

    if (!searchTerm || !searchTerm.trim()) return;

    // 🔍 find FIRST matching chat (like ChatGPT)
    const foundChat = chats.find(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!foundChat) {
      alert("No chat found");
      return;
    }

    // 🔥 OPEN THE CHAT INSTANTLY
    stopMicIfRunning();          // stop voice if running
    setActiveChatId(foundChat.id);
    setMessages(foundChat.messages || []);
  }

  function handleYearReview() {
    navigate("/year-review");
  }



  function handleProjects() {
    setProjectModalOpen(true);
  }

  function handleClearChat() {
    if (!activeChatId) return;

    if (confirm("Are you sure you want to clear this chat?")) {
      // 1️⃣ Clear UI messages
      setMessages([]);

      // 2️⃣ Clear messages INSIDE the chat object (NOT delete chat)
      setChats(prev => {
        const updated = prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [] }   // ✅ only messages cleared
            : chat
        );

        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        return updated;
      });

      // 3️⃣ Also support group chats (important)
      setGroupChats(prev => {
        const updated = prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [] }
            : chat
        );

        localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    setMoreToolsOpen(false);
  }

  /*=============== Remove Function =======================*/

  function removeAttachment(index) {
    setAttachments(prev =>
      prev.filter((_, i) => i !== index)
    );
  }

  /* ================= FILE UPLOAD ================= */
  function handleFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.multiple = true;

    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setAttachments(files);   // store files
      }
    };

    input.click();
  }

  /* ================= VOICE RECORDING ================= */
  function handleVoiceRecording() {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // 🔥 START FRESH EVERY TIME
      finalTranscriptRef.current = "";
      inputRef.current.value = "";
      inputRef.current.style.height = "44px";

      recognitionRef.current.start();
      setIsRecording(true);
    }
  }

  function stopMicIfRunning() {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }

  /* ================= CHAT MENU ACTIONS ================= */
  function handleShareChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chat.messages?.length) {
      alert("Nothing to share");
      return;
    }

    // 1️⃣ Convert chat messages to readable text
    const chatText = chat.messages
      .map(m => {
        if (m.role === "user") return `You: ${m.text}`;
        if (m.role === "ai") return `AI: ${m.text}`;
        return "";
      })
      .join("\n\n");

    const shareContent = `Chat Title: ${chat.title}\n\n${chatText}`;

    // 2️⃣ Try native share (WhatsApp, etc.)
    if (navigator.share) {
      navigator
        .share({
          title: chat.title,
          text: shareContent
        })
        .catch(err => {
          console.log("Share cancelled", err);
        });
    } else {
      // 3️⃣ Fallback → download as .txt file
      const blob = new Blob([shareContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${chat.title.replace(/\s+/g, "_")}.txt`;
      a.click();

      URL.revokeObjectURL(url);
    }

    setOpenChatMenuId(null);
  }

  function handleStartGroupChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    setSourceChatForGroup(chat);
    setStartGroupConfirmOpen(true); // open confirm modal
    setOpenChatMenuId(null);        // close menu
  }



  function handleRenameChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const newTitle = prompt("Enter new chat name:", chat.title);
    if (newTitle && newTitle.trim()) {
      setChats(prev => {
        const updated = prev.map(c =>
          c.id === chatId ? { ...c, title: newTitle.trim() } : c
        );
        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));

        return updated;
      });
    }
    setOpenChatMenuId(null);
  }

  function handlePinChat(chatId) {
    setChats(prev => {
      const updated = prev.map(chat =>
        chat.id === chatId
          ? { ...chat, pinned: !chat.pinned } // 🔥 TOGGLE
          : chat
      );

      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    setOpenChatMenuId(null);
  }

  function handleArchiveChat(chatId) {
    const chatToArchive = chats.find(c => c.id === chatId);
    if (!chatToArchive) return;

    // 1️⃣ Save to ARCHIVED chats (✅ correct key)
    setArchivedChats(prev => {
      const updated = [...prev, { ...chatToArchive, archivedAt: new Date().toISOString() }];
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2️⃣ Remove from YOUR CHATS
    setChats(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    // 3️⃣ Clear active chat if needed
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }

    setOpenChatMenuId(null);
  }

  function handleRestoreArchivedChat(chat, e) {
    e.stopPropagation(); // stop popup click

    // 1️⃣ Remove from archived chats
    setArchivedChats(prev => {
      const updated = prev.filter(c => c.id !== chat.id);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2️⃣ Add back to YOUR CHATS (top, no duplicates)
    setChats(prev => {
      const exists = prev.some(c => c.id === chat.id);
      if (exists) return prev;

      const restoredChat = {
        id: chat.id,
        title: chat.title,
        messages: chat.messages || [],
        createdAt: chat.createdAt || new Date().toISOString()
      };

      const updated = [restoredChat, ...prev];
      localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });

    // 3️⃣ Open the restored chat
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
  }

  function handleDeleteChat(chatId) {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    const updated = chats.filter(c => c.id !== chatId);

    setChats(updated);
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated)); // ✅ correct key

    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }

    setOpenChatMenuId(null);
  }



  /* ================= UI ================= */
  return (
    <div className={`app-container theme-${theme}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="online-header">
          <h4>Online Users</h4>
          <div className="user-avatar">{initials}</div>
        </div>
        {/* SETTINGS BACKDROP */}
        {settingsOpen && (
          <div
            className="settings-backdrop"
            onClick={() => {
              setSettingsOpen(false);
              setThemeMenuOpen(false);
            }}
          />
        )}

        {/* SETTINGS PANEL */}
        <div
          className="settings-panel"
          ref={settingsRef}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <button
            className="settings-header"
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen(prev => !prev);
            }}
          >
            <span>⚙️ Settings</span>
            <span className={`arrow ${settingsOpen ? "open" : ""}`}>▼</span>
          </button>

          {/* DROPDOWN */}
          {settingsOpen && (
            <div
              className="settings-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ACCOUNT */}
              <button
                className="settings-item"
                onClick={() => {
                  setProfileOpen(true);
                  setSettingsOpen(false);
                }}
              >
                <span>👤</span> Account Settings
              </button>

              {/* THEME */}
              <div className="theme-panel">
                <button
                  className="settings-item"
                  onClick={() => setThemeMenuOpen(prev => !prev)}
                >
                  <span>🎨</span> Theme
                  <span className={`arrow ${themeMenuOpen ? "open" : ""}`}>▼</span>
                </button>

                {themeMenuOpen && (
                  <div className="theme-dropdown">
                    <button
                      className={`theme-option ${theme === "light" ? "active" : ""}`}
                      onClick={() => {
                        setTheme("light");
                        setThemeMenuOpen(false);
                        setSettingsOpen(false);
                      }}
                    >
                      <span className="radio-dot">
                        {theme === "light" && <span className="radio-inner"></span>}
                      </span>
                      ☀️ Light
                    </button>

                    <button
                      className={`theme-option ${theme === "dark" ? "active" : ""}`}
                      onClick={() => {
                        setTheme("dark");
                        setThemeMenuOpen(false);
                        setSettingsOpen(false);
                      }}
                    >
                      <span className="radio-dot">
                        {theme === "dark" && <span className="radio-inner"></span>}
                      </span>
                      🌙 Dark
                    </button>
                  </div>
                )}
              </div>

              {/* LOGOUT */}
              <button className="settings-item logout" onClick={handleLogout}>
                <span>🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>


        {/* MENU ITEMS */}
        <button className="menu-item" onClick={createNewChat}>
          <span>✏️</span> New chat
        </button>

        <button className="menu-item" onClick={handleSearchChats}>
          <span>🔍</span> Search chats
        </button>

        <button className="menu-item" onClick={handleYearReview}>
          <span>🎉</span> Your Year With ChatGenius
        </button>



        <button className="menu-item" onClick={handleProjects}>
          <span>📁</span> Projects
        </button>

        {projects.length > 0 && (
          <>
            <div className="sidebar-subtitle">PROJECTS</div>

            <ul className="chat-list">
              <li
                className="chat-item"
                onClick={() => setProjectModalOpen(true)}
              >
                ➕ New project
              </li>

              {projects.map(project => (
                <li
                  key={project.id}
                  className={`chat-item ${project.id === activeProjectId ? "active" : ""}`}
                  onClick={() => {
                    stopMicIfRunning();
                    setActiveProjectId(project.id);
                    setActiveChatId(null);
                    setMessages(project.messages || []);
                  }}
                >
                  <span className="chat-title">💼 {project.name}</span>

                  <button
                    className="chat-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();

                      const rect = e.currentTarget.getBoundingClientRect();
                      setProjectMenuPos({
                        top: rect.top,
                        left: rect.right + 8
                      });

                      setOpenProjectMenuId(project.id);
                    }}
                  >
                    ⋯
                  </button>
                </li>
              ))}
              {openProjectMenuId &&
                createPortal(
                  <div
                    ref={projectMenuRef}
                    className="chat-menu-dropdown"
                    style={{
                      position: "fixed",
                      top: projectMenuPos.top,
                      left: projectMenuPos.left,
                      zIndex: 99999
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="chat-menu-item"
                      onClick={() => handleShareProject(openProjectMenuId)}
                    >
                      📤 Share
                    </button>

                    <button
                      className="chat-menu-item"
                      onClick={() => handleRenameProject(openProjectMenuId)}
                    >
                      ✏️ Rename project
                    </button>

                    <hr className="menu-divider" />

                    <button
                      className="chat-menu-item danger-item"
                      onClick={() => handleDeleteProject(openProjectMenuId)}
                    >
                      🗑️ Delete project
                    </button>
                  </div>,
                  document.body
                )
              }
            </ul>
          </>
        )}



        {/* GROUP CHATS SECTION */}
        {groupChats.length > 0 && (
          <>
            <div className="sidebar-subtitle">GROUP CHATS</div>
            <ul className="chat-list">
              {sortedGroupChats.map(chat => (
                <li
                  key={chat.id}
                  className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
                  onClick={() => handleSelectGroupChat(chat.id)}
                >
                  <div className="chat-title-row">
                    <span className="chat-title-text">{chat.title}</span>
                    {chat.pinned && <span className="pin-indicator">📌</span>}
                  </div>

                  <button
                    className="chat-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();

                      const rect = e.currentTarget.getBoundingClientRect();
                      const sidebarWidth = 260; // your sidebar width

                      setMenuChatId(chat.id);
                      setMenuPos({
                        top: rect.top,
                        left: sidebarWidth + 12,
                      });
                    }}
                  >
                    ...
                  </button>
                </li>
              ))}
            </ul>
            {menuChatId &&
              createPortal(
                <div
                  ref={groupMenuRef}
                  className="chat-popup-menu"
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    zIndex: 100000,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="group-menu-item"
                    onClick={() => handleRenameGroup(menuChatId)}
                  >
                    <span className="menu-icon">✏️</span>
                    <span>Rename</span>
                  </button>

                  <button
                    className="group-menu-item"
                    onClick={() => handlePinGroup(menuChatId)}
                  >
                    <span className="menu-icon">📌</span>
                    <span>
                      {groupChats.find(g => g.id === menuChatId)?.pinned
                        ? "Unpin chat"
                        : "Pin chat"}
                    </span>
                  </button>

                  <button
                    className="group-menu-item"
                    onClick={() => {
                      const link = appLink(`/group/${menuChatId}`);
                      setGroupInviteLink(link);
                      setGroupLinkOpen(true);
                      setMenuChatId(null);
                    }}
                  >
                    <span className="menu-icon">🔗</span>
                    <span>Add people via group link</span>
                  </button>
                  <hr className="menu-divider" />   {/* ✅ ADD THIS */}

                  <button
                    className="group-menu-item delete"
                    onClick={() => handleDeleteGroup(menuChatId)}
                  >
                    <span className="menu-icon">🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>,
                document.body   // 🔥 THIS WAS MISSING
              )
            }
          </>
        )}


        <div className="sidebar-subtitle">YOUR CHATS</div>
        <ul className="chat-list">
          {sortedChats.map(chat => (
            <li
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
            >
              {/* Title + Pin */}
              <div
                className="chat-title-row"
                onClick={() => handleSelectChat(chat.id)}
              >
                <span className="chat-title-text">{chat.title}</span>

                {chat.pinned && <span className="pin-indicator">📌</span>}
              </div>

              {/* 3 dots */}
              <button
                className="chat-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();

                  const rect = e.currentTarget.getBoundingClientRect();

                  // TEMP position (will be fixed after render)
                  setMenuPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.right + 8
                  });

                  setOpenChatMenuId(chat.id);
                }}
              >
                ⋯
              </button>
            </li>
          ))}
        </ul>
        {openChatMenuId &&
          createPortal(
            <div
              ref={chatMenuRef}
              className="chatgpt-menu"   // ✅ CHANGE HERE
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="menu-row" onClick={() => handleShareChat(openChatMenuId)}>
                <span className="menu-icon">📤</span>
                Share
              </button>

              <button className="menu-row" onClick={() => handleStartGroupChat(openChatMenuId)}>
                <span className="menu-icon">👥</span>
                Start a group chat
              </button>

              <button className="menu-row" onClick={() => handleRenameChat(openChatMenuId)}>
                <span className="menu-icon">✏️</span>
                Rename
              </button>

              <div className="menu-divider" />

              <button className="menu-row" onClick={() => handlePinChat(openChatMenuId)}>
                <span className="menu-icon">📌</span>
                {chats.find(c => c.id === openChatMenuId)?.pinned
                  ? "Unpin chat"
                  : "Pin chat"}
              </button>

              <button className="menu-row" onClick={() => handleArchiveChat(openChatMenuId)}>
                <span className="menu-icon">🗄️</span>
                Archive
              </button>

              <div className="menu-divider" />

              <button
                className="menu-row danger"
                onClick={() => handleDeleteChat(openChatMenuId)}
              >
                <span className="menu-icon">🗑️</span>
                Delete
              </button>
            </div>,
            document.body
          )
        }
        {startGroupConfirmOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Convert to Group Chat?</h3>
              <p className="group-chat-description">
                This will create a new group based on this conversation.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setStartGroupConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="primary" onClick={confirmStartGroupChat}>
                  Start group chat
                </button>
              </div>
            </div>
          </div>
        )}

        {groupLinkOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <span className="modal-icon">🔗</span>
              <h3>Group invite link</h3>
              <p>Anyone with this link can join and see previous messages.</p>

              <input
                className="modal-input"
                value={groupInviteLink}
                readOnly
                onClick={e => e.target.select()}
                placeholder="Invite link will appear here..."
              />

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setGroupLinkOpen(false)}>
                  Cancel
                </button>

                <button
                  className="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(groupInviteLink);
                    setGroupLinkOpen(false);
                  }}
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        )}



        {/* MORE TOOLS BUTTON */}
        {/* MORE TOOLS BUTTON */}
        <div className="more-tools-container" ref={moreToolsRef}>
          <button
            className="more-tools-btn"
            onClick={() => setMoreToolsOpen(!moreToolsOpen)}
          >
            <span>🛠️</span> More Tools
            <span className="arrow">▲</span>
          </button>

          {/* MAIN MORE TOOLS MENU */}
          {moreToolsOpen && (
            <div className="more-tools-popup">
              <button className="popup-menu-item" onClick={handleSummarize}>
                <span>🧠</span> Summarize Chat
              </button>

              <button
                className="popup-menu-item"
                onClick={handleTranslate}
              >
                <span>🌐</span> Translate
              </button>

              <button className="popup-menu-item" onClick={handleExplain}>
                <span>📖</span> Explain
              </button>

              <button className="popup-menu-item" onClick={handleRewrite}>
                <span>✍️</span> Rewrite
              </button>

              <button className="popup-menu-item" onClick={handleViewArchivedChats}>
                <span>🗄️</span> Archived Chats
                {archivedChats.length > 0 && (
                  <span className="archive-badge">{archivedChats.length}</span>
                )}
              </button>

              <hr />

              <button
                className="popup-menu-item danger-item"
                onClick={handleClearChat}
              >
                <span>🗑️</span> Clear Chat
              </button>
            </div>
          )}

          {/* TRANSLATE LANGUAGE PICKER */}
          {translateOpen && (
            <div className="more-tools-popup">
              <div style={{ padding: "6px", fontWeight: "bold" }}>
                Select Language
              </div>

              {TRANSLATE_LANGS.map(lang => (
                <button
                  key={lang.code}
                  className="popup-menu-item"
                  onClick={() => translateLastAiMessage(lang.label)}
                >
                  🌐 {lang.label}
                </button>
              ))}

              <hr />

              <button
                className="popup-menu-item"
                onClick={() => setTranslateOpen(false)}
              >
                ❌ Cancel
              </button>
            </div>
          )}


          {/* ARCHIVED CHATS POPUP */}
          {archivedOpen && (
            <div className="more-tools-popup" ref={archivedRef}>
              <div style={{ padding: "6px", fontWeight: "bold" }}>
                Archived Chats ({archivedChats.length})
              </div>

              {archivedChats.map(chat => (
                <div
                  key={chat.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  {/* Open archived chat */}
                  <button
                    className="popup-menu-item"
                    style={{ flex: 1, textAlign: "left" }}
                    onClick={() => handleOpenArchivedChat(chat)}
                  >
                    🗄️ {chat.title}
                  </button>

                  {/* ❌ Delete archived chat */}
                  <button
                    title="Restore chat"
                    onClick={(e) => handleRestoreArchivedChat(chat, e)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "red",
                      fontSize: "18px",
                      cursor: "pointer",
                      marginLeft: "6px"
                    }}
                  >
                    ❌
                  </button>
                </div>
              ))}

              <hr />

              <button
                className="popup-menu-item"
                onClick={() => setArchivedOpen(false)}
              >
                ❌ Close
              </button>
            </div>
          )}





        </div>
      </aside>

      {/* CHAT AREA */}
      <main className="chat-area">
        <header className="chat-header">
          <div>
            <h3>
              {(() => {
                const activeGroup = groupChats.find(g => g.id === activeChatId);
                if (activeGroup) return `Group Chat - ${groupName || activeGroup.title || activeChatId}`;

                const activeNormal = chats.find(c => c.id === activeChatId);
                if (activeNormal) return activeNormal.title || "General Real-Chat";

                return "General Real-Chat";
              })()}
            </h3>
            <span className="status">Online</span>
          </div>
          <div className="header-actions">
            <button className="group-chat-btn" onClick={() => setGroupChatModalOpen(true)}>GROUP CHAT</button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="messages">
          {groupChats.some(g => g.id === activeChatId) && (
            <div style={{ textAlign: "center", margin: "10px 0", color: "#666", fontSize: "12px", background: "#f0f0f0", padding: "6px 12px", borderRadius: "12px", width: "fit-content", alignSelf: "center", marginInline: "auto" }}>
              You joined this group
            </div>
          )}
          {messages.map((msg, i) => {
            const currentUserId = Number(localStorage.getItem("userId"));
            // Fallback to msg.role if user_id is missing (optimistic updates)
            const isMe = (msg.role === "ai" || msg.message_type === "ai_text" || msg.message_type === "ai_image") ? false : (msg.user_id ? msg.user_id === currentUserId : msg.role === "user");

            return (
              <div key={i} className={`msg ${isMe ? "user" : "ai"}`}>              <div className="msg-bubble">   {/* ⭐ ADD THIS WRAPPER */}

                {/* COPY BUTTON — ONLY USER */}
                {msg.role === "user" && msg.text && (
                  <div className="user-msg-actions">
                    <button
                      className="copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMessage(msg.text);
                      }}
                      title="Copy"
                    >
                      📋
                    </button>

                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMessage(i);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  </div>
                )}

                {/* SENDER NAME FOR !isMe */}
                {!isMe && (msg.username || msg.role === "ai") && (
                  <div className="sender-name" style={{ fontSize: "11px", fontWeight: "bold", opacity: 0.8, marginBottom: "4px" }}>
                    {(msg.role === "ai" || msg.type === "ai_text" || msg.message_type === "ai_text") ? "ChatGenius" : msg.username}
                  </div>
                )}

                {/* ACTIONS - For ALL messages */}
                <div className="msg-actions">
                  <button title="Like" onClick={() => addReaction(i, "👍")}>👍</button>
                  <button title="Laugh" onClick={() => addReaction(i, "😂")}>😂</button>
                  <button title="Love" onClick={() => addReaction(i, "❤️")}>❤️</button>

                  <button title="Reply" onClick={() => handleReply(i)}>↩️</button>
                  <button title="Pin" onClick={() => togglePinMessage(i)}>
                    {msg.pinned ? "📍" : "📌"}
                  </button>
                </div>

                {/* MESSAGE CONTENT */}
                {msg.typing ? (
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : msg.image ? (
                  <img src={msg.image} className="ai-image" />
                ) : (
                  <>
                    {/* REPLY PREVIEW */}
                    {msg.replyTo && (
                      <div className="reply-preview">
                        ↪ {messages.find(m => m.id === msg.replyTo)?.text?.slice(0, 80)}
                      </div>
                    )}

                    <div className="msg-text">
                      <pre className="ai-text">
                        {msg.text || (msg.role === 'ai' || msg.type === 'ai_text' ? "⚠️ AI response encountered an error. Retrying..." : "")}
                      </pre>
                    </div>

                    {msg.attachments?.length > 0 && (
                      <div className="msg-attachments" style={{ marginTop: "8px" }}>
                        {msg.attachments.map((file, fi) => (
                          <div key={fi} className="attachment-chip" style={{ display: "inline-block", marginRight: "5px", padding: "4px 8px", background: "rgba(0,0,0,0.05)", borderRadius: "12px", fontSize: "12px" }}>
                            📎 {file.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.reactions?.length > 0 && (
                      <div className="reactions">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri}>{r}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}

              </div>   {/* ⭐ CLOSE BUBBLE */}

                <div className="msg-time">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>

              </div>
            );
          })}


          {/* AI TYPING INDICATOR (GLOBAL) */}
          {isAiTyping && (
            <div className="msg ai">
              <div className="msg-bubble">
                <div className="sender-name" style={{ fontSize: "11px", fontWeight: "bold", opacity: 0.8, marginBottom: "4px" }}>
                  ChatGenius
                </div>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        <footer className="chat-input-area">
          <button
            className="attachment-btn"
            onClick={handleFileUpload}
            title="Upload files or images"
          >
            +
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            className="chat-textarea"
            placeholder="Message ChatGenius..."
            defaultValue={draftText}
            onInput={(e) => {
              autoResize(e);

              const value = e.target.value;
              setDraftText(value);

              if (activeChatId && userKey) {
                const key = `draftText_${userKey}_${activeChatId}`;
                localStorage.setItem(key, value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (e.nativeEvent.isComposing) return;
                e.preventDefault();
                e.stopPropagation();
                sendMessage();
              }
            }}
          />
          {attachments.length > 0 && (
            <div className="attachment-preview">
              {attachments.map((file, i) => (
                <div key={i} className="attachment-chip">
                  📎 {file.name}

                  <button
                    className="remove-attachment"
                    onClick={() => removeAttachment(i)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            ref={micBtnRef}
            className={`mic-btn ${isRecording ? "recording" : ""}`}
            onClick={handleVoiceRecording}
          >
            🎤
          </button>


          <button onClick={(e) => { e.preventDefault(); sendMessage(); }}>➤</button>
        </footer>
      </main>

      {/* PROJECT MODAL */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreateProject={(project) => {
          setProjects(prev => {
            const updated = [project, ...prev];
            localStorage.setItem(PROJECT_KEY, JSON.stringify(updated));
            return updated;
          });

          // 🔥 Open project immediately
          setActiveProjectId(project.id);
          setMessages([]);
        }}
      />

      {/* GROUP CHAT MODAL */}
      <GroupChatModal
        isOpen={groupChatModalOpen}
        onClose={() => setGroupChatModalOpen(false)}
        onCreateGroupChat={async (newGroupChat) => {
          const token = localStorage.getItem("userToken");
          try {
            const res = await fetch(`${API_URL}/api/groups`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                title: newGroupChat.title || "New Group Chat",
                description: "Group Chat from modal",
                members: []
              })
            });
            const data = await res.json();
            if (data.id) {
              newGroupChat.id = data.id;
            } else {
              throw new Error("No logic id returned");
            }
          } catch (e) {
            console.error("Failed to create group on server", e);
            alert("Failed to create group on server");
            return;
          }

          setGroupChats(prev => {
            const updated = [newGroupChat, ...prev];
            localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
            return updated;
          });
          
          // Select it automatically
          handleSelectGroupChat(newGroupChat.id);
        }}
      />
      {logoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <span className="modal-icon">👋</span>
            <h3>Logout</h3>
            <p>Are you sure you want to logout? All unsaved state will be cleared.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setLogoutModalOpen(false)}>
                Cancel
              </button>
              <button className="primary" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

    </div>
  );
}
