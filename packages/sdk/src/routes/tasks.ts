import { axiosEventSource } from 'axios-eventsource';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { projectParamsSchema } from '../lib/schemas.js';

const taskRunStatusSchema = z.enum(['RUNNING', 'SUCCESS', 'FAILED']);

export const taskSchema = z.object({
  id: z.number().int().describe('The ID of the task'),
  taskType: z.string().describe('The type of the task'),
  runner: z.string().describe('The runner that executes the task'),
  parameters: z.string().nullable().describe('JSON string of task parameters'),
  createdAt: z.iso.datetime().describe('When the task was created'),
  name: z.string().describe('Human-readable task name'),
  targetUrl: z.string().nullable().describe('Optional target URL'),
  orgName: z.string().nullable().describe('Org name (owner of task or project)'),
  projectName: z.string().nullable().describe('Project name if task is project-scoped'),
  assetName: z.string().nullable().optional().describe('Asset name if task is asset-scoped'),
  createdByName: z.string().describe('Display name of user who created the task'),
  latestRunStatus: taskRunStatusSchema.nullable().describe('Latest run status'),
  latestRunDuration: z.number().nullable().describe('Latest run duration in seconds'),
});

export type Task = z.infer<typeof taskSchema>;

export const taskWithStatusAndResultsSchema = taskSchema.extend({
  latestRunResults: z.unknown().nullable().describe('Latest run results payload'),
});

export type TaskWithStatusAndResults = z.infer<typeof taskWithStatusAndResultsSchema>;

export const getTaskParamsSchema = projectParamsSchema.extend({
  taskId: z.coerce.number().int().positive().describe('The task ID'),
});
export type GetTaskParams = z.infer<typeof getTaskParamsSchema>;

export const getTaskResultSchema = taskWithStatusAndResultsSchema;
export type GetTaskResult = z.infer<typeof getTaskResultSchema>;

export const listTasksSortFields = ['createdAt', 'taskType', 'runner', 'latestRunStatus'] as const;
export const listTaskSortFields = listTasksSortFields;
export const listTaskDefaultSort: SortingFromFields<typeof listTasksSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};
export type ListTaskSortField = (typeof listTasksSortFields)[number];

export const listTasksQuerySchema = paginationOptionalSchema.merge(createSortingOptionalSchema(listTasksSortFields));
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export const listTasksResultSchema = listResultSchema(taskSchema);
export type ListTasksResult = z.infer<typeof listTasksResultSchema>;
export type ListTasksProps = {
  params: z.infer<typeof projectParamsSchema>;
  query?: ListTasksQuery;
};

/** List tasks belonging to a project, with pagination and sorting. */
export const listTasks = async (client: ApiClient, props: ListTasksProps): Promise<ListTasksResult> => {
  const params = projectParamsSchema.parse(props.params);
  const query = listTasksQuerySchema.parse(props.query ?? {});
  const path = buildPath('/tasks/$orgName/$projectName', params);
  const response = await client.axios.get(path, { params: query });
  return parseResult(client, listTasksResultSchema, response.data);
};

export const resubmitTaskParamsSchema = getTaskParamsSchema;
export type ResubmitTaskParams = z.infer<typeof resubmitTaskParamsSchema>;
export const resubmitTaskResultSchema = z.strictObject({ success: z.literal(true) });
export type ResubmitTaskResult = z.infer<typeof resubmitTaskResultSchema>;
export type ResubmitTaskProps = { params: ResubmitTaskParams };

/** Re-queue a task belonging to a project for execution. */
export const resubmitTask = async (client: ApiClient, props: ResubmitTaskProps): Promise<ResubmitTaskResult> => {
  const params = resubmitTaskParamsSchema.parse(props.params);
  const path = buildPath('/tasks/$orgName/$projectName/$taskId/resubmit', params);
  const response = await client.axios.post(path, {}, { headers: { 'Content-Type': 'application/json' } });
  return parseResult(client, resubmitTaskResultSchema, response.data);
};

export const taskEventRunSchema = z.object({
  taskRunId: z.number().int(),
  taskId: z.number().int(),
  status: z.enum(['RUNNING', 'SUCCESS', 'FAILED']),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  duration: z.number().nullable(),
  workerName: z.string(),
  results: z.unknown().nullable().optional(),
  errors: z.string().nullable().optional(),
});

export type TaskEventRun = z.infer<typeof taskEventRunSchema>;

export const taskEventQueuedDataSchema = z.object({
  taskId: z.number().int(),
});

export const taskEventRunningDataSchema = z.object({
  taskId: z.number().int(),
  run: taskEventRunSchema,
});

export const taskEventSuccessDataSchema = z.object({
  taskId: z.number().int(),
  run: taskEventRunSchema,
});

export const taskEventFailureDataSchema = z.object({
  taskId: z.number().int(),
  run: taskEventRunSchema,
});

export const taskEventDataSchemas = {
  'task.queued': taskEventQueuedDataSchema,
  'task.running': taskEventRunningDataSchema,
  'task.success': taskEventSuccessDataSchema,
  'task.failure': taskEventFailureDataSchema,
} as const;

export type TaskEventType = keyof typeof taskEventDataSchemas;

export const taskEventTypeSchema = z.enum(Object.keys(taskEventDataSchemas) as [TaskEventType, ...TaskEventType[]]);

export type TaskEvent = {
  [K in TaskEventType]: {
    sequence: number;
    type: K;
    data: z.infer<(typeof taskEventDataSchemas)[K]>;
  };
}[TaskEventType];

export const taskEventSchema = z.discriminatedUnion(
  'type',
  (Object.keys(taskEventDataSchemas) as TaskEventType[]).map((type) =>
    z.object({
      sequence: z.number().int().positive(),
      type: z.literal(type),
      data: taskEventDataSchemas[type],
    }),
  ) as unknown as [z.ZodObject<z.ZodRawShape>, ...z.ZodObject<z.ZodRawShape>[]],
);

export const getTaskEventsQuerySchema = z.object({
  sinceSequence: z.coerce.number().int().nonnegative().optional(),
});
export type GetTaskEventsQuery = z.infer<typeof getTaskEventsQuerySchema>;

export type GetTaskProps = {
  params: GetTaskParams;
};

export const getTask = async (client: ApiClient, props: GetTaskProps): Promise<GetTaskResult> => {
  const params = getTaskParamsSchema.parse(props.params);
  const path = buildPath('/tasks/$orgName/$projectName/$taskId', params);
  const response = await client.axios.get(path);
  return parseResult(client, taskWithStatusAndResultsSchema, response.data);
};

const TASK_EVENTS_PATH = '/tasks/$orgName/$projectName/$taskId/events';

export type SubscribeToTaskEventsProps = {
  params: { orgName: string; projectName: string; taskId: number };
  query?: GetTaskEventsQuery;
};

export type TaskEventsSubscription = {
  addEventListener<K extends TaskEventType>(
    type: K,
    handler: (data: Extract<TaskEvent, { type: K }>['data']) => void,
  ): void;
  close(): void;
};

type TaskEventHandlersMap = Partial<Record<TaskEventType, (data: unknown) => void>>;

export function subscribeToTaskEvents(client: ApiClient, props: SubscribeToTaskEventsProps): TaskEventsSubscription {
  const path = buildPath(TASK_EVENTS_PATH, props.params);
  const qs = new URLSearchParams();
  if (props.query?.sinceSequence != null) {
    qs.set('sinceSequence', String(props.query.sinceSequence));
  }
  const pathWithQuery = qs.size > 0 ? `${path}?${qs.toString()}` : path;
  const handlers: TaskEventHandlersMap = {};

  const stream = axiosEventSource(client.axios, pathWithQuery, {
    reconnect: { initialDelayMs: 1000, maxDelayMs: 30_000 },
  });
  const debugTaskEvents = process.env.DEBUG_TASK_EVENTS === '1' || process.env.DEBUG_TASK_EVENTS === 'true';
  if (debugTaskEvents) {
    console.log('[task-events] subscribe', {
      path: pathWithQuery,
      taskId: props.params.taskId,
      sinceSequence: props.query?.sinceSequence ?? null,
    });
  }

  for (const type of Object.keys(taskEventDataSchemas) as TaskEventType[]) {
    stream.addEventListener(type, (evt: unknown) => {
      const event = evt as { data?: unknown };
      const rawData = event?.data;
      if (typeof rawData !== 'string') {
        throw new Error(`Invalid task event payload for "${type}": expected string SSE data`);
      }
      const data = JSON.parse(rawData);
      const parsed = taskEventSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(`Invalid task event payload for "${type}": ${parsed.error.message}`);
      }
      const key = parsed.data.type as keyof TaskEventHandlersMap;
      const handler = handlers[key];
      if (debugTaskEvents) {
        console.log('[task-events] event', {
          taskId: props.params.taskId,
          type: parsed.data.type,
          sequence: parsed.data.sequence,
        });
      }
      if (handler) {
        handler(parsed.data.data);
      }
    });
  }

  return {
    addEventListener<K extends TaskEventType>(type: K, handler: (data: unknown) => void): void {
      handlers[type] = handler;
    },
    close(): void {
      stream.close();
    },
  } as TaskEventsSubscription;
}

export type WaitForTaskCompletionProps = {
  params: { orgName: string; projectName: string; taskId: number };
  timeoutMs?: number;
};

export function waitForTaskCompletion(
  client: ApiClient,
  props: WaitForTaskCompletionProps,
): Promise<Extract<TaskEvent, { type: 'task.success' }>['data']> {
  const { params, timeoutMs } = props;
  const debugTaskEvents = process.env.DEBUG_TASK_EVENTS === '1' || process.env.DEBUG_TASK_EVENTS === 'true';
  return new Promise((resolve, reject) => {
    if (debugTaskEvents) {
      console.log('[task-events] waitForTaskCompletion start', { taskId: params.taskId, timeoutMs: timeoutMs ?? null });
    }
    const sub = subscribeToTaskEvents(client, { params, query: { sinceSequence: 0 } });
    let settled = false;

    if (timeoutMs != null && timeoutMs > 0) {
      const t = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        sub.close();
        if (debugTaskEvents) {
          console.log('[task-events] waitForTaskCompletion timeout', { taskId: params.taskId, timeoutMs });
        }
        reject(new Error(`Task ${params.taskId} did not complete within ${timeoutMs}ms`));
      }, timeoutMs);
      const origClose = sub.close.bind(sub);
      sub.close = () => {
        clearTimeout(t);
        origClose();
      };
    }

    sub.addEventListener('task.success', (data) => {
      if (settled) {
        return;
      }
      settled = true;
      sub.close();
      if (debugTaskEvents) {
        console.log('[task-events] waitForTaskCompletion success', { taskId: params.taskId });
      }
      resolve(data);
    });
    sub.addEventListener('task.failure', (data) => {
      if (settled) {
        return;
      }
      settled = true;
      sub.close();
      if (debugTaskEvents) {
        console.log('[task-events] waitForTaskCompletion failure', {
          taskId: params.taskId,
          error: data.run?.errors ?? null,
        });
      }
      const run = data.run;
      const err = new Error(run?.errors ?? 'Task failed') as Error & { run?: typeof run };
      err.run = run;
      reject(err);
    });
  });
}
