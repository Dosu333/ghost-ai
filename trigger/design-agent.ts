import { logger, task } from "@trigger.dev/sdk"

import {
  applyDesignPlan,
  createDesignPlan,
  loadRoomCanvasSnapshot,
  persistRoomCanvasSnapshot,
  publishDesignAgentStatus,
  setDesignAgentPresence,
} from "@/lib/design-agent-canvas"
import type {
  DesignAgentTaskPayload,
  DesignAgentTaskResult,
} from "@/lib/trigger/design-agent"

export const designAgentTask = task({
  id: "design-agent",
  run: async (
    payload: DesignAgentTaskPayload,
    { ctx }
  ): Promise<DesignAgentTaskResult> => {
    const runId = ctx.run.id

    await publishDesignAgentStatus({
      message: `Ghost AI started designing from: "${payload.prompt}"`,
      prompt: payload.prompt,
      roomId: payload.roomId,
      runId,
      status: "started",
    })
    await setDesignAgentPresence({
      cursor: { x: 0, y: 0 },
      roomId: payload.roomId,
      thinking: true,
      ttl: 120,
    })

    try {
      const currentSnapshot = await loadRoomCanvasSnapshot(payload.roomId)

      await publishDesignAgentStatus({
        message: "Ghost AI is reviewing the current canvas and planning updates.",
        roomId: payload.roomId,
        runId,
        status: "processing",
      })

      const plan = await createDesignPlan(payload.prompt, currentSnapshot)
      const appliedPlan = applyDesignPlan(currentSnapshot, plan)

      if (appliedPlan.appliedCount === 0) {
        throw new Error(
          "Ghost AI could not turn that prompt into valid canvas changes."
        )
      }

      await publishDesignAgentStatus({
        message: `Ghost AI is applying ${appliedPlan.appliedCount} canvas changes.`,
        roomId: payload.roomId,
        runId,
        status: "processing",
      })

      for (const operation of appliedPlan.operations) {
        if ("cursor" in operation) {
          await setDesignAgentPresence({
            cursor: operation.cursor,
            roomId: payload.roomId,
            thinking: true,
            ttl: 120,
          })
        }
      }

      await persistRoomCanvasSnapshot(payload.roomId, appliedPlan.snapshot)

      await publishDesignAgentStatus({
        message:
          plan.summary.trim().length > 0
            ? `Ghost AI finished: ${plan.summary.trim()}`
            : `Ghost AI applied ${appliedPlan.appliedCount} design updates.`,
        roomId: payload.roomId,
        runId,
        status: "complete",
      })

      return {
        echoedPrompt: payload.prompt,
        roomId: payload.roomId,
        startedAt: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Design agent task failed.", {
        error,
        roomId: payload.roomId,
        runId,
      })

      await publishDesignAgentStatus({
        message:
          error instanceof Error
            ? error.message
            : "Ghost AI could not complete the design update.",
        roomId: payload.roomId,
        runId,
        status: "error",
      }).catch(() => {})

      throw error
    } finally {
      await setDesignAgentPresence({
        cursor: null,
        roomId: payload.roomId,
        thinking: false,
        ttl: 2,
      }).catch(() => {})
    }
  },
})
