'use client';
import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export default function LayoutShell({ children }: { children: ReactNode }) {

    return (
        <div className="h-screen flex flex-col">
            <Header/>

            <div className="flex flex-1 overflow-hidden" >
                <Sidebar/>

                <div className="flex-1 overflow-y-auto bg-zinc-400 p-6">
                    {children}
                </div>
            </div >

            <footer>
                status
            </footer>
        </div>

    );
}