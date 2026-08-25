import { HandbookTopic } from '../types/jersey';

export const HANDBOOK_TOPICS: HandbookTopic[] = [
  {
    id: 'topic-endpoints-routing',
    title: '1. RESTful Resources & HTTP Verbs',
    category: 'Core Endpoints',
    summary: 'How Jersey maps HTTP requests to Java POJO resource classes and methods using @Path, @GET, @POST, @PUT, @DELETE, and @PATCH.',
    annotations: ['@Path', '@GET', '@POST', '@PUT', '@DELETE', '@PATCH', '@HEAD', '@OPTIONS', '@Produces', '@Consumes'],
    codeExample: `@Path("/api/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrderResource {

    @GET
    public List<Order> getAllOrders() {
        return orderService.findAll();
    }

    @GET
    @Path("/{id}")
    public Response getOrder(@PathParam("id") Long id) {
        Order order = orderService.findById(id);
        if (order == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(order).build();
    }

    @POST
    public Response createOrder(OrderDto dto, @Context UriInfo uriInfo) {
        Order created = orderService.create(dto);
        URI location = uriInfo.getAbsolutePathBuilder()
                              .path(created.getId().toString())
                              .build();
        return Response.created(location).entity(created).build();
    }
}`,
    bestPractices: [
      'Use nouns for resource paths (e.g. /orders, not /getOrders).',
      'Return 201 Created with a Location header for successful POST creations.',
      'Always specify @Produces and @Consumes to enable strict content negotiation.',
      'Use sub-resource locators for hierarchical relationships (e.g. /users/{id}/orders).'
    ],
    pitfalls: [
      'Do not perform state modifications in @GET or @HEAD handlers.',
      'Avoid hardcoding domain URLs; use UriInfo.getAbsolutePathBuilder().',
      'Forgetting @Consumes causes 415 Unsupported Media Type errors on incoming JSON.'
    ],
    liveSandboxPath: '/api/products'
  },
  {
    id: 'topic-param-injection',
    title: '2. Parameter Binding & @BeanParam',
    category: 'Parameters & Context',
    summary: 'Injecting dynamic URI segments, query parameters, matrix parameters, headers, cookies, and grouping them in reusable @BeanParam POJOs.',
    annotations: ['@PathParam', '@QueryParam', '@MatrixParam', '@HeaderParam', '@CookieParam', '@FormParam', '@BeanParam', '@DefaultValue'],
    codeExample: `// 1. Grouping parameters into a BeanParam class
public class PaginationFilterBean {
    @QueryParam("page")
    @DefaultValue("1")
    private int page;

    @QueryParam("size")
    @DefaultValue("20")
    private int size;

    @HeaderParam("X-Tenant-ID")
    private String tenantId;

    // Getters and setters
}

// 2. Injecting in Resource
@GET
@Path("/search")
public Response search(@BeanParam PaginationFilterBean filter,
                       @MatrixParam("detail") boolean detailed,
                       @CookieParam("sessionId") String session) {
    return Response.ok(service.query(filter)).build();
}`,
    bestPractices: [
      'Use @BeanParam to keep resource method signatures clean and reusable.',
      'Always provide @DefaultValue for numerical query parameters to prevent NullPointerExceptions.',
      'Use @MatrixParam for hierarchical resource filtering attributes.'
    ],
    pitfalls: [
      'Primitives like int without @DefaultValue will default to 0 if omitted, not null.',
      '@FormParam requires @Consumes(MediaType.APPLICATION_FORM_URLENCODED).'
    ],
    liveSandboxPath: '/api/products'
  },
  {
    id: 'topic-filters-pipeline',
    title: '3. Filters Lifecycle & @PreMatching',
    category: 'Filters & Interceptors',
    summary: 'Understanding the complete JAX-RS filter lifecycle: Pre-Matching Request Filters, Post-Matching Request Filters, Priorities, and ContainerResponseFilters.',
    annotations: ['@Provider', '@PreMatching', '@Priority', 'ContainerRequestFilter', 'ContainerResponseFilter', 'abortWith()'],
    codeExample: `// Pre-Matching filter runs BEFORE @Path routing
@Provider
@PreMatching
@Priority(Priorities.HEADER_DECORATOR)
public class HttpMethodOverrideFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext ctx) throws IOException {
        String override = ctx.getHeaderString("X-HTTP-Method-Override");
        if (override != null) {
            ctx.setMethod(override);
        }
    }
}

// Post-Matching Security Filter
@Secured
@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext ctx) throws IOException {
        String token = ctx.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (token == null) {
            ctx.abortWith(Response.status(401).entity("Unauthorized").build());
        }
    }
}`,
    bestPractices: [
      'Use @Priority with standard Priorities enum constants to guarantee filter ordering.',
      'Use @PreMatching only when modifying routing, request URI, or HTTP method.',
      'Always call requestContext.abortWith(response) to exit early without hitting downstream filters.'
    ],
    pitfalls: [
      'Post-matching filters cannot modify the request URI to re-route to another resource method.',
      'Forgetting @Provider will prevent automatic discovery by Jersey scanning.'
    ],
    liveSandboxPath: '/api/products'
  },
  {
    id: 'topic-namebinding-dynamicfeature',
    title: '4. @NameBinding & DynamicFeature',
    category: 'Filters & Interceptors',
    summary: 'Selective filter binding using custom annotations (@NameBinding) or programmatic registration via DynamicFeature.',
    annotations: ['@NameBinding', 'DynamicFeature', 'ResourceInfo', 'FeatureContext'],
    codeExample: `// 1. Declare Custom NameBinding annotation
@NameBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface RequireAdminRole {}

// 2. Bind filter to annotation
@RequireAdminRole
@Provider
public class AdminRoleFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext ctx) {
        if (!ctx.getSecurityContext().isUserInRole("ADMIN")) {
            ctx.abortWith(Response.status(Response.Status.FORBIDDEN).build());
        }
    }
}

// 3. Programmatic DynamicFeature registration
@Provider
public class LoggingDynamicFeature implements DynamicFeature {
    @Override
    public void configure(ResourceInfo resourceInfo, FeatureContext context) {
        if (resourceInfo.getResourceMethod().isAnnotationPresent(AuditLogged.class)) {
            context.register(AuditLoggingFilter.class);
        }
    }
}`,
    bestPractices: [
      'Use @NameBinding for static declarative filter attachment.',
      'Use DynamicFeature when filter registration depends on return types, complex method signatures, or dynamic configuration.'
    ],
    pitfalls: [
      'Missing @Retention(RetentionPolicy.RUNTIME) causes the annotation to be discarded at compilation.'
    ]
  },
  {
    id: 'topic-interceptors-streaming',
    title: '5. ReaderInterceptor & WriterInterceptor',
    category: 'Filters & Interceptors',
    summary: 'Wrapping and transforming raw entity streams during serialization and deserialization (e.g. GZIP compression, payload encryption).',
    annotations: ['ReaderInterceptor', 'WriterInterceptor', 'ReaderInterceptorContext', 'WriterInterceptorContext', 'context.proceed()'],
    codeExample: `@Provider
public class GzipWriterInterceptor implements WriterInterceptor {
    @Override
    public void aroundWriteTo(WriterInterceptorContext context) 
            throws IOException, WebApplicationException {
        
        MultivaluedMap<String, Object> headers = context.getHeaders();
        headers.putSingle(HttpHeaders.CONTENT_ENCODING, "gzip");

        OutputStream originalStream = context.getOutputStream();
        context.setOutputStream(new GZIPOutputStream(originalStream));

        // Always proceed the chain
        context.proceed();
    }
}`,
    bestPractices: [
      'Always call context.proceed() to pass execution to the next interceptor or MessageBodyWriter.',
      'Use interceptors for byte-level streaming tasks (compression, checksums, symmetric encryption).'
    ],
    pitfalls: [
      'Do not confuse Interceptors with Filters. Filters manipulate headers/routing; Interceptors manipulate entity serialization streams.'
    ]
  },
  {
    id: 'topic-jersey-client',
    title: '6. Jersey Client API & WebTarget',
    category: 'Client API',
    summary: 'Building high-performance, fluent REST clients using ClientBuilder, WebTarget, async callbacks, and reactive RxClient.',
    annotations: ['ClientBuilder', 'Client', 'WebTarget', 'InvocationCallback', 'RxCompletionStageRxWebTarget', 'Entity.json()'],
    codeExample: `// 1. Fluent synchronous invocation
Client client = ClientBuilder.newClient();
WebTarget target = client.target("https://api.example.com/v1")
                         .path("products")
                         .queryParam("category", "electronics");

Product[] items = target.request(MediaType.APPLICATION_JSON)
                        .header("X-Client-ID", "Desktop-App")
                        .get(Product[].class);

// 2. Asynchronous non-blocking invocation
target.request().async().get(new InvocationCallback<Response>() {
    @Override
    public void completed(Response response) {
        System.out.println("Got response: " + response.getStatus());
    }
    @Override
    public void failed(Throwable throwable) {
        throwable.printStackTrace();
    }
});

// 3. Reactive CompletionStage
CompletionStage<Product> stage = target.path("123")
    .request()
    .rx()
    .get(Product.class);`,
    bestPractices: [
      'Reuse the Client instance; creating a new Client is expensive as it initializes connection pools.',
      'Configure connection and read timeouts using ClientConfig.',
      'Use target.request().rx() for modern reactive pipelines.'
    ],
    pitfalls: [
      'Failing to close Response objects when reading raw streams can cause connection pool starvation.'
    ]
  },
  {
    id: 'topic-exception-mappers',
    title: '7. Global ExceptionMapper<T> & Error Models',
    category: 'Exceptions & Validation',
    summary: 'Catching checked and unchecked exceptions thrown by resources and transforming them into structured RFC 7807 JSON problem details.',
    annotations: ['@Provider', 'ExceptionMapper<T>', 'WebApplicationException', 'NotFoundException', 'BadRequestException'],
    codeExample: `@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        int status = 500;
        String error = "Internal Server Error";

        if (exception instanceof WebApplicationException wae) {
            status = wae.getResponse().getStatus();
            error = wae.getMessage();
        } else if (exception instanceof IllegalArgumentException) {
            status = 400;
            error = "Bad Request";
        }

        ProblemDetail problem = new ProblemDetail(
            status,
            error,
            exception.getMessage(),
            System.currentTimeMillis()
        );

        return Response.status(status)
                       .type(MediaType.APPLICATION_JSON)
                       .entity(problem)
                       .build();
    }
}`,
    bestPractices: [
      'Register specific ExceptionMappers (e.g. EntityNotFoundExceptionMapper) alongside a catch-all GlobalExceptionMapper.',
      'Return consistent structured JSON problem details with status code, message, and timestamp.'
    ],
    pitfalls: [
      'Never leak internal Java stack traces or sensitive database credentials in production exception responses.'
    ]
  },
  {
    id: 'topic-bean-validation',
    title: '8. Jakarta Bean Validation (@Valid)',
    category: 'Exceptions & Validation',
    summary: 'Declarative validation of incoming JSON bodies and query parameters with @NotNull, @Size, @Email, and @Pattern.',
    annotations: ['@Valid', '@NotNull', '@NotBlank', '@Size', '@Email', '@Min', '@Max', '@Pattern', 'ConstraintViolationException'],
    codeExample: `public class CreateUserRequest {
    @NotBlank(message = "Username cannot be empty")
    @Size(min = 4, max = 25, message = "Username must be 4-25 characters")
    private String username;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Must be a well-formed email address")
    private String email;

    @Min(value = 18, message = "User must be at least 18 years old")
    private int age;
}

@POST
@Path("/users")
public Response createUser(@Valid CreateUserRequest req) {
    User u = userService.create(req);
    return Response.status(201).entity(u).build();
}`,
    bestPractices: [
      'Always place @Valid before request body parameters.',
      'Provide clear, user-friendly error messages inside constraint annotations.',
      'Register a ConstraintViolationExceptionMapper to format validation errors into a clean array of field violations.'
    ],
    pitfalls: [
      'Omitting @Valid means constraints on DTO fields will NOT be evaluated automatically.'
    ]
  },
  {
    id: 'topic-async-sse',
    title: '9. Server-Sent Events (SSE) & Async Processing',
    category: 'Async & SSE',
    summary: 'Unlocking high concurrency with non-blocking @Suspended AsyncResponse and streaming unidirectional Server-Sent Events.',
    annotations: ['@Suspended', 'AsyncResponse', 'SseEventSink', 'Sse', 'OutboundSseEvent', 'SseBroadcaster', 'ChunkedOutput'],
    codeExample: `@Path("/telemetry")
public class TelemetryResource {

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void stream(@Context SseEventSink eventSink, @Context Sse sse) {
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            if (eventSink.isClosed()) return;
            OutboundSseEvent event = sse.newEventBuilder()
                .name("cpu-metric")
                .data(Map.of("usage", Math.random() * 100))
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .build();
            eventSink.send(event);
        }, 0, 1, TimeUnit.SECONDS);
    }
}`,
    bestPractices: [
      'Check eventSink.isClosed() before attempting to send SSE packets.',
      'Always set a timeout and timeout handler on @Suspended AsyncResponse to prevent connection leaks.',
      'Use SseBroadcaster to broadcast the same stream efficiently to hundreds of concurrent subscribers.'
    ],
    pitfalls: [
      'Blocking threads inside an async handler nullifies the performance benefits of non-blocking I/O.'
    ]
  }
];
