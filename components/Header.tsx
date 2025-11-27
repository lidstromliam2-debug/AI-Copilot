// components/Header.tsx
export default function Header() {
return (
<header style={{ height: 64, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", padding: "0 18px", background: "#fff" }}>
<div style={{ flex: 1 }}>
<nav style={{ display: "flex", gap: 16 }}>
<a href="#" style={{ color: "#444" }}>Home</a>
<a href="#" style={{ color: "#444" }}>Dashboard</a>
<a href="/copilot" style={{ color: "#111", fontWeight: 600 }}>AI Copilot</a>
<a href="#" style={{ color: "#444" }}>Market</a>
<a href="#" style={{ color: "#444" }}>Journal</a>
</nav>
</div>
<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
<button style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}>Sign in</button>
<button style={{ padding: "6px 10px", borderRadius: 8, background: "#111", color: "#fff", border: "none" }}>Sign up</button>
</div>
</header>
);
}