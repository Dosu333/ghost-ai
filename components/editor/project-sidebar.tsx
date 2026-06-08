"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import type { MockProject } from "@/components/editor/project-data"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: MockProject[]
  sharedProjects: MockProject[]
  onCreateProject: () => void
  onRenameProject: (project: MockProject) => void
  onDeleteProject: (project: MockProject) => void
}

const projectTabs = [
  {
    value: "my-projects",
    label: "My Projects",
    title: "No projects yet",
    description: "Your owned projects will appear here once the project flow is connected.",
  },
  {
    value: "shared",
    label: "Shared",
    title: "Nothing shared yet",
    description: "Projects shared with you will show up in this tab when collaboration is wired in.",
  },
]

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
}: ProjectSidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close project sidebar"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 top-16 z-20 bg-black/45 transition-opacity duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "pointer-events-none fixed top-20 bottom-4 left-4 z-30 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 ease-out",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+1.5rem)] opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="pointer-events-auto flex h-full flex-col rounded-3xl border border-surface-border bg-surface/92 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-copy-primary">Projects</h2>
              <p className="text-sm text-copy-muted">
                Create, rename, or remove your mock workspaces.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-xl text-copy-secondary hover:text-copy-primary"
              onClick={onClose}
              aria-label="Close project sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            defaultValue="my-projects"
            className="mt-4 flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-subtle p-1">
              {projectTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="my-projects" className="mt-4 min-h-0 flex-1">
              <ProjectList
                emptyTitle={projectTabs[0].title}
                emptyDescription={projectTabs[0].description}
                projects={ownedProjects}
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
                showActions
              />
            </TabsContent>

            <TabsContent value="shared" className="mt-4 min-h-0 flex-1">
              <ProjectList
                emptyTitle={projectTabs[1].title}
                emptyDescription={projectTabs[1].description}
                projects={sharedProjects}
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
                showActions={false}
              />
            </TabsContent>
          </Tabs>

          <Button className="mt-4 w-full rounded-xl" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectListProps {
  emptyDescription: string
  emptyTitle: string
  projects: MockProject[]
  showActions: boolean
  onRenameProject: (project: MockProject) => void
  onDeleteProject: (project: MockProject) => void
}

function ProjectList({
  emptyDescription,
  emptyTitle,
  projects,
  showActions,
  onDeleteProject,
  onRenameProject,
}: ProjectListProps) {
  if (!projects.length) {
    return (
      <div className="flex h-full min-h-52 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-elevated/70 px-6 text-center">
        <div className="space-y-2">
          <h3 className="text-base font-medium text-copy-primary">
            {emptyTitle}
          </h3>
          <p className="text-sm leading-6 text-copy-muted">
            {emptyDescription}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-2xl border border-surface-border bg-elevated/75 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-copy-primary">
                {project.name}
              </div>
              <div className="mt-1 font-mono text-xs text-brand">
                {project.slug}
              </div>
            </div>

            {showActions ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl text-copy-secondary hover:text-copy-primary"
                  aria-label={`Rename ${project.name}`}
                  onClick={() => onRenameProject(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl text-copy-secondary hover:text-error"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => onDeleteProject(project)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
