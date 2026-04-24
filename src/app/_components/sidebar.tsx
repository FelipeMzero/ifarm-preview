import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 p-4 border-r border-foreground-2">
      <nav className="flex flex-col gap-2">
        <Link href="./">Home</Link>
        <Link href="./counter">Contador</Link>
        <Link href="./users">Usuários</Link>
      </nav>
    </aside>
  );
}