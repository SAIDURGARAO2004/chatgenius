import UserAvatar from "./UserAvatar.jsx";
import { useState } from "react";

export default function Sidebar({ openAccount, openProject }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h4>Online Users</h4>
        <UserAvatar onClick={openAccount} />
      </div>

      <div className="sidebar-section gpt-menu">
        <button className="menu-item">✏️ New chat</button>
        <button className="menu-item">🔍 Search chats</button>
        <button className="menu-item">🖼 Images</button>
        <button className="menu-item" onClick={openProject}>
          📁 Projects
        </button>
      </div>

      <div className="sidebar-section">
        <h5 className="sidebar-subtitle">Your chats</h5>
        <ul className="chat-list">
          {/* chats will come here */}
        </ul>
      </div>
    </aside>
  );
}
