import { PracticeChallenge } from '../types/jersey';

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  {
    id: 'lab-1-get-pathparam',
    title: 'Lab 1: RESTful Resource & @PathParam',
    category: 'Basics & Endpoints',
    difficulty: 'Beginner',
    summary: 'Define a JAX-RS Resource endpoint with @Path and @PathParam to find a book by its ISBN.',
    learningObjectives: [
      'Understand @Path annotation on class and method level',
      'Inject URL dynamic segments using @PathParam("isbn")',
      'Return typed Response.ok(book).build() with JSON representation'
    ],
    conceptExplanation: `In JAX-RS / Jersey, resources are plain Java objects annotated with \`@Path\`. Variable path templates like \`@Path("/books/{isbn}")\` can be mapped directly into Java method arguments using \`@PathParam("isbn") String isbn\`.`,
    requirements: [
      'Annotate class with @Path("/api/books") and @Produces(MediaType.APPLICATION_JSON)',
      'Create a method @GET @Path("/{isbn}") named getBook',
      'Inject @PathParam("isbn") String isbn',
      'If isbn is "978-0134685991", return 200 OK with the Effective Java book object'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

@Path("/api/books")
@Produces(MediaType.APPLICATION_JSON)
public class BookResource {

    // TODO: Implement @GET endpoint with @Path("/{isbn}")
    // Inject @PathParam("isbn") String isbn and return Response.ok(book).build()
    
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

@Path("/api/books")
@Produces(MediaType.APPLICATION_JSON)
public class BookResource {

    @GET
    @Path("/{isbn}")
    public Response getBook(@PathParam("isbn") String isbn) {
        if ("978-0134685991".equals(isbn)) {
            Book book = new Book(isbn, "Effective Java (3rd Edition)", "Joshua Bloch", 45.00);
            return Response.ok(book).build();
        }
        return Response.status(Response.Status.NOT_FOUND)
                       .entity("{\\"error\\":\\"Book not found\\"}")
                       .build();
    }
}`,
    hints: [
      'Use @GET above the method to designate it as an HTTP GET handler.',
      'Use @Path("/{isbn}") on the method to capture the path parameter.',
      'Use @PathParam("isbn") String isbn in the parameter list.',
      'Build the return with Response.ok(book).build().'
    ],
    testCases: [
      {
        name: 'Fetch book by ISBN: 978-0134685991',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/books/978-0134685991',
          path: '/api/books/978-0134685991',
          headers: { 'Accept': 'application/json' },
          queryParams: {}
        },
        expectedStatus: 200,
        expectedBodyCheck: (body) => body && (body.title?.includes('Effective Java') || body.isbn === '978-0134685991' || body.name?.includes('Effective Java') || body.price === 45)
      },
      {
        name: 'Fetch non-existent book should return 404',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/books/000-0000000000',
          path: '/api/books/000-0000000000',
          headers: { 'Accept': 'application/json' },
          queryParams: {}
        },
        expectedStatus: 404
      }
    ]
  },
  {
    id: 'lab-2-query-pagination',
    title: 'Lab 2: Query Parameters & @DefaultValue',
    category: 'Parameters & Injection',
    difficulty: 'Beginner',
    summary: 'Build a search endpoint supporting query parameters with fallback default values and header injection.',
    learningObjectives: [
      'Extract query string values with @QueryParam("q")',
      'Provide fallback defaults using @DefaultValue("...")',
      'Inject HTTP request headers via @HeaderParam("Accept-Language")'
    ],
    conceptExplanation: `\`@QueryParam\` extracts values from the query string (e.g. \`?sort=price&order=asc\`). When a query parameter is omitted by the client, \`@DefaultValue\` guarantees a predefined value is passed to your method instead of \`null\` or 0.`,
    requirements: [
      'Create @GET @Path("/search") endpoint',
      'Inject @QueryParam("query") String query',
      'Inject @DefaultValue("1") @QueryParam("page") int page',
      'Inject @DefaultValue("10") @QueryParam("size") int size',
      'Return 200 OK with search results and set header "X-Page-Number" to page'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

@Path("/api/catalog")
@Produces(MediaType.APPLICATION_JSON)
public class CatalogResource {

    // TODO: Create searchCatalog method with @QueryParam and @DefaultValue
    
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.util.Map;

@Path("/api/catalog")
@Produces(MediaType.APPLICATION_JSON)
public class CatalogResource {

    @GET
    @Path("/search")
    public Response searchCatalog(
            @QueryParam("query") String query,
            @DefaultValue("1") @QueryParam("page") int page,
            @DefaultValue("10") @QueryParam("size") int size,
            @HeaderParam("Accept-Language") String language) {
        
        var result = Map.of(
            "query", query != null ? query : "",
            "page", page,
            "size", size,
            "results", List.of("Item A", "Item B")
        );

        return Response.ok(result)
                       .header("X-Page-Number", page)
                       .header("X-Page-Size", size)
                       .build();
    }
}`,
    hints: [
      'Combine @DefaultValue("1") and @QueryParam("page") int page in method parameters.',
      'Use Response.ok(result).header("X-Page-Number", page).build().'
    ],
    testCases: [
      {
        name: 'Search with default page & size',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/catalog/search?query=laptop',
          path: '/api/catalog/search',
          headers: {},
          queryParams: { query: 'laptop' }
        },
        expectedStatus: 200,
        expectedHeaderCheck: (h) => h['x-page-number'] === '1' || h['X-Page-Number'] === '1'
      }
    ]
  },
  {
    id: 'lab-3-post-created-uri',
    title: 'Lab 3: @POST, 201 Created & UriInfo Location',
    category: 'Basics & Endpoints',
    difficulty: 'Intermediate',
    summary: 'Implement a RESTful creation endpoint that persists a resource and returns HTTP 201 Created with a Location header.',
    learningObjectives: [
      'Handle POST requests and consume JSON payloads with @Consumes(MediaType.APPLICATION_JSON)',
      'Inject JAX-RS Context @Context UriInfo to safely construct canonical resource URIs',
      'Use Response.created(locationUri).entity(createdObject).build()'
    ],
    conceptExplanation: `In pure REST architectural style, creating a resource MUST return HTTP status \`201 Created\` along with a \`Location\` response header containing the absolute URI where the newly created item can be fetched. \`UriInfo.getAbsolutePathBuilder()\` allows clean, server-independent URI construction.`,
    requirements: [
      'Add @POST handler consuming MediaType.APPLICATION_JSON',
      'Inject @Context UriInfo uriInfo',
      'Construct URI: uriInfo.getAbsolutePathBuilder().path(id.toString()).build()',
      'Return Response.created(location).entity(createdItem).build()'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.net.URI;

@Path("/api/customers")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerResource {

    @Context
    private UriInfo uriInfo;

    // TODO: Implement @POST createCustomer(Customer customer)
    
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.net.URI;

@Path("/api/customers")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerResource {

    @Context
    private UriInfo uriInfo;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createCustomer(Customer customer) {
        customer.setId(99L); // Simulated persist
        URI location = uriInfo.getAbsolutePathBuilder()
                              .path(customer.getId().toString())
                              .build();
        
        return Response.created(location)
                       .entity(customer)
                       .build();
    }
}`,
    hints: [
      'Annotate with @POST and @Consumes(MediaType.APPLICATION_JSON)',
      'Use uriInfo.getAbsolutePathBuilder().path(customer.getId().toString()).build() to build the URI.',
      'Return Response.created(location).entity(customer).build().'
    ],
    testCases: [
      {
        name: 'POST create new customer returns 201 and Location',
        request: {
          method: 'POST',
          url: 'http://localhost:8080/api/customers',
          path: '/api/customers',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: JSON.stringify({ name: 'Alice Cooper', email: 'alice@rock.com' })
        },
        expectedStatus: 201,
        expectedHeaderCheck: (h) => !!(h['location'] || h['Location'])
      }
    ]
  },
  {
    id: 'lab-4-auth-filter',
    title: 'Lab 4: ContainerRequestFilter Authentication & abortWith()',
    category: 'Filters & LifeCycle',
    difficulty: 'Intermediate',
    summary: 'Write a Jersey ContainerRequestFilter to inspect the Authorization header and abort invalid requests with 401 Unauthorized.',
    learningObjectives: [
      'Implement jakarta.ws.rs.container.ContainerRequestFilter',
      'Register with @Provider and set @Priority(Priorities.AUTHENTICATION)',
      'Inspect requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)',
      'Call requestContext.abortWith(Response) to halt the pipeline immediately'
    ],
    conceptExplanation: `A \`ContainerRequestFilter\` executes before the resource method. Calling \`requestContext.abortWith(response)\` immediately stops further filters, interceptors, and resource execution, sending the provided response back to the client.`,
    requirements: [
      'Implement ContainerRequestFilter',
      'Annotate with @Provider and @Priority(Priorities.AUTHENTICATION)',
      'Check if Authorization header starts with "Bearer "',
      'If missing or invalid, abort with HTTP 401 Unauthorized and header WWW-Authenticate'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.Priorities;
import jakarta.annotation.Priority;
import java.io.IOException;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthenticationFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        // TODO: Check Authorization header and abort with 401 if missing
    }
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.Priorities;
import jakarta.annotation.Priority;
import java.io.IOException;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthenticationFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                        .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer realm=\\"JerseyApp\\"")
                        .entity("{\\"error\\":\\"Missing or invalid Bearer token\\"}")
                        .type(MediaType.APPLICATION_JSON)
                        .build()
            );
        }
    }
}`,
    hints: [
      'Use requestContext.getHeaderString(HttpHeaders.AUTHORIZATION) to read the header.',
      'Check authHeader == null || !authHeader.startsWith("Bearer ").',
      'Call requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)...build()).'
    ],
    testCases: [
      {
        name: 'Request without token is aborted with 401',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/products',
          path: '/api/products',
          headers: {},
          queryParams: {}
        },
        expectedStatus: 200 // Products get is public, but secured POST gets 401
      },
      {
        name: 'POST to @Secured endpoint without token returns 401',
        request: {
          method: 'POST',
          url: 'http://localhost:8080/api/products',
          path: '/api/products',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: JSON.stringify({ name: 'Secret Item', price: 50.0 })
        },
        expectedStatus: 401
      }
    ]
  },
  {
    id: 'lab-5-name-binding',
    title: 'Lab 5: Custom @NameBinding Annotation & Selective Filters',
    category: 'Filters & LifeCycle',
    difficulty: 'Intermediate',
    summary: 'Create a custom @NameBinding annotation (@Secured) and bind it to specific resource classes and filter providers.',
    learningObjectives: [
      'Define a meta-annotation using @NameBinding and @Retention(RetentionPolicy.RUNTIME)',
      'Apply the custom annotation to targeted Resource methods',
      'Apply the same annotation to ContainerRequestFilter so it only fires for matching endpoints'
    ],
    conceptExplanation: `By default, JAX-RS \`@Provider\` filters apply globally to all endpoints. \`@NameBinding\` lets you define custom annotations (like \`@Secured\`, \`@GZIP\`, or \`@Audited\`) to declaratively attach filters only to specific resource classes or methods.`,
    requirements: [
      'Define @NameBinding public @interface Secured {}',
      'Annotate filter class with @Secured and @Provider',
      'Annotate resource method with @Secured'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.NameBinding;
import java.lang.annotation.*;

// TODO 1: Create @Secured NameBinding annotation
// @NameBinding
// @Retention(RetentionPolicy.RUNTIME)
// @Target({ElementType.TYPE, ElementType.METHOD})
// public @interface Secured {}

// TODO 2: Bind filter to @Secured
`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.NameBinding;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import java.lang.annotation.*;
import java.io.IOException;

@NameBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface Secured {}

@Secured
@Provider
class CustomSecuredFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext ctx) throws IOException {
        // Only executes for methods annotated with @Secured
    }
}`,
    hints: [
      '@NameBinding must be retained at RUNTIME.',
      'Target must include TYPE and METHOD.',
      'Place @Secured on both the filter and the resource method.'
    ],
    testCases: [
      {
        name: 'Public endpoint bypasses @Secured filter',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/products',
          path: '/api/products',
          headers: {},
          queryParams: {}
        },
        expectedStatus: 200
      }
    ]
  },
  {
    id: 'lab-6-prematching-filter',
    title: 'Lab 6: @PreMatching Request Filter & URI Rewriting',
    category: 'Filters & LifeCycle',
    difficulty: 'Advanced',
    summary: 'Write a @PreMatching filter that intercepts the request before resource matching and rewrites legacy paths.',
    learningObjectives: [
      'Differentiate Pre-Matching vs Post-Matching filter execution lifecycle',
      'Use @PreMatching annotation on ContainerRequestFilter',
      'Mutate request URI with requestContext.setRequestUri(newUri)'
    ],
    conceptExplanation: `Standard filters run AFTER Jersey has matched the URI to a resource class. A \`@PreMatching\` filter runs BEFORE matching occurs. It has the superpower to rewrite the HTTP Method (e.g. override \`X-HTTP-Method-Override\`) or rewrite the request URI dynamically for backwards-compatibility.`,
    requirements: [
      'Implement ContainerRequestFilter with @Provider and @PreMatching',
      'Detect if request URI starts with "/v1/items"',
      'Rewrite URI to "/api/products" using UriBuilder',
      'Call requestContext.setRequestUri(newUri)'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.net.URI;

@Provider
@PreMatching
public class UrlRewriterFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        // TODO: Check if path starts with /v1/items and rewrite to /api/products
    }
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.net.URI;

@Provider
@PreMatching
public class UrlRewriterFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        URI reqUri = requestContext.getUriInfo().getRequestUri();
        String path = reqUri.getPath();

        if (path.startsWith("/v1/items")) {
            String newPath = path.replaceFirst("/v1/items", "/api/products");
            URI newUri = UriBuilder.fromUri(reqUri).replacePath(newPath).build();
            requestContext.setRequestUri(newUri);
        }
    }
}`,
    hints: [
      'Annotate with @PreMatching and @Provider.',
      'Read URI from requestContext.getUriInfo().getRequestUri().',
      'Use UriBuilder.fromUri(reqUri).replacePath(newPath).build().',
      'Set with requestContext.setRequestUri(newUri).'
    ],
    testCases: [
      {
        name: 'Legacy /v1/items transparently routes to /api/products',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/v1/items',
          path: '/v1/items',
          headers: {},
          queryParams: {}
        },
        expectedStatus: 200,
        expectedBodyCheck: (body) => Array.isArray(body) && body.length > 0
      }
    ]
  },
  {
    id: 'lab-7-interceptors',
    title: 'Lab 7: WriterInterceptor & ReaderInterceptor Pipeline',
    category: 'Interceptors & Streaming',
    difficulty: 'Advanced',
    summary: 'Intercept entity byte streams during serialization and deserialization with context.proceed().',
    learningObjectives: [
      'Implement WriterInterceptor and ReaderInterceptor',
      'Wrap and transform OutputStream or InputStream',
      'Chain interceptors with context.proceed()'
    ],
    conceptExplanation: `While Filters inspect HTTP headers and routing, Interceptors wrap entity serialization (MessageBodyReader / MessageBodyWriter). \`WriterInterceptor.aroundWriteTo()\` and \`ReaderInterceptor.aroundReadFrom()\` allow GZIP compression, encryption, or auditing of payload bytes.`,
    requirements: [
      'Implement WriterInterceptor with @Provider',
      'In aroundWriteTo(WriterInterceptorContext context), append header "X-Intercepted-By"',
      'Call context.proceed() to advance the pipeline chain'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ext.*;
import java.io.IOException;

@Provider
public class AuditWriterInterceptor implements WriterInterceptor {

    @Override
    public void aroundWriteTo(WriterInterceptorContext context) 
            throws IOException, WebApplicationException {
        // TODO: In aroundWriteTo, add header and call context.proceed()
    }
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ext.*;
import java.io.IOException;

@Provider
public class AuditWriterInterceptor implements WriterInterceptor {

    @Override
    public void aroundWriteTo(WriterInterceptorContext context) 
            throws IOException, WebApplicationException {
        context.getHeaders().add("X-Intercepted-By", "AuditWriterInterceptor");
        context.proceed();
    }
}`,
    hints: [
      'context.getHeaders() returns the MultivaluedMap of response headers.',
      'Always remember to call context.proceed() or the serialization stops.'
    ],
    testCases: [
      {
        name: 'Entity response includes X-Intercepted-By header',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/products/1',
          path: '/api/products/1',
          headers: {},
          queryParams: {}
        },
        expectedStatus: 200,
        expectedHeaderCheck: (h) => !!(h['x-intercepted-by'] || h['X-Intercepted-By'])
      }
    ]
  },
  {
    id: 'lab-8-exception-mapper',
    title: 'Lab 8: ExceptionMapper<T> & RFC 7807 Error Formatting',
    category: 'Validation & Error Handling',
    difficulty: 'Intermediate',
    summary: 'Catch unhandled business exceptions globally and transform them into structured JSON error models.',
    learningObjectives: [
      'Implement jakarta.ws.rs.ext.ExceptionMapper<T>',
      'Annotate with @Provider',
      'Return clean HTTP 404/500 JSON response payloads'
    ],
    conceptExplanation: `When a resource method throws an exception, Jersey checks if a matching \`ExceptionMapper<T>\` is registered in the HK2/CDI registry. It transforms the thrown Java Exception into a custom \`Response\` object instead of returning generic 500 HTML error pages.`,
    requirements: [
      'Create class EntityNotFoundExceptionMapper implementing ExceptionMapper<EntityNotFoundException>',
      'Annotate with @Provider',
      'Return Response.status(Status.NOT_FOUND).entity(errorDto).type(MediaType.APPLICATION_JSON).build()'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.*;

@Provider
public class EntityNotFoundExceptionMapper implements ExceptionMapper<EntityNotFoundException> {

    @Override
    public Response toResponse(EntityNotFoundException exception) {
        // TODO: Map exception to Response with 404 NOT_FOUND status and JSON body
        return null;
    }
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.*;
import java.util.Map;

@Provider
public class EntityNotFoundExceptionMapper implements ExceptionMapper<EntityNotFoundException> {

    @Override
    public Response toResponse(EntityNotFoundException exception) {
        var error = Map.of(
            "status", 404,
            "error", "Not Found",
            "message", exception.getMessage(),
            "timestamp", System.currentTimeMillis()
        );

        return Response.status(Response.Status.NOT_FOUND)
                       .type(MediaType.APPLICATION_JSON)
                       .entity(error)
                       .build();
    }
}`,
    hints: [
      'Implement ExceptionMapper<EntityNotFoundException>.',
      'Annotate with @Provider.',
      'Build Response.status(Response.Status.NOT_FOUND).type(MediaType.APPLICATION_JSON).entity(...).build().'
    ],
    testCases: [
      {
        name: 'Non-existing product triggers ExceptionMapper returning JSON error',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/products/9999',
          path: '/api/products/9999',
          headers: {},
          queryParams: {}
        },
        expectedStatus: 404,
        expectedBodyCheck: (b) => b && (b.status === 404 || b.error === 'EntityNotFoundException' || b.error === 'Not Found')
      }
    ]
  },
  {
    id: 'lab-9-jersey-client',
    title: 'Lab 9: Fluent Jersey Client API & WebTarget',
    category: 'Jersey Client API',
    difficulty: 'Intermediate',
    summary: 'Write client-side HTTP invocation code using Jersey ClientBuilder, WebTarget, queryParam, and Entity.json.',
    learningObjectives: [
      'Create Client via ClientBuilder.newClient()',
      'Construct WebTarget with path() and queryParam() chaining',
      'Execute GET and POST with request(MediaType.APPLICATION_JSON)'
    ],
    conceptExplanation: `Jersey includes a high-performance HTTP Client API (JAX-RS Client). \`ClientBuilder.newClient().target("http://api.com").path("products").request(MediaType.APPLICATION_JSON).get(Product[].class)\` gives fluent, type-safe REST consumption.`,
    requirements: [
      'Instantiate Client client = ClientBuilder.newClient()',
      'Build WebTarget target = client.target("http://localhost:8080/api").path("products")',
      'Add queryParam("category", "electronics")',
      'Invoke GET request and extract List<Product>'
    ],
    initialCode: `package com.example.jersey.client;

import jakarta.ws.rs.client.*;
import jakarta.ws.rs.core.*;
import java.util.List;

public class ProductServiceClient {

    public List<Product> fetchElectronics() {
        Client client = ClientBuilder.newClient();
        
        // TODO: Build WebTarget, add queryParam, request JSON, and return result
        return null;
    }
}`,
    solutionCode: `package com.example.jersey.client;

import jakarta.ws.rs.client.*;
import jakarta.ws.rs.core.*;
import java.util.List;

public class ProductServiceClient {

    public List<Product> fetchElectronics() {
        Client client = ClientBuilder.newClient();
        
        WebTarget target = client.target("http://localhost:8080/api")
                                 .path("products")
                                 .queryParam("category", "electronics");
        
        Response response = target.request(MediaType.APPLICATION_JSON)
                                  .header("User-Agent", "JerseyClient/3.0")
                                  .get();

        if (response.getStatus() == 200) {
            return response.readEntity(new GenericType<List<Product>>() {});
        }
        throw new RuntimeException("Failed: HTTP " + response.getStatus());
    }
}`,
    hints: [
      'Use client.target(baseUri).path("products").queryParam("category", "electronics").',
      'Call target.request(MediaType.APPLICATION_JSON).get().',
      'Read typed entity with response.readEntity(new GenericType<List<Product>>() {}).'
    ],
    testCases: [
      {
        name: 'Client fetches electronics category',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/products?category=electronics',
          path: '/api/products',
          headers: { 'User-Agent': 'JerseyClient/3.0' },
          queryParams: { category: 'electronics' }
        },
        expectedStatus: 200,
        expectedBodyCheck: (b) => Array.isArray(b) && b.every((item: any) => item.category === 'electronics')
      }
    ]
  },
  {
    id: 'lab-10-client-filter',
    title: 'Lab 10: ClientRequestFilter & Bearer Token Injection',
    category: 'Jersey Client API',
    difficulty: 'Advanced',
    summary: 'Write a Jersey ClientRequestFilter to automatically attach OAuth / Bearer credentials to all outbound client requests.',
    learningObjectives: [
      'Implement jakarta.ws.rs.client.ClientRequestFilter',
      'Register with client.register(new BearerAuthFilter("secret-token"))',
      'Inject Authorization header in requestContext.getHeaders()'
    ],
    conceptExplanation: `Client filters run on the client side before the HTTP request is transmitted across the wire. \`ClientRequestFilter\` is commonly used to append API tokens, log request metrics, or inject correlation tracing headers.`,
    requirements: [
      'Implement ClientRequestFilter',
      'In filter(ClientRequestContext req), inject HttpHeaders.AUTHORIZATION with "Bearer " + token',
      'Register filter on Jersey Client instance'
    ],
    initialCode: `package com.example.jersey.client;

import jakarta.ws.rs.client.*;
import jakarta.ws.rs.core.*;
import java.io.IOException;

public class BearerAuthClientFilter implements ClientRequestFilter {

    private final String token;

    public BearerAuthClientFilter(String token) {
        this.token = token;
    }

    @Override
    public void filter(ClientRequestContext requestContext) throws IOException {
        // TODO: Inject Authorization header
    }
}`,
    solutionCode: `package com.example.jersey.client;

import jakarta.ws.rs.client.*;
import jakarta.ws.rs.core.*;
import java.io.IOException;

public class BearerAuthClientFilter implements ClientRequestFilter {

    private final String token;

    public BearerAuthClientFilter(String token) {
        this.token = token;
    }

    @Override
    public void filter(ClientRequestContext requestContext) throws IOException {
        requestContext.getHeaders().add(
            HttpHeaders.AUTHORIZATION,
            "Bearer " + this.token
        );
    }
}`,
    hints: [
      'requestContext.getHeaders() returns the MultivaluedMap of outbound headers.',
      'Add HttpHeaders.AUTHORIZATION with "Bearer " + token.'
    ],
    testCases: [
      {
        name: 'POST with Bearer token passes @Secured filter successfully',
        request: {
          method: 'POST',
          url: 'http://localhost:8080/api/products',
          path: '/api/products',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-admin-token-xyz'
          },
          queryParams: {},
          body: JSON.stringify({ name: 'Client Created Item', price: 120.0, category: 'electronics' })
        },
        expectedStatus: 201
      }
    ]
  },
  {
    id: 'lab-11-bean-validation',
    title: 'Lab 11: Bean Validation (@Valid) & Constraints',
    category: 'Validation & Error Handling',
    difficulty: 'Intermediate',
    summary: 'Apply declarative Bean Validation constraints (@NotNull, @Size, @Email) to JAX-RS DTO models.',
    learningObjectives: [
      'Use @Valid on JAX-RS Resource method arguments',
      'Annotate DTO fields with @NotBlank, @Email, @Min',
      'Handle automated validation errors'
    ],
    conceptExplanation: `JAX-RS seamlessly integrates with Jakarta Bean Validation. Adding \`@Valid UserRegistrationDto dto\` forces Jersey and Hibernate Validator to evaluate all constraints before your method body executes.`,
    requirements: [
      'Annotate resource method with @POST public Response registerUser(@Valid UserRegistrationDto dto)',
      'Add validation constraints: @NotBlank String username, @Email String email',
      'Return 201 Created when payload is valid'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public class UserRegistrationDto {
    // TODO: Add constraints on username and email
    public String username;
    public String email;
}

@Path("/api/users")
public class UserValidationResource {
    // TODO: Add @POST /register with @Valid
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public class UserRegistrationDto {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30)
    public String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    public String email;
}

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
public class UserValidationResource {

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(@Valid UserRegistrationDto dto) {
        return Response.status(Response.Status.CREATED)
                       .entity(dto)
                       .build();
    }
}`,
    hints: [
      'Use @NotBlank and @Email from jakarta.validation.constraints.',
      'Place @Valid before the DTO argument in the resource method.'
    ],
    testCases: [
      {
        name: 'Valid registration payload returns 201 Created',
        request: {
          method: 'POST',
          url: 'http://localhost:8080/api/users/register',
          path: '/api/users/register',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: JSON.stringify({ username: 'johndoe', email: 'john@example.com' })
        },
        expectedStatus: 201
      },
      {
        name: 'Invalid registration (missing fields) returns 400 Bad Request',
        request: {
          method: 'POST',
          url: 'http://localhost:8080/api/users/register',
          path: '/api/users/register',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: JSON.stringify({ username: '' })
        },
        expectedStatus: 400
      }
    ]
  },
  {
    id: 'lab-12-sse-stream',
    title: 'Lab 12: Server-Sent Events (SSE) & SseEventSink',
    category: 'Interceptors & Streaming',
    difficulty: 'Advanced',
    summary: 'Publish real-time event streams to connected clients using Jersey SSE SseEventSink and OutboundSseEvent.',
    learningObjectives: [
      'Use @Produces(MediaType.SERVER_SENT_EVENTS)',
      'Inject @Context SseEventSink and @Context Sse',
      'Build and send OutboundSseEvent packets'
    ],
    conceptExplanation: `JAX-RS 2.1+ / Jakarta REST 3.0 provides native Server-Sent Events support. Injecting \`@Context SseEventSink eventSink\` keeps the HTTP connection open for continuous unidirectional real-time data streaming.`,
    requirements: [
      'Create @GET @Path("/events") @Produces(MediaType.SERVER_SENT_EVENTS)',
      'Inject @Context SseEventSink eventSink, @Context Sse sse',
      'Build event: sse.newEventBuilder().name("metric").data(...).build()',
      'Transmit: eventSink.send(event)'
    ],
    initialCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.sse.*;

@Path("/api/telemetry")
public class SseTelemetryResource {

    // TODO: Create @GET @Path("/stream") @Produces(MediaType.SERVER_SENT_EVENTS)
    // Inject @Context SseEventSink and @Context Sse
    
}`,
    solutionCode: `package com.example.jersey.lab;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.sse.*;

@Path("/api/telemetry")
public class SseTelemetryResource {

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void streamMetrics(@Context SseEventSink eventSink, @Context Sse sse) {
        OutboundSseEvent event = sse.newEventBuilder()
                                    .name("telemetry-event")
                                    .data("{\\"status\\":\\"ONLINE\\",\\"cpu\\":32.5}")
                                    .mediaType(MediaType.APPLICATION_JSON_TYPE)
                                    .build();
        eventSink.send(event);
    }
}`,
    hints: [
      'Annotate with @Produces(MediaType.SERVER_SENT_EVENTS).',
      'Use sse.newEventBuilder().name(...).data(...).build().',
      'Call eventSink.send(event).'
    ],
    testCases: [
      {
        name: 'Connect to SSE telemetry stream',
        request: {
          method: 'GET',
          url: 'http://localhost:8080/api/stream/events',
          path: '/api/stream/events',
          headers: { 'Accept': 'text/event-stream' },
          queryParams: {}
        },
        expectedStatus: 200,
        expectedHeaderCheck: (h) => (h['content-type'] || h['Content-Type'] || '').includes('text/event-stream')
      }
    ]
  }
];
