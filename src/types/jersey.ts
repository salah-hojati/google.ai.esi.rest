export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type MediaType = 
  | 'application/json' 
  | 'application/xml' 
  | 'text/plain' 
  | 'text/html' 
  | 'multipart/form-data' 
  | 'application/x-www-form-urlencoded' 
  | 'text/event-stream';

export interface ParamDefinition {
  type: 'path' | 'query' | 'header' | 'cookie' | 'matrix' | 'form' | 'bean' | 'context';
  name: string;
  javaType: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
}

export interface ResourceMethod {
  id: string;
  httpMethod: HttpMethod;
  subPath: string; // e.g. "" or "/{id}" or "/search"
  methodName: string;
  produces: MediaType[];
  consumes: MediaType[];
  params: ParamDefinition[];
  nameBindings?: string[]; // e.g. ["@Secured", "@Logged"]
  isAsync?: boolean;
  isSse?: boolean;
  description: string;
  handlerCode: string;
  returnType: string;
}

export interface ResourceClass {
  id: string;
  className: string;
  basePath: string; // e.g. "/products", "/users"
  description: string;
  nameBindings?: string[];
  methods: ResourceMethod[];
  javaSource: string;
}

export interface FilterDefinition {
  id: string;
  className: string;
  type: 'pre-matching-request' | 'post-matching-request' | 'response' | 'reader-interceptor' | 'writer-interceptor' | 'client-request' | 'client-response';
  priority: number;
  nameBindings?: string[]; // e.g. ["@Secured"]
  isGlobal: boolean;
  description: string;
  javaSource: string;
  enabled: boolean;
}

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  path: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  matrixParams?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: string;
  contentType?: string;
  accept?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  rawBodyText: string;
  contentType: string;
  executionTimeMs: number;
  logs: string[];
}

export interface PipelineStepTrace {
  step: 'PRE_MATCHING_FILTER' | 'RESOURCE_MATCHING' | 'POST_MATCHING_FILTER' | 'READER_INTERCEPTOR' | 'RESOURCE_EXECUTION' | 'WRITER_INTERCEPTOR' | 'RESPONSE_FILTER' | 'EXCEPTION_MAPPER' | 'CLIENT_RESPONSE';
  componentName: string;
  phase: string;
  description: string;
  status: 'passed' | 'aborted' | 'modified' | 'executed' | 'error';
  timestampMs: number;
  details?: Record<string, any>;
  logs: string[];
}

export interface ExecutionTrace {
  request: HttpRequest;
  response: HttpResponse;
  steps: PipelineStepTrace[];
  matchedResource?: {
    className: string;
    methodName: string;
    pathTemplate: string;
  };
  abortedAt?: string;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  category: 'Basics & Endpoints' | 'Parameters & Injection' | 'Filters & LifeCycle' | 'Interceptors & Streaming' | 'Jersey Client API' | 'Validation & Error Handling';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  learningObjectives: string[];
  conceptExplanation: string;
  requirements: string[];
  initialCode: string;
  solutionCode: string;
  hints: string[];
  testCases: {
    name: string;
    request: HttpRequest;
    expectedStatus: number;
    expectedHeaderCheck?: (headers: Record<string, string>) => boolean;
    expectedBodyCheck?: (body: any) => boolean;
    description?: string;
  }[];
}

export interface HandbookTopic {
  id: string;
  title: string;
  category: 'Core Endpoints' | 'Parameters & Context' | 'Filters & Interceptors' | 'Client API' | 'Exceptions & Validation' | 'Async & SSE' | 'Configuration & Deployment';
  summary: string;
  annotations: string[];
  codeExample: string;
  bestPractices: string[];
  pitfalls: string[];
  liveSandboxPath?: string;
}
