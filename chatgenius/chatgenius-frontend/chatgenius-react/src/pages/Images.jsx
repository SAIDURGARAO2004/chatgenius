import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Images() {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");

    function handleSearch(e) {
        if (e.key === "Enter" && prompt.trim()) {
            navigate("/chat", {
                state: { imagePrompt: prompt }
            });
        }
    }

    return (
        <div className="images-page">
            <h1 className="images-title">Images</h1>

            <div className="image-search-bar">
                <span>🖼️</span>
                <input
                    placeholder="Describe a new image"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>
        </div>
    );
}