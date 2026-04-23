import Link from "next/link";

export function Sidebar() {
  return (
    <aside
      className={`
        bg-zinc-800 text-white w-64 p-4
        fixed md:static top-14 bottom-0 z-40
        transition-transform transform
        md:translate-x-0
      `}
    >
      <nav className="flex flex-col gap-2">
        <Link href="./">Home</Link>
        <Link href="./counter">Contador</Link>
        <Link href="./users">Usuários</Link>
      </nav>
    </aside>
  );
}