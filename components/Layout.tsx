import React from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 pb-4 pt-12 md:pt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout; 