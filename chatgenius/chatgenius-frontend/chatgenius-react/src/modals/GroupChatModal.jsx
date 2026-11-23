import "../styles/modal.css";

export default function GroupChatModal({ isOpen, onClose, onCreateGroupChat }) {
    function handleStartGroupChat() {
        // Create new group chat
        const newGroupChat = {
            id: Date.now(),
            title: "New Group Chat",
            isGroup: true,
            messages: [],
            createdAt: new Date().toISOString()
        };

        // Call parent function to add to sidebar
        if (onCreateGroupChat) {
            onCreateGroupChat(newGroupChat);
        }

        // Close modal
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content group-chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Start group chat from this conversation</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <p className="group-chat-description">
                        Only this conversation will be shared. Your personal CHATGENIUS memory is always private.
                    </p>


                </div>

                <div className="modal-footer group-chat-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="primary" onClick={handleStartGroupChat}>
                        Start group chat
                    </button>
                </div>
            </div>
        </div>
    );
}
