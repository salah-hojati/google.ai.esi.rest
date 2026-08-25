import {
  HttpRequest,
  HttpResponse,
  ExecutionTrace,
  PipelineStepTrace,
  ResourceClass,
  FilterDefinition
} from '../types/jersey';
import { INITIAL_PRODUCTS, INITIAL_USERS } from '../data/sampleResources';

// In-memory simulated database state for realistic REST CRUD operations
let productsDb = [...INITIAL_PRODUCTS];
let usersDb = [...INITIAL_USERS];
let nextProductId = 7;
let nextUserId = 104;

export function resetDatabaseState() {
  productsDb = [...INITIAL_PRODUCTS];
  usersDb = [...INITIAL_USERS];
  nextProductId = 7;
  nextUserId = 104;
}

export function executeJerseyPipeline(
  request: HttpRequest,
  resources: ResourceClass[],
  filters: FilterDefinition[]
): ExecutionTrace {
  const startTime = performance.now();
  const steps: PipelineStepTrace[] = [];
  const reqCopy: HttpRequest = JSON.parse(JSON.stringify(request));

  let currentPath = reqCopy.path;
  let currentUri = reqCopy.url || `http://localhost:8080${currentPath}`;
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Server': 'Jersey/3.1.5 (Jakarta REST)',
  };

  // Step 1: Pre-Matching Request Filters
  const preMatchingFilters = filters
    .filter(f => f.enabled && f.type === 'pre-matching-request')
    .sort((a, b) => a.priority - b.priority);

  for (const filter of preMatchingFilters) {
    const filterStart = performance.now();
    const logs: string[] = [`Executing Pre-Matching filter: ${filter.className} [Priority: ${filter.priority}]`];

    // Simulation logic for ApiVersionPreMatchingFilter
    if (filter.className === 'ApiVersionPreMatchingFilter' && currentPath.startsWith('/v1/items')) {
      const oldPath = currentPath;
      currentPath = currentPath.replace(/^\/v1\/items/, '/api/products');
      currentUri = currentUri.replace('/v1/items', '/api/products');
      reqCopy.path = currentPath;
      logs.push(`Rewrote URI path from '${oldPath}' to '${currentPath}'`);
    }

    steps.push({
      step: 'PRE_MATCHING_FILTER',
      componentName: filter.className,
      phase: 'Pre-Matching',
      description: `ContainerRequestFilter before resource routing. Path: ${currentPath}`,
      status: 'passed',
      timestampMs: Math.round(performance.now() - filterStart),
      logs
    });
  }

  // Step 2: Resource Matching
  const matchStart = performance.now();
  let matchedResource: ResourceClass | null = null;
  let matchedMethod: any = null;
  let pathParams: Record<string, string> = {};

  for (const res of resources) {
    const resBase = res.basePath.replace(/\/$/, '');
    
    for (const method of res.methods) {
      if (method.httpMethod !== reqCopy.method) continue;

      const fullTemplate = `${resBase}${method.subPath}`.replace(/\/$/, '') || '/';
      const regexPattern = fullTemplate
        .replace(/\{([a-zA-Z0-9_]+)\}/g, '(?<$1>[^/]+)')
        .replace(/\//g, '\\/');
      
      const regex = new RegExp(`^${regexPattern}$`);
      const normalizedPath = currentPath.replace(/\/$/, '') || '/';
      const match = normalizedPath.match(regex);

      if (match) {
        matchedResource = res;
        matchedMethod = method;
        if (match.groups) {
          pathParams = { ...match.groups };
        }
        break;
      }
    }
    if (matchedResource) break;
  }

  if (!matchedResource || !matchedMethod) {
    // 404 Not Found
    steps.push({
      step: 'RESOURCE_MATCHING',
      componentName: 'Jersey Routing Router',
      phase: 'Routing',
      description: `Failed to match ${reqCopy.method} ${currentPath} to any JAX-RS @Path endpoint`,
      status: 'error',
      timestampMs: Math.round(performance.now() - matchStart),
      logs: [
        `No @Path matching "${currentPath}" with HTTP Method @${reqCopy.method}`,
        `Available Base Paths: ${resources.map(r => r.basePath).join(', ')}`
      ]
    });

    const errorBody = {
      status: 404,
      error: 'Not Found',
      message: `HTTP 404: No resource method found matching ${reqCopy.method} ${currentPath}`,
      timestamp: new Date().toISOString(),
      path: currentPath
    };

    return {
      request: reqCopy,
      response: {
        status: 404,
        statusText: 'Not Found',
        headers: responseHeaders,
        body: errorBody,
        rawBodyText: JSON.stringify(errorBody, null, 2),
        contentType: 'application/json',
        executionTimeMs: Math.round(performance.now() - startTime),
        logs: ['Resource matching returned 404 Not Found']
      },
      steps,
      abortedAt: 'Resource Matching'
    };
  }

  steps.push({
    step: 'RESOURCE_MATCHING',
    componentName: `${matchedResource.className}#${matchedMethod.methodName}`,
    phase: 'Routing',
    description: `Matched @Path("${matchedResource.basePath}${matchedMethod.subPath}") -> @${matchedMethod.httpMethod} ${matchedResource.className}.${matchedMethod.methodName}()`,
    status: 'passed',
    timestampMs: Math.round(performance.now() - matchStart),
    details: {
      resourceClass: matchedResource.className,
      methodName: matchedMethod.methodName,
      pathParams
    },
    logs: [
      `Matched method: ${matchedResource.className}.${matchedMethod.methodName}`,
      `Extracted PathParams: ${JSON.stringify(pathParams)}`,
      `Produces: ${matchedMethod.produces.join(', ') || 'N/A'}`
    ]
  });

  // Step 3: Post-Matching Request Filters
  const resourceBindings = new Set([
    ...(matchedResource.nameBindings || []),
    ...(matchedMethod.nameBindings || [])
  ]);

  const postMatchingFilters = filters
    .filter(f => f.enabled && f.type === 'post-matching-request')
    .filter(f => {
      if (f.isGlobal) return true;
      if (f.nameBindings && f.nameBindings.some(nb => resourceBindings.has(nb))) return true;
      return false;
    })
    .sort((a, b) => a.priority - b.priority);

  for (const filter of postMatchingFilters) {
    const filterStart = performance.now();
    const logs: string[] = [`Executing Post-Matching filter: ${filter.className} (Priority: ${filter.priority})`];

    // Check Security Filter logic
    if (filter.className === 'SecurityAuthFilter') {
      const authHeader = reqCopy.headers['Authorization'] || reqCopy.headers['authorization'];
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logs.push(`Authentication failed: Missing or invalid 'Authorization: Bearer <token>' header`);
        steps.push({
          step: 'POST_MATCHING_FILTER',
          componentName: filter.className,
          phase: 'Security / Authentication',
          description: `ContainerRequestContext aborted with 401 Unauthorized (Missing Bearer Token)`,
          status: 'aborted',
          timestampMs: Math.round(performance.now() - filterStart),
          logs
        });

        const errorBody = {
          status: 401,
          error: 'Unauthorized',
          message: 'Full authentication is required to access this @Secured JAX-RS resource.',
          hint: 'Include header Authorization: Bearer secret-token-123 in your request headers.'
        };

        responseHeaders['WWW-Authenticate'] = 'Bearer realm="JerseyPractice"';

        return {
          request: reqCopy,
          response: {
            status: 401,
            statusText: 'Unauthorized',
            headers: responseHeaders,
            body: errorBody,
            rawBodyText: JSON.stringify(errorBody, null, 2),
            contentType: 'application/json',
            executionTimeMs: Math.round(performance.now() - startTime),
            logs: ['Request aborted by SecurityAuthFilter']
          },
          steps,
          matchedResource: {
            className: matchedResource.className,
            methodName: matchedMethod.methodName,
            pathTemplate: matchedResource.basePath + matchedMethod.subPath
          },
          abortedAt: filter.className
        };
      } else {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        logs.push(`Authenticated user principal from Bearer token: "${token.substring(0, 8)}..."`);
      }
    }

    steps.push({
      step: 'POST_MATCHING_FILTER',
      componentName: filter.className,
      phase: 'Request Interception',
      description: `ContainerRequestFilter executed successfully`,
      status: 'passed',
      timestampMs: Math.round(performance.now() - filterStart),
      logs
    });
  }

  // Step 4: Reader Interceptors (if request body exists)
  if (reqCopy.body && (reqCopy.method === 'POST' || reqCopy.method === 'PUT' || reqCopy.method === 'PATCH')) {
    const readerInterceptors = filters
      .filter(f => f.enabled && f.type === 'reader-interceptor')
      .sort((a, b) => a.priority - b.priority);

    for (const interceptor of readerInterceptors) {
      const start = performance.now();
      const logs: string[] = [`ReaderInterceptor: ${interceptor.className}.aroundReadFrom(context)`];

      if (interceptor.className === 'DecryptionReaderInterceptor') {
        if (reqCopy.headers['X-Encrypted'] === 'true') {
          logs.push(`Decrypted incoming payload stream before Jackson JSON deserialization`);
        } else {
          logs.push(`Stream passed through context.proceed() without modification`);
        }
      }

      steps.push({
        step: 'READER_INTERCEPTOR',
        componentName: interceptor.className,
        phase: 'Entity Deserialization',
        description: `ReaderInterceptor processed incoming request InputStream`,
        status: 'passed',
        timestampMs: Math.round(performance.now() - start),
        logs
      });
    }
  }

  // Step 5: Resource Method Execution
  const execStart = performance.now();
  let status = 200;
  let statusText = 'OK';
  let responseBody: any = null;
  const execLogs: string[] = [];

  try {
    let parsedBody: any = null;
    if (reqCopy.body) {
      try {
        parsedBody = JSON.parse(reqCopy.body);
      } catch {
        parsedBody = reqCopy.body;
      }
    }

    // Dynamic routing execution logic
    if (matchedResource.id === 'product-resource') {
      if (matchedMethod.id === 'get-all-products') {
        const category = reqCopy.queryParams['category'];
        const minPrice = parseFloat(reqCopy.queryParams['minPrice'] || '0');
        const page = parseInt(reqCopy.queryParams['page'] || '1', 10);
        const limit = parseInt(reqCopy.queryParams['limit'] || '10', 10);

        let filtered = productsDb.filter(p => {
          if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
          if (p.price < minPrice) return false;
          return true;
        });

        const totalCount = filtered.length;
        const offset = (page - 1) * limit;
        filtered = filtered.slice(offset, offset + limit);

        responseHeaders['X-Total-Count'] = totalCount.toString();
        responseHeaders['Cache-Control'] = 'public, max-age=300';
        responseBody = filtered;
        execLogs.push(`Executed ProductResource.getAllProducts(category="${category || '*'}", minPrice=${minPrice}, page=${page}) -> returned ${filtered.length} items`);
      } else if (matchedMethod.id === 'get-product-by-id') {
        const id = parseInt(pathParams['id'], 10);
        const product = productsDb.find(p => p.id === id);

        if (!product) {
          throw new Error(`Product not found with id: ${id}`);
        }
        responseBody = product;
        execLogs.push(`Found product with ID ${id}: "${product.name}"`);
      } else if (matchedMethod.id === 'create-product') {
        const newProduct = {
          id: nextProductId++,
          name: parsedBody?.name || 'New Jersey Product',
          category: parsedBody?.category || 'general',
          price: Number(parsedBody?.price) || 99.99,
          stock: Number(parsedBody?.stock) || 10,
          rating: 5.0
        };
        productsDb.push(newProduct);
        status = 201;
        statusText = 'Created';
        responseHeaders['Location'] = `${matchedResource.basePath}/${newProduct.id}`;
        responseBody = newProduct;
        execLogs.push(`Created new product ID ${newProduct.id}, set Location header`);
      } else if (matchedMethod.id === 'update-product') {
        const id = parseInt(pathParams['id'], 10);
        const index = productsDb.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error(`Cannot update: Product ${id} not found`);
        }
        productsDb[index] = { ...productsDb[index], ...parsedBody, id };
        responseBody = productsDb[index];
        execLogs.push(`Updated product ID ${id}`);
      } else if (matchedMethod.id === 'delete-product') {
        const id = parseInt(pathParams['id'], 10);
        const initialLen = productsDb.length;
        productsDb = productsDb.filter(p => p.id !== id);
        if (productsDb.length === initialLen) {
          throw new Error(`Cannot delete: Product ${id} not found`);
        }
        status = 204;
        statusText = 'No Content';
        responseBody = null;
        execLogs.push(`Deleted product ID ${id} -> 204 No Content`);
      }
    } else if (matchedResource.id === 'user-resource') {
      if (matchedMethod.id === 'get-users') {
        responseBody = usersDb;
        execLogs.push(`Retrieved ${usersDb.length} users`);
      } else if (matchedMethod.id === 'get-user-by-id') {
        const userId = parseInt(pathParams['userId'], 10);
        const user = usersDb.find(u => u.id === userId);
        if (!user) throw new Error(`User not found: ${userId}`);
        responseBody = user;
      } else if (matchedMethod.id === 'register-user') {
        if (!parsedBody?.email || !parsedBody?.username) {
          status = 400;
          statusText = 'Bad Request';
          responseBody = {
            error: 'ConstraintViolationException',
            violations: [
              { field: 'username', message: 'must not be blank' },
              { field: 'email', message: 'must be a valid email format' }
            ]
          };
          execLogs.push(`Bean validation failed for UserRegistrationDto`);
        } else {
          const newUser = {
            id: nextUserId++,
            username: parsedBody.username,
            email: parsedBody.email,
            role: parsedBody.role || 'USER',
            active: true,
            createdAt: new Date().toISOString().split('T')[0]
          };
          usersDb.push(newUser);
          status = 201;
          statusText = 'Created';
          responseBody = newUser;
          execLogs.push(`Registered new user ID ${newUser.id}`);
        }
      }
    } else if (matchedResource.id === 'stream-resource') {
      if (matchedMethod.id === 'get-events-sse') {
        status = 200;
        responseHeaders['Content-Type'] = 'text/event-stream';
        responseBody = `event: telemetry\ndata: {"cpu": 28.4, "memory": 62.1, "activeSessions": 142, "timestamp": "${new Date().toISOString()}"}\n\n`;
        execLogs.push(`Sent SSE OutboundSseEvent through SseEventSink`);
      } else {
        responseBody = { result: 'Async task resolved via @Suspended AsyncResponse' };
        execLogs.push(`AsyncResponse.resume() called successfully`);
      }
    } else {
      // Generic mock response
      responseBody = { message: `Executed ${matchedResource.className}.${matchedMethod.methodName}()`, pathParams };
    }

    steps.push({
      step: 'RESOURCE_EXECUTION',
      componentName: `${matchedResource.className}.${matchedMethod.methodName}`,
      phase: 'Business Logic Execution',
      description: `Method executed successfully returning HTTP ${status} ${statusText}`,
      status: 'executed',
      timestampMs: Math.round(performance.now() - execStart),
      logs: execLogs
    });
  } catch (err: any) {
    // Exception mapping
    status = 404;
    statusText = 'Not Found';
    responseBody = {
      status: 404,
      error: 'EntityNotFoundException',
      message: err.message || 'Entity not found',
      timestamp: new Date().toISOString()
    };
    steps.push({
      step: 'EXCEPTION_MAPPER',
      componentName: 'EntityNotFoundExceptionMapper',
      phase: 'Exception Handling',
      description: `Mapped ${err.name || 'Exception'} to HTTP 404 via @Provider ExceptionMapper<T>`,
      status: 'modified',
      timestampMs: Math.round(performance.now() - execStart),
      logs: [`Caught ${err.message}`, `ExceptionMapper generated RFC 7807 JSON error body`]
    });
  }

  // Step 6: Writer Interceptors (if response entity exists)
  if (responseBody !== null && responseBody !== undefined) {
    const writerInterceptors = filters
      .filter(f => f.enabled && f.type === 'writer-interceptor')
      .sort((a, b) => a.priority - b.priority);

    for (const interceptor of writerInterceptors) {
      const start = performance.now();
      const logs: string[] = [`WriterInterceptor: ${interceptor.className}.aroundWriteTo(context)`];
      responseHeaders['X-Intercepted-By'] = interceptor.className;
      logs.push(`Injected X-Intercepted-By header during stream serialization`);

      steps.push({
        step: 'WRITER_INTERCEPTOR',
        componentName: interceptor.className,
        phase: 'Entity Serialization',
        description: `WriterInterceptor intercepted outgoing MessageBodyWriter OutputStream`,
        status: 'passed',
        timestampMs: Math.round(performance.now() - start),
        logs
      });
    }
  }

  // Step 7: Response Filters
  const responseFilters = filters
    .filter(f => f.enabled && f.type === 'response')
    .sort((a, b) => a.priority - b.priority);

  for (const filter of responseFilters) {
    const filterStart = performance.now();
    const logs: string[] = [`Executing ContainerResponseFilter: ${filter.className} [Priority: ${filter.priority}]`];

    if (filter.className === 'CorsResponseFilter') {
      responseHeaders['Access-Control-Allow-Origin'] = '*';
      responseHeaders['Access-Control-Allow-Headers'] = 'origin, content-type, accept, authorization';
      responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH';
      logs.push(`Added CORS headers (Access-Control-Allow-Origin: *)`);
    } else if (filter.className === 'AuditLoggingResponseFilter') {
      const traceId = `trc-${Math.random().toString(36).substring(2, 9)}`;
      responseHeaders['X-Trace-Id'] = traceId;
      responseHeaders['X-Response-Time-Ms'] = `${Math.round(performance.now() - startTime)}ms`;
      logs.push(`Injected X-Trace-Id: ${traceId}`);
    }

    steps.push({
      step: 'RESPONSE_FILTER',
      componentName: filter.className,
      phase: 'Response Decoration',
      description: `ContainerResponseFilter decorated outgoing ResponseContext headers`,
      status: 'passed',
      timestampMs: Math.round(performance.now() - filterStart),
      logs
    });
  }

  const totalTime = Math.round(performance.now() - startTime);

  return {
    request: reqCopy,
    response: {
      status,
      statusText,
      headers: responseHeaders,
      body: responseBody,
      rawBodyText: responseBody ? (typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)) : '',
      contentType: responseHeaders['Content-Type'] || 'application/json',
      executionTimeMs: totalTime,
      logs: [`Pipeline completed in ${totalTime}ms with HTTP ${status} ${statusText}`]
    },
    steps,
    matchedResource: {
      className: matchedResource.className,
      methodName: matchedMethod.methodName,
      pathTemplate: matchedResource.basePath + matchedMethod.subPath
    }
  };
}
