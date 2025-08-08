import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Repositories from "@/pages/repositories";
import Approvals from "@/pages/approvals";
import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/task-detail";
import ContainerDetail from "@/pages/container-detail";
import Sidebar from "@/components/layout/sidebar";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import { LoginPage } from "@/pages/login";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <Sidebar />}
      <div className={user ? "flex-1 lg:ml-64 pt-16 lg:pt-0" : "flex-1"}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/">
            {user ? <Dashboard /> : <Redirect to="/login" />}
          </Route>
          <Route path="/projects">
            {user ? <Projects /> : <Redirect to="/login" />}
          </Route>
          <Route path="/projects/:id">
            {(params) => user ? <ProjectDetail {...params} /> : <Redirect to="/login" />}
          </Route>
          <Route path="/repositories">
            {user ? <Repositories /> : <Redirect to="/login" />}
          </Route>
          <Route path="/approvals">
            {user ? <Approvals /> : <Redirect to="/login" />}
          </Route>
          <Route path="/tasks">
            {user ? <Tasks /> : <Redirect to="/login" />}
          </Route>
          <Route path="/tasks/:id">
            {(params) => user ? <TaskDetail {...params} /> : <Redirect to="/login" />}
          </Route>
          <Route path="/containers/:id">
            {(params) => user ? <ContainerDetail {...params} /> : <Redirect to="/login" />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
