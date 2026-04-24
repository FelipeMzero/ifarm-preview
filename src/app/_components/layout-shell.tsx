'use client';
import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export default function LayoutShell({ children }: { children: ReactNode }) {

    return (
        <div className="flex flex-col h-screen">
            <Header/>

            <div className="flex flex-1" >
                <Sidebar/>

                <div className="flex-1 p-6">
                    {children}
                </div>
            </div >

            <footer className="bg-background-2">
                status
            </footer>
        </div>

    );
}