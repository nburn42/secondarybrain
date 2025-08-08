import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { PageLayout, PageContent } from "@/components/layout/page-layout";
import StatsCard from "@/components/stats-card";
import ProjectCard from "@/components/project-card";
import { ProjectWithRelations } from "@shared/schema";
import { useLocation } from "wouter";
import { 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Zap,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    select: (data: ProjectWithRelations[]) => data?.slice(0, 3),
  });

  const { data: approvals } = useQuery({
    queryKey: ["/api/approvals"],
    select: (data) => data?.slice(0, 2),
  });

  if (statsLoading || projectsLoading) {
    return (
      <PageLayout>
        <Header 
          title="Dashboard" 
          subtitle="Overview of your projects and tasks"
          showNewButton
          onNewClick={() => setLocation("/projects")}
        />
        <PageContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header 
        title="Dashboard" 
        subtitle="Overview of your projects and tasks"
        showNewButton
        onNewClick={() => setLocation("/projects")}
      />
      
      <PageContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            icon={FolderOpen}
            iconColor="text-primary"
          />
          <StatsCard
            title="Pending Approval"
            value={stats?.pendingApprovals || 0}
            icon={Clock}
            iconColor="text-warning"
          />
          <StatsCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            icon={CheckCircle}
            iconColor="text-accent"
          />
          <StatsCard
            title="Running Tasks"
            value={stats?.runningTasks || 0}
            icon={Zap}
            iconColor="text-blue-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/projects")}
                  className="text-primary hover:text-blue-700"
                >
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {projects?.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  />
                ))}
                {projects?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setLocation("/projects")}
                    >
                      Create your first project
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Approval Queue Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Approval Queue</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/approvals")}
                  className="text-primary hover:text-blue-700"
                >
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {approvals?.map((approval) => (
                  <div key={approval.id} className="border-l-4 border-warning pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{approval.task.title}</h4>
                        <p className="text-sm text-gray-500">
                          {approval.task.project.name} • Submitted{" "}
                          {new Date(approval.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {approvals?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending approvals</p>
                  </div>
                )}
                
                {approvals && approvals.length > 0 && (
                  <div className="text-center py-4">
                    <Button 
                      onClick={() => setLocation("/approvals")}
                      className="bg-primary hover:bg-blue-700"
                    >
                      Open Swipe Interface
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="p-4 h-auto justify-start"
              onClick={() => setLocation("/projects")}
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">New Project</div>
                <div className="text-sm text-gray-500">Create a new project</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-4 h-auto justify-start"
              onClick={() => setLocation("/tasks")}
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Tasks</div>
                <div className="text-sm text-gray-500">Manage all tasks</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-4 h-auto justify-start"
              onClick={() => setLocation("/approvals")}
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Review Approvals</div>
                <div className="text-sm text-gray-500">Process pending items</div>
              </div>
            </Button>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
