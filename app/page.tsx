import {
  Bot,
  Layers3,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const systemLayers = [
  "Realtime canvas presence and collaboration streams",
  "AI architecture generation workflows and task orchestration",
  "Project metadata, artifacts, and access boundaries",
  "Starter design templates for fast system bootstrapping",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-base px-6 py-10 text-copy-primary sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border border-surface-border bg-surface/80">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-elevated px-3 py-1.5 text-sm text-copy-secondary">
                <Sparkles className="h-4 w-4 text-brand" />
                Design system foundation
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-copy-primary sm:text-5xl">
                  Ghost AI now ships with a dark-first UI primitive layer.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-copy-secondary">
                  The requested shadcn components are installed, the shared
                  token system is wired into Tailwind, and this page exercises
                  every imported primitive against the project theme.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-xl px-4">
                  <Bot className="h-4 w-4" />
                  Generate architecture
                </Button>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" className="rounded-xl px-4" />}>
                    Preview modal
                  </DialogTrigger>
                  <DialogContent className="max-w-xl rounded-3xl border border-surface-border bg-elevated">
                    <DialogHeader>
                      <DialogTitle>Design review checkpoint</DialogTitle>
                      <DialogDescription>
                        The dialog primitive inherits the dark workspace tokens,
                        elevated surface treatment, and focus ring colors.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl border border-surface-border bg-surface p-4 text-sm text-copy-secondary">
                      AI generation, collaboration overlays, and persisted specs
                      can share this modal pattern without introducing light
                      theme defaults.
                    </div>
                    <DialogFooter showCloseButton>
                      <Button className="rounded-xl px-4">Ship this pattern</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="rounded-2xl border border-surface-border bg-elevated/90 ring-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-copy-primary">
                  <Layers3 className="h-5 w-5 text-ai-text" />
                  Workspace surfaces
                </CardTitle>
                <CardDescription className="text-copy-muted">
                  Primitive styling now matches the floating, technical dark UI
                  described in the project context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-surface-border bg-surface p-4">
                    <div className="text-sm text-copy-muted">Base</div>
                    <div className="mt-2 h-16 rounded-2xl border border-surface-border bg-base" />
                  </div>
                  <div className="rounded-2xl border border-surface-border bg-surface p-4">
                    <div className="text-sm text-copy-muted">Accent</div>
                    <div className="mt-2 flex h-16 items-center justify-center rounded-2xl bg-accent-dim text-sm font-medium text-brand">
                      `bg-accent-dim`
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-surface-border bg-surface/80 text-copy-muted">
                Dark-only tokens are active at the root layout.
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-2xl border border-surface-border bg-surface/85 ring-0">
            <CardHeader>
              <CardTitle className="text-copy-primary">
                Input and messaging primitives
              </CardTitle>
              <CardDescription className="text-copy-muted">
                Buttons, inputs, textarea, and dialog actions use the shared
                cyan focus ring and border tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                className="rounded-xl border-surface-border bg-subtle/60 text-copy-primary placeholder:text-copy-muted"
                placeholder="Describe the system you want Ghost AI to generate"
              />
              <Textarea
                className="min-h-32 rounded-xl border-surface-border bg-subtle/60 text-copy-primary placeholder:text-copy-muted"
                placeholder="Example: Event-driven ecommerce platform with payments, notifications, analytics, and admin tooling."
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t border-surface-border bg-surface/80">
              <Button className="rounded-xl px-4">Run prompt</Button>
              <Button variant="secondary" className="rounded-xl px-4">
                Save draft
              </Button>
              <Button variant="ghost" className="rounded-xl px-4 text-copy-secondary">
                Reset
              </Button>
            </CardFooter>
          </Card>

          <Card className="rounded-2xl border border-surface-border bg-surface/85 ring-0">
            <CardHeader>
              <CardTitle className="text-copy-primary">
                Tabs and scroll area
              </CardTitle>
              <CardDescription className="text-copy-muted">
                The preview below verifies imported components render against
                the project token set without light defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="layers" className="gap-4">
                <TabsList className="rounded-xl bg-subtle p-1">
                  <TabsTrigger value="layers">Layers</TabsTrigger>
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                </TabsList>
                <TabsContent value="layers">
                  <ScrollArea className="h-56 rounded-2xl border border-surface-border bg-elevated/70 p-4">
                    <div className="space-y-3 pr-4">
                      {systemLayers.map((layer) => (
                        <div
                          key={layer}
                          className="rounded-2xl border border-surface-border bg-surface px-4 py-3 text-sm text-copy-secondary"
                        >
                          {layer}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="tokens">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-surface-border bg-elevated p-4">
                      <div className="text-sm text-copy-muted">Brand accent</div>
                      <div className="mt-2 text-lg font-medium text-brand">
                        `text-brand`
                      </div>
                    </div>
                    <div className="rounded-2xl border border-surface-border bg-elevated p-4">
                      <div className="text-sm text-copy-muted">AI accent</div>
                      <div className="mt-2 text-lg font-medium text-ai-text">
                        `text-ai-text`
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-surface-border bg-elevated/70 px-6 py-5">
          <div className="flex items-center gap-3 text-sm text-copy-secondary">
            <TerminalSquare className="h-4 w-4 text-brand" />
            `cn()` is available at `lib/utils.ts`, `lucide-react` is installed,
            and the required shadcn primitives now resolve in-app.
          </div>
        </section>
      </div>
    </main>
  );
}
