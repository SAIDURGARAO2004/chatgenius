import { API_URL } from "../config";
import { useEffect, useState } from "react";
import "../styles/profile.css";

export default function ProfileModal({ isOpen, onClose }) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");

    // Load profile data when modal opens
    useEffect(() => {
        if (isOpen) {
            // Populate initially from localStorage so boxes are never empty
            let storedEmail = localStorage.getItem("userEmail") || "";
            let storedName = localStorage.getItem("userName") || localStorage.getItem("userUsername") || "";

            // Also try to get from user object if available
            try {
                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                if (userObj.name) storedName = userObj.name;
                if (userObj.email) storedEmail = userObj.email;
            } catch (e) {
                // Ignore parse errors
            }

            setDisplayName(storedName);
            setEmail(storedEmail);

            const token = localStorage.getItem("userToken");   // ✅ FIX

            fetch(`${API_URL}/api/users/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.full_name || data.username) {
                        setDisplayName(data.full_name || data.username);
                    }
                    if (data.email) {
                        setEmail(data.email);
                    }
                })
                .catch(err => console.error("Error loading profile:", err));
        }
    }, [isOpen]);

    async function handleSave() {
        if (!displayName.trim()) {
            alert("Display name cannot be empty");
            return;
        }

        const token = localStorage.getItem("userToken");

        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: displayName.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                console.log(data);
                alert("Profile update failed");
                return;
            }

            const newName = displayName.trim();

            // update local storage
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            user.name = newName;
            localStorage.setItem("user", JSON.stringify(user));

            localStorage.setItem("userName", newName);

            alert("Profile updated successfully");

            // refresh chat avatar initials
            window.location.reload();

        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Server connection error");
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="profile-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="profile-header">
                    <h2>Account Settings</h2>
                </div>

                {/* BODY */}
                <div className="profile-body">
                    <label>Display name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />

                    <label>Username (email)</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                    />
                </div>

                {/* FOOTER */}
                <div className="profile-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="primary"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}