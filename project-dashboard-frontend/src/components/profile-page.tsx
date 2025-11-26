
export function ProfilePage() {
  return (
    <div className="w-full h-[calc(100vh-140px)]">
      <iframe
        src="/profile.tsx"
        className="w-full h-full border-4 border-white/20 rounded-xl shadow-2xl"
        title="Profile Editor"
      />
    </div>
  );
}