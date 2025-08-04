import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckCircle, 
  ClipboardList,
  GitBranch,
  Plus,
  Circle,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentProjects } = useQuery({
    queryKey: ["/api/projects"],
    select: (data) => data?.slice(0, 2),
  });

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/",
    },
    {
      name: "Projects", 
      href: "/projects",
      icon: FolderOpen,
      current: location === "/projects",
    },
    {
      name: "Repositories",
      href: "/repositories",
      icon: GitBranch,
      current: location === "/repositories",
    },
    {
      name: "Approval Queue",
      href: "/approvals", 
      icon: CheckCircle,
      current: location === "/approvals",
      badge: stats?.pendingApprovals,
    },
    {
      name: "All Tasks",
      href: "/tasks",
      icon: ClipboardList,
      current: location === "/tasks",
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Tandembrain</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center px-6 py-4 border-b border-gray-200 lg:block hidden">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Tandembrain</h1>
          </div>
        </div>
      
        <nav className="mt-6 px-3 pt-16 lg:pt-0">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
              <a className={`
                ${item.current 
                  ? 'bg-blue-50 text-primary' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md
              `}>
                <item.icon className={`
                  ${item.current ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'} 
                  mr-3 h-5 w-5
                `} />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-warning text-white rounded-full px-2 py-1 text-xs">
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="mt-8 px-3">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Projects
        </h3>
        <div className="mt-2 space-y-1">
          {recentProjects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <a className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <Circle className="w-2 h-2 mr-3 text-accent fill-current" />
                {project.name}
              </a>
            </Link>
          ))}
          <Link href="/projects">
            <a className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Plus className="w-4 h-4 mr-2" />
              View All
            </a>
          </Link>
        </div>
        
        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-sm text-gray-700 truncate max-w-[150px]">
                {user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
