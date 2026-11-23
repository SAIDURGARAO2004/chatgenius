import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/yearReview.css";

export default function YearReview() {
    const navigate = useNavigate();
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

    const [stats, setStats] = useState({
        totalChats: 0,
        totalMessages: 0,
        joinDate: "Recently",
        daysSinceJoining: 0
    });

    useEffect(() => {

        const userEmail = localStorage.getItem("userEmail");
        const userKey = localStorage.getItem("userUsername");

        const userDataKey = `user_${userEmail}`;
        const userData = localStorage.getItem(userDataKey);

        let year = new Date().getFullYear();
        let joinDate = "Recently";
        let daysSinceJoining = 0;

        if (userData) {
            try {
                const parsed = JSON.parse(userData);

                year = parsed.registeredYear || year;

                if (parsed.registeredDate) {
                    const date = new Date(parsed.registeredDate);

                    joinDate = date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });

                    const today = new Date();

                    daysSinceJoining = Math.floor(
                        (today - date) / (1000 * 60 * 60 * 24)
                    );
                }

            } catch (e) {
                console.error("User data parse error:", e);
            }
        }

        setDisplayYear(year);

        /* ================= CHAT STATS ================= */

        const CHAT_KEY = `chats_${userKey}`;
        const GROUP_KEY = `groupChats_${userKey}`;
        const PROJECT_KEY = `projects_${userKey}`;

        const chats = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
        const groupChats = JSON.parse(localStorage.getItem(GROUP_KEY)) || [];
        const projects = JSON.parse(localStorage.getItem(PROJECT_KEY)) || [];

        const totalChats =
            chats.length +
            groupChats.length +
            projects.length;

        const totalMessages =
            chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0) +
            groupChats.reduce((sum, g) => sum + (g.messages?.length || 0), 0) +
            projects.reduce((sum, p) => sum + (p.messages?.length || 0), 0);

        setStats({
            totalChats,
            totalMessages,
            joinDate,
            daysSinceJoining
        });

    }, []);

    /* ================= GET STARTED ================= */

    const handleGetStarted = () => {

        const average =
            stats.totalChats > 0
                ? Math.round(stats.totalMessages / stats.totalChats)
                : 0;

        const statsMessage = `

🎉 Your ${displayYear} ChatGenius Journey!

📅 Joined: ${stats.joinDate}

⏱ Days Active: ${stats.daysSinceJoining} ${stats.daysSinceJoining === 1 ? "day" : "days"
            }

💬 Total Chats: ${stats.totalChats}

✉ Total Messages: ${stats.totalMessages}

📊 Average Messages per Chat: ${average}

🎯 Status: ${stats.totalChats > 0
                ? "🔥 Active User!"
                : "🌟 Just Getting Started!"
            }

${stats.totalMessages > 100
                ? "🏆 Power User Badge Unlocked!"
                : ""
            }

${stats.totalChats > 10
                ? "💎 Chat Master Badge Unlocked!"
                : ""
            }

Keep chatting to build your year! 🚀

`;

        alert(statsMessage);

        navigate("/chat");
    };

    return (
        <div className="year-review-page">

            <div className="year-review-card">

                {/* YEAR CIRCLE */}
                <div className="year-circle">
                    <span>{displayYear}</span>
                </div>

                {/* CONTENT */}
                <div className="year-content">

                    <h2>Your Year with ChatGenius</h2>

                    <p>
                        Explore the chats and ideas that shaped your journey since {displayYear}.
                    </p>

                    <button
                        className="year-btn"
                        onClick={handleGetStarted}
                    >
                        Get started
                    </button>

                </div>

            </div>

        </div>
    );
}