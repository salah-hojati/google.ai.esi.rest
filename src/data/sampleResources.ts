import { ResourceClass, FilterDefinition } from '../types/jersey';

export const INITIAL_RESOURCES: ResourceClass[] = [
  {
    id: 'product-resource',
    className: 'ProductResource',
    basePath: '/api/products',
    description: 'CRUD operations with pagination, sorting, caching, and @Secured authorization',
    nameBindings: [],
    methods: [
      {
        id: 'get-all-products',
        httpMethod: 'GET',
        subPath: '',
        methodName: 'getAllProducts',
        produces: ['application/json', 'application/xml'],
        consumes: [],
        params: [
          { type: 'query', name: 'category', javaType: 'String', description: 'Filter by category (e.g. electronics, books)' },
          { type: 'query', name: 'minPrice', javaType: 'Double', defaultValue: '0.0', description: 'Minimum price filter' },
          { type: 'query', name: 'page', javaType: 'int', defaultValue: '1', description: 'Page number for pagination' },
          { type: 'query', name: 'limit', javaType: 'int', defaultValue: '10', description: 'Page size limit' },
          { type: 'header', name: 'Accept-Language', javaType: 'String', defaultValue: 'en-US' }
        ],
        returnType: 'Response',
        description: 'Retrieves catalog products with query filtering & pagination metadata',
        handlerCode: `// Java Handler Implementation in Jersey
List<Product> list = productService.find(category, minPrice, page, limit);
return Response.ok(list)
    .header("X-Total-Count", productService.count(category, minPrice))
    .header("Cache-Control", "public, max-age=300")
    .build();`
      },
      {
        id: 'get-product-by-id',
        httpMethod: 'GET',
        subPath: '/{id}',
        methodName: 'getProductById',
        produces: ['application/json'],
        consumes: [],
        params: [
          { type: 'path', name: 'id', javaType: 'Long', required: true, description: 'Unique product ID' },
          { type: 'matrix', name: 'format', javaType: 'String', description: 'Matrix param format e.g. ;format=detailed' }
        ],
        returnType: 'Response',
        description: 'Finds a single product by path variable id or throws 404',
        handlerCode: `Product product = productService.findById(id);
if (product == null) {
    throw new EntityNotFoundException("Product not found with id: " + id);
}
return Response.ok(product).build();`
      },
      {
        id: 'create-product',
        httpMethod: 'POST',
        subPath: '',
        methodName: 'createProduct',
        produces: ['application/json'],
        consumes: ['application/json'],
        nameBindings: ['@Secured'],
        params: [
          { type: 'context', name: 'uriInfo', javaType: 'UriInfo', description: 'UriInfo for Location header builder' }
        ],
        returnType: 'Response',
        description: 'Creates a new product with 201 Created status and Location header',
        handlerCode: `Product created = productService.save(payload);
URI location = uriInfo.getAbsolutePathBuilder().path(created.getId().toString()).build();
return Response.created(location).entity(created).build();`
      },
      {
        id: 'update-product',
        httpMethod: 'PUT',
        subPath: '/{id}',
        methodName: 'updateProduct',
        produces: ['application/json'],
        consumes: ['application/json'],
        nameBindings: ['@Secured'],
        params: [
          { type: 'path', name: 'id', javaType: 'Long', required: true }
        ],
        returnType: 'Response',
        description: 'Full update of a product item',
        handlerCode: `Product updated = productService.update(id, payload);
return Response.ok(updated).build();`
      },
      {
        id: 'delete-product',
        httpMethod: 'DELETE',
        subPath: '/{id}',
        methodName: 'deleteProduct',
        produces: [],
        consumes: [],
        nameBindings: ['@Secured'],
        params: [
          { type: 'path', name: 'id', javaType: 'Long', required: true }
        ],
        returnType: 'Response',
        description: 'Deletes product and returns 204 No Content',
        handlerCode: `productService.delete(id);
return Response.noContent().build();`
      }
    ],
    javaSource: `package com.example.jersey.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.net.URI;
import java.util.List;
import com.example.jersey.annotation.Secured;
import com.example.jersey.model.Product;
import com.example.jersey.exception.EntityNotFoundException;

@Path("/api/products")
@Produces(MediaType.APPLICATION_JSON)
public class ProductResource {

    @Context
    private UriInfo uriInfo;

    @GET
    public Response getAllProducts(
            @QueryParam("category") String category,
            @DefaultValue("0.0") @QueryParam("minPrice") double minPrice,
            @DefaultValue("1") @QueryParam("page") int page,
            @DefaultValue("10") @QueryParam("limit") int limit,
            @HeaderParam("Accept-Language") String language) {
        
        List<Product> list = ProductDatabase.query(category, minPrice, page, limit);
        return Response.ok(list)
                .header("X-Total-Count", ProductDatabase.count(category, minPrice))
                .header("Cache-Control", "public, max-age=300")
                .build();
    }

    @GET
    @Path("/{id}")
    public Response getProductById(
            @PathParam("id") Long id,
            @MatrixParam("format") String format) {
        
        Product product = ProductDatabase.findById(id);
        if (product == null) {
            throw new EntityNotFoundException("Product not found with ID: " + id);
        }
        return Response.ok(product).build();
    }

    @POST
    @Secured
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createProduct(Product product) {
        Product created = ProductDatabase.insert(product);
        URI location = uriInfo.getAbsolutePathBuilder()
                              .path(created.getId().toString())
                              .build();
        return Response.created(location).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @Secured
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateProduct(@PathParam("id") Long id, Product product) {
        Product updated = ProductDatabase.update(id, product);
        if (updated == null) {
            throw new EntityNotFoundException("Product with ID " + id + " does not exist");
        }
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    @Secured
    public Response deleteProduct(@PathParam("id") Long id) {
        boolean removed = ProductDatabase.delete(id);
        if (!removed) {
            throw new EntityNotFoundException("Cannot delete: Product " + id + " not found");
        }
        return Response.noContent().build();
    }
}`
  },
  {
    id: 'user-resource',
    className: 'UserResource',
    basePath: '/api/users',
    description: 'User profile management, Bean Validation, and Sub-resource routing',
    methods: [
      {
        id: 'get-users',
        httpMethod: 'GET',
        subPath: '',
        methodName: 'getUsers',
        produces: ['application/json'],
        consumes: [],
        params: [],
        returnType: 'List<UserDto>',
        description: 'Returns list of registered users with role flags',
        handlerCode: `return Response.ok(UserDatabase.getAll()).build();`
      },
      {
        id: 'get-user-by-id',
        httpMethod: 'GET',
        subPath: '/{userId}',
        methodName: 'getUserById',
        produces: ['application/json'],
        consumes: [],
        params: [{ type: 'path', name: 'userId', javaType: 'Long' }],
        returnType: 'Response',
        description: 'Fetch user profile by user ID',
        handlerCode: `User u = UserDatabase.findById(userId);
return Response.ok(u).build();`
      },
      {
        id: 'register-user',
        httpMethod: 'POST',
        subPath: '/register',
        methodName: 'registerUser',
        produces: ['application/json'],
        consumes: ['application/json'],
        params: [],
        returnType: 'Response',
        description: 'Registers user with Bean Validation (@Valid UserRegistrationDto)',
        handlerCode: `User created = UserDatabase.register(payload);
return Response.status(Response.Status.CREATED).entity(created).build();`
      }
    ],
    javaSource: `package com.example.jersey.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.validation.Valid;
import com.example.jersey.model.User;
import com.example.jersey.model.UserRegistrationDto;
import com.example.jersey.exception.EntityNotFoundException;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {

    @GET
    public Response getAllUsers() {
        return Response.ok(UserDatabase.getAll()).build();
    }

    @GET
    @Path("/{userId}")
    public Response getUser(@PathParam("userId") Long userId) {
        User user = UserDatabase.findById(userId);
        if (user == null) {
            throw new EntityNotFoundException("User not found: " + userId);
        }
        return Response.ok(user).build();
    }

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(@Valid UserRegistrationDto dto) {
        User user = UserDatabase.register(dto);
        return Response.status(Response.Status.CREATED).entity(user).build();
    }
}`
  },
  {
    id: 'stream-resource',
    className: 'StreamingResource',
    basePath: '/api/stream',
    description: 'Server-Sent Events (SSE) and Asynchronous @Suspended Response handling',
    methods: [
      {
        id: 'get-events-sse',
        httpMethod: 'GET',
        subPath: '/events',
        methodName: 'streamEvents',
        produces: ['text/event-stream'],
        consumes: [],
        params: [
          { type: 'context', name: 'eventSink', javaType: 'SseEventSink' },
          { type: 'context', name: 'sse', javaType: 'Sse' }
        ],
        isSse: true,
        returnType: 'void',
        description: 'Server-Sent Events stream delivering real-time telemetry metrics',
        handlerCode: `OutboundSseEvent event = sse.newEventBuilder()
    .name("telemetry")
    .data(Map.of("cpu", 34.2, "mem", 68.1, "time", Instant.now().toString()))
    .mediaType(MediaType.APPLICATION_JSON_TYPE)
    .build();
eventSink.send(event);`
      },
      {
        id: 'async-calculation',
        httpMethod: 'GET',
        subPath: '/heavy-task',
        methodName: 'runHeavyTask',
        produces: ['application/json'],
        consumes: [],
        params: [],
        isAsync: true,
        returnType: 'void',
        description: 'Asynchronous non-blocking worker utilizing @Suspended AsyncResponse',
        handlerCode: `CompletableFuture.supplyAsync(() -> performHeavyTask())
    .thenAccept(res -> asyncResponse.resume(Response.ok(res).build()))
    .exceptionally(ex -> {
        asyncResponse.resume(Response.serverError().entity(ex.getMessage()).build());
        return null;
    });`
      }
    ],
    javaSource: `package com.example.jersey.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.sse.*;
import java.util.concurrent.*;

@Path("/api/stream")
public class StreamingResource {

    @GET
    @Path("/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void streamEvents(@Context SseEventSink eventSink, @Context Sse sse) {
        OutboundSseEvent event = sse.newEventBuilder()
                .name("telemetry")
                .data(String.class, "{\\"status\\":\\"HEALTHY\\",\\"load\\":0.42}")
                .build();
        eventSink.send(event);
    }

    @GET
    @Path("/heavy-task")
    @Produces(MediaType.APPLICATION_JSON)
    public void runHeavyTask(@Suspended final AsyncResponse asyncResponse) {
        asyncResponse.setTimeout(5, TimeUnit.SECONDS);
        asyncResponse.setTimeoutHandler(res -> 
            res.resume(Response.status(Response.Status.SERVICE_UNAVAILABLE)
                               .entity("Operation timed out").build())
        );

        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(300);
                asyncResponse.resume(Response.ok("{\\"result\\":\\"Task completed successfully\\"}").build());
            } catch (InterruptedException e) {
                asyncResponse.resume(Response.serverError().build());
            }
        });
    }
}`
  }
];

export const INITIAL_FILTERS: FilterDefinition[] = [
  {
    id: 'filter-prematching-rewrite',
    className: 'ApiVersionPreMatchingFilter',
    type: 'pre-matching-request',
    priority: 100,
    isGlobal: true,
    enabled: true,
    description: 'Pre-Matching filter that transparently rewrites legacy URLs (e.g. /v1/items -> /api/products) before resource matching occurs',
    javaSource: `package com.example.jersey.filter;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.net.URI;

@Provider
@PreMatching
@Priority(100)
public class ApiVersionPreMatchingFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        URI requestUri = requestContext.getUriInfo().getRequestUri();
        String path = requestUri.getPath();

        // Transparent rewrite of legacy /v1/items to current /api/products
        if (path.startsWith("/v1/items")) {
            String newPath = path.replaceFirst("/v1/items", "/api/products");
            URI newUri = UriBuilder.fromUri(requestUri).replacePath(newPath).build();
            requestContext.setRequestUri(newUri);
        }
    }
}`
  },
  {
    id: 'filter-auth-secured',
    className: 'SecurityAuthFilter',
    type: 'post-matching-request',
    priority: 1000,
    nameBindings: ['@Secured'],
    isGlobal: false,
    enabled: true,
    description: 'ContainerRequestFilter bound via @Secured to validate Authorization: Bearer token header or abort with 401 Unauthorized',
    javaSource: `package com.example.jersey.filter;

import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.annotation.Priority;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import com.example.jersey.annotation.Secured;

@Secured
@Provider
@Priority(Priorities.AUTHENTICATION)
public class SecurityAuthFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                    .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer realm=\\"JerseyApp\\"")
                    .entity("{\\"error\\": \\"Unauthorized\\", \\"message\\": \\"Valid Bearer token is required for @Secured endpoints\\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build()
            );
            return;
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        if ("invalid-token".equalsIgnoreCase(token) || token.isEmpty()) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\\"error\\": \\"InvalidToken\\", \\"message\\": \\"Provided Bearer token has expired or is invalid\\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build()
            );
            return;
        }

        // Set custom SecurityContext with extracted user principal
        final String username = token.contains("admin") ? "admin_user" : "standard_user";
        requestContext.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() { return () -> username; }
            @Override
            public boolean isUserInRole(String role) { return "ADMIN".equalsIgnoreCase(role); }
            @Override
            public boolean isSecure() { return true; }
            @Override
            public String getAuthenticationScheme() { return "BEARER"; }
        });
    }
}`
  },
  {
    id: 'interceptor-reader-decrypt',
    className: 'DecryptionReaderInterceptor',
    type: 'reader-interceptor',
    priority: 2000,
    isGlobal: true,
    enabled: true,
    description: 'ReaderInterceptor that inspects incoming entity stream, decoding payload if X-Encrypted header is present before deserialization',
    javaSource: `package com.example.jersey.interceptor;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.ext.ReaderInterceptor;
import jakarta.ws.rs.ext.ReaderInterceptorContext;
import java.io.IOException;
import java.io.InputStream;

@Provider
public class DecryptionReaderInterceptor implements ReaderInterceptor {

    @Override
    public Object aroundReadFrom(ReaderInterceptorContext context) 
            throws IOException, WebApplicationException {
        
        String encrypted = context.getHeaders().getFirst("X-Encrypted");
        if ("true".equalsIgnoreCase(encrypted)) {
            // Transform/decrypt incoming InputStream before Jackson deserializes
            InputStream originalStream = context.getInputStream();
            context.setInputStream(originalStream);
        }

        // Proceed to next interceptor in chain or MessageBodyReader
        return context.proceed();
    }
}`
  },
  {
    id: 'interceptor-writer-compress',
    className: 'CompressionWriterInterceptor',
    type: 'writer-interceptor',
    priority: 3000,
    isGlobal: true,
    enabled: true,
    description: 'WriterInterceptor that intercepts outgoing entity stream and adds Content-Encoding or metadata before serialization',
    javaSource: `package com.example.jersey.interceptor;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.ext.WriterInterceptor;
import jakarta.ws.rs.ext.WriterInterceptorContext;
import java.io.IOException;

@Provider
public class CompressionWriterInterceptor implements WriterInterceptor {

    @Override
    public void aroundWriteTo(WriterInterceptorContext context) 
            throws IOException, WebApplicationException {
        
        // Add custom header or compress stream
        context.getHeaders().add("X-Intercepted-By", "CompressionWriterInterceptor");
        
        // Proceed to next interceptor in chain or MessageBodyWriter
        context.proceed();
    }
}`
  },
  {
    id: 'filter-response-cors',
    className: 'CorsResponseFilter',
    type: 'response',
    priority: 4000,
    isGlobal: true,
    enabled: true,
    description: 'ContainerResponseFilter appending CORS (Cross-Origin Resource Sharing) headers to all outgoing responses',
    javaSource: `package com.example.jersey.filter;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class CorsResponseFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext, 
                       ContainerResponseContext responseContext) throws IOException {
        
        responseContext.getHeaders().add("Access-Control-Allow-Origin", "*");
        responseContext.getHeaders().add("Access-Control-Allow-Headers", "origin, content-type, accept, authorization, x-requested-with");
        responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
    }
}`
  },
  {
    id: 'filter-response-logging',
    className: 'AuditLoggingResponseFilter',
    type: 'response',
    priority: 5000,
    isGlobal: true,
    enabled: true,
    description: 'ContainerResponseFilter measuring execution latency and injecting X-Response-Time-Ms and X-Trace-Id headers',
    javaSource: `package com.example.jersey.filter;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.util.UUID;

@Provider
public class AuditLoggingResponseFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext, 
                       ContainerResponseContext responseContext) throws IOException {
        
        String traceId = "trc-" + UUID.randomUUID().toString().substring(0, 8);
        responseContext.getHeaders().add("X-Trace-Id", traceId);
        responseContext.getHeaders().add("X-Jersey-Server", "Jersey/3.1.5 (Jakarta REST)");
    }
}`
  }
];

export const INITIAL_PRODUCTS = [
  { id: 1, name: 'MacBook Pro 16" M3 Max', category: 'electronics', price: 3499.00, stock: 15, rating: 4.9 },
  { id: 2, name: 'Sony WH-1000XM5 Noise-Cancelling', category: 'electronics', price: 399.99, stock: 42, rating: 4.8 },
  { id: 3, name: 'Clean Architecture: A Craftsman\'s Guide', category: 'books', price: 34.50, stock: 80, rating: 4.9 },
  { id: 4, name: 'Designing Data-Intensive Applications', category: 'books', price: 42.99, stock: 65, rating: 5.0 },
  { id: 5, name: 'Keychron Q1 Pro Wireless Keyboard', category: 'electronics', price: 199.00, stock: 24, rating: 4.7 },
  { id: 6, name: 'Ergonomic Standing Desk 60x30', category: 'furniture', price: 549.00, stock: 12, rating: 4.6 }
];

export const INITIAL_USERS = [
  { id: 101, username: 'dev_alex', email: 'alex@enterprise.java', role: 'ADMIN', active: true, createdAt: '2026-01-15' },
  { id: 102, username: 'sarah_arch', email: 'sarah@cloud.tech', role: 'USER', active: true, createdAt: '2026-02-01' },
  { id: 103, username: 'chen_lead', email: 'chen@microservices.io', role: 'USER', active: true, createdAt: '2026-03-10' }
];
