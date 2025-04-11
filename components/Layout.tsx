import React from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-w-md pb-md pt-xl md:pt-2xl">
        {children}
      </main>
    </div>
  );
};

export default Layout; 