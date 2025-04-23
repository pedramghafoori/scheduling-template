import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Pool-Course Scheduler</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Scheduler
                </Link>
              </li>
              <li>
                <Link
                  to="/manage"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex">{children}</main>
    </div>
  );
};

export default Layout;
