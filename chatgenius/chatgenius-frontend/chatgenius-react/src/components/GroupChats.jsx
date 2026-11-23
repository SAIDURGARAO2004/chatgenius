import { useState } from "react";
import "./groupChats.css";

export default function GroupChats() {
    const [groups, setGroups] = useState([
        { id: 1, title: "Group Chat 1" }
    ]);

    const createGroup = () => {
        const newGroup = {
            id: Date.now(),
            title: `Group Chat ${groups.length + 1}`
        };
        setGroups([newGroup, ...groups]);
    };

    const renameGroup = (id) => {
        const name = prompt("Rename group:");
        if (!name) return;

        setGroups(groups.map(g =>
            g.id === id ? { ...g, title: name } : g
        ));
    };

    const deleteGroup = (id) => {
        setGroups(groups.filter(g => g.id !== id));
    };

    return (
        <div className="group-section">
            <h5 className="group-title">GROUP CHATS</h5>

            <button className="new-group-btn" onClick={createGroup}>
                ✏️ New Group Chat
            </button>

            <ul className="group-list">
                {groups.map(group => (
                    <GroupItem
                        key={group.id}
                        group={group}
                        onRename={renameGroup}
                        onDelete={deleteGroup}
                    />
                ))}
            </ul>
        </div>
    );
}

function GroupItem({ group, onRename, onDelete }) {
    const [open, setOpen] = useState(false);

    return (
        <li
            className="group-item"
            onMouseLeave={() => setOpen(false)}
        >
            <span className="group-name">{group.title}</span>

            <button
                className="more-btn"
                onClick={() => setOpen(!open)}
            >
                ⋯
            </button>

            {open && (
                <div className="group-menu">
                    <div onClick={() => onRename(group.id)}>✏️ Rename</div>
                    <hr />
                    <div
                        className="danger"
                        onClick={() => onDelete(group.id)}
                    >
                        🗑 Delete
                    </div>
                </div>
            )}
        </li>
    );
}
