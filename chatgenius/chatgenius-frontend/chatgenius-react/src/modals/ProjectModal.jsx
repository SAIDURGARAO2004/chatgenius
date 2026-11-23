import { useEffect, useState } from "react";
import "../styles/modal.css";

export default function ProjectModal({ isOpen, onClose, onCreateProject }) {
    const [projectName, setProjectName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        { id: "investing", name: "Investing", emoji: "💰" },
        { id: "homework", name: "Homework", emoji: "📚" },
        { id: "writing", name: "Writing", emoji: "✍️" },
        { id: "health", name: "Health", emoji: "❤️" },
        { id: "travel", name: "Travel", emoji: "✈️" }
    ];

    // 🔥 reset modal state when opened
    useEffect(() => {
        if (isOpen) {
            setProjectName("");
            setSelectedCategory(null);
        }
    }, [isOpen]);

    function handleCategoryClick(cat) {
        setSelectedCategory(cat.id);
        setProjectName(cat.name); // 🔥 AUTO-FILL INPUT
    }

    function handleCreateProject() {
        if (!projectName.trim()) {
            alert("Please enter a project name");
            return;
        }

        const newProject = {
            id: Date.now(),
            name: projectName.trim(),
            category: selectedCategory,
            messages: [],
            createdAt: new Date().toISOString()
        };

        // 🔥 SEND PROJECT TO Chat.jsx
        onCreateProject(newProject);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content project-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Create project</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <input
                        type="text"
                        className="project-name-input"
                        placeholder="Project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        autoFocus
                    />

                    <div className="category-grid">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className={`category-btn ${selectedCategory === cat.id ? "selected" : ""
                                    }`}
                                onClick={() => handleCategoryClick(cat)}
                            >
                                <span className="category-emoji">{cat.emoji}</span>
                                <span className="category-name">{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="project-info">
                        💡 Projects keep chats, files, and instructions in one place.
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="primary" style={{ width: "100%" }} onClick={handleCreateProject}>
                        Create project
                    </button>
                </div>
            </div>
        </div>
    );
}