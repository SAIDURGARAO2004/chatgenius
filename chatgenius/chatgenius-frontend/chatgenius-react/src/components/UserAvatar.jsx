export default function UserAvatar({ onClick }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const initials = user?.name
    ? user.name
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <div className="user-avatar" onClick={onClick}>
      {initials}
    </div>
  );
}
