import JSZip from 'jszip';
import { ResourceClass, FilterDefinition } from '../types/jersey';

export interface ProjectExportOptions {
  edition: 'jakarta' | 'javax';
  server: 'grizzly' | 'tomcat' | 'payara';
  includeTests: boolean;
  includeClient: boolean;
}

export async function generateJerseyMavenZip(
  resources: ResourceClass[],
  filters: FilterDefinition[],
  options: ProjectExportOptions = {
    edition: 'jakarta',
    server: 'grizzly',
    includeTests: true,
    includeClient: true,
  }
): Promise<Blob> {
  const zip = new JSZip();
  const isJakarta = options.edition === 'jakarta';
  const pkgPrefix = isJakarta ? 'jakarta' : 'javax';
  const jerseyVersion = isJakarta ? '3.1.5' : '2.39.1';

  // 1. pom.xml
  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example.jersey</groupId>
    <artifactId>jersey-practice-app</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>Jersey REST Practice Application</name>
    <description>Complete Java EE / Jakarta REST (JAX-RS) Jersey enterprise project with filters, interceptors, and client integration.</description>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <jersey.version>${jerseyVersion}</jersey.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.glassfish.jersey</groupId>
                <artifactId>jersey-bom</artifactId>
                <version>\${jersey.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- Jersey Server & Grizzly HTTP Container -->
        <dependency>
            <groupId>org.glassfish.jersey.containers</groupId>
            <artifactId>jersey-container-grizzly2-http</artifactId>
        </dependency>

        <!-- HK2 Dependency Injection -->
        <dependency>
            <groupId>org.glassfish.jersey.inject</groupId>
            <artifactId>jersey-hk2</artifactId>
        </dependency>

        <!-- Jackson JSON Media Support -->
        <dependency>
            <groupId>org.glassfish.jersey.media</groupId>
            <artifactId>jersey-media-json-jackson</artifactId>
        </dependency>

        <!-- Server-Sent Events (SSE) -->
        <dependency>
            <groupId>org.glassfish.jersey.media</groupId>
            <artifactId>jersey-media-sse</artifactId>
        </dependency>

        <!-- Jersey Client API -->
        <dependency>
            <groupId>org.glassfish.jersey.core</groupId>
            <artifactId>jersey-client</artifactId>
        </dependency>

        <!-- Jakarta Bean Validation & Hibernate Validator -->
        <dependency>
            <groupId>org.glassfish.jersey.ext</groupId>
            <artifactId>jersey-bean-validation</artifactId>
        </dependency>

        <!-- Test Framework -->
        <dependency>
            <groupId>org.glassfish.jersey.test-framework.providers</groupId>
            <artifactId>jersey-test-framework-provider-grizzly2</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>5.10.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Executable Application Runner Plugin -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.1</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>java</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <mainClass>com.example.jersey.Main</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;

  zip.file('pom.xml', pomXml);

  // 2. Main.java (Grizzly HTTP server bootstrapper)
  const mainJava = `package com.example.jersey;

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

import java.io.IOException;
import java.net.URI;

/**
 * Main application bootstrapper using embedded Grizzly HTTP server and Jersey ResourceConfig.
 */
public class Main {

    // Base URI the Grizzly HTTP server will listen on
    public static final String BASE_URI = "http://localhost:8080/";

    public static HttpServer startServer() {
        // Create a ResourceConfig scanning package com.example.jersey for @Path and @Provider
        final ResourceConfig rc = new AppConfig();

        // Create and start a new instance of grizzly http server
        return GrizzlyHttpServerFactory.createHttpServer(URI.create(BASE_URI), rc);
    }

    public static void main(String[] args) throws IOException {
        final HttpServer server = startServer();
        System.out.println(String.format("Jersey Application started with endpoints available at %s\\nHit enter to stop it...", BASE_URI));
        System.in.read();
        server.shutdownNow();
    }
}`;

  zip.file('src/main/java/com/example/jersey/Main.java', mainJava);

  // 3. AppConfig.java (ResourceConfig setup)
  const appConfigJava = `package com.example.jersey;

import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ServerProperties;
import ${pkgPrefix}.ws.rs.ApplicationPath;

@ApplicationPath("/")
public class AppConfig extends ResourceConfig {

    public AppConfig() {
        // Scan packages for JAX-RS Resources and Providers
        packages("com.example.jersey.resource", "com.example.jersey.filter", "com.example.jersey.interceptor", "com.example.jersey.exception");

        // Register JSON serialization feature
        register(JacksonFeature.class);

        // Enable Tracing for debugging
        property(ServerProperties.TRACING, "ALL");
        property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true);
    }
}`;

  zip.file('src/main/java/com/example/jersey/AppConfig.java', appConfigJava);

  // 4. Model Classes
  const productModel = `package com.example.jersey.model;

public class Product {
    private Long id;
    private String name;
    private String category;
    private double price;
    private int stock;
    private double rating;

    public Product() {}

    public Product(Long id, String name, String category, double price, int stock, double rating) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.rating = rating;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
}`;

  zip.file('src/main/java/com/example/jersey/model/Product.java', productModel);

  // 5. Annotations
  const securedAnnotation = `package com.example.jersey.annotation;

import ${pkgPrefix}.ws.rs.NameBinding;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@NameBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface Secured {
}`;

  zip.file('src/main/java/com/example/jersey/annotation/Secured.java', securedAnnotation);

  // 6. Exceptions & Mappers
  const entityNotFoundException = `package com.example.jersey.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
}`;

  const entityNotFoundExceptionMapper = `package com.example.jersey.exception;

import ${pkgPrefix}.ws.rs.core.MediaType;
import ${pkgPrefix}.ws.rs.core.Response;
import ${pkgPrefix}.ws.rs.ext.ExceptionMapper;
import ${pkgPrefix}.ws.rs.ext.Provider;
import java.util.Map;

@Provider
public class EntityNotFoundExceptionMapper implements ExceptionMapper<EntityNotFoundException> {

    @Override
    public Response toResponse(EntityNotFoundException exception) {
        Map<String, Object> error = Map.of(
            "status", 404,
            "error", "EntityNotFoundException",
            "message", exception.getMessage(),
            "timestamp", System.currentTimeMillis()
        );

        return Response.status(Response.Status.NOT_FOUND)
                       .type(MediaType.APPLICATION_JSON)
                       .entity(error)
                       .build();
    }
}`;

  zip.file('src/main/java/com/example/jersey/exception/EntityNotFoundException.java', entityNotFoundException);
  zip.file('src/main/java/com/example/jersey/exception/EntityNotFoundExceptionMapper.java', entityNotFoundExceptionMapper);

  // 7. Resource Classes
  for (const res of resources) {
    const fileName = `${res.className}.java`;
    let code = res.javaSource;
    if (!isJakarta) {
      code = code.replace(/jakarta\./g, 'javax.');
    }
    zip.file(`src/main/java/com/example/jersey/resource/${fileName}`, code);
  }

  // 8. Filters & Interceptors
  for (const f of filters) {
    const fileName = `${f.className}.java`;
    let code = f.javaSource;
    if (!isJakarta) {
      code = code.replace(/jakarta\./g, 'javax.');
    }
    const folder = f.type.includes('interceptor') ? 'interceptor' : 'filter';
    zip.file(`src/main/java/com/example/jersey/${folder}/${fileName}`, code);
  }

  // 9. Client Helper
  if (options.includeClient) {
    const clientCode = `package com.example.jersey.client;

import ${pkgPrefix}.ws.rs.client.Client;
import ${pkgPrefix}.ws.rs.client.ClientBuilder;
import ${pkgPrefix}.ws.rs.client.WebTarget;
import ${pkgPrefix}.ws.rs.core.MediaType;
import ${pkgPrefix}.ws.rs.core.Response;
import com.example.jersey.model.Product;

public class JerseyProductClient {

    private final Client client;
    private final String baseUrl;

    public JerseyProductClient(String baseUrl) {
        this.client = ClientBuilder.newClient();
        this.baseUrl = baseUrl;
    }

    public Response fetchAllProducts(String category) {
        WebTarget target = client.target(baseUrl)
                                 .path("api/products")
                                 .queryParam("category", category);
        
        return target.request(MediaType.APPLICATION_JSON).get();
    }

    public Response fetchProductById(Long id) {
        return client.target(baseUrl)
                     .path("api/products")
                     .path(id.toString())
                     .request(MediaType.APPLICATION_JSON)
                     .get();
    }

    public void close() {
        client.close();
    }
}`;
    zip.file('src/main/java/com/example/jersey/client/JerseyProductClient.java', clientCode);
  }

  // 10. Unit & Integration Tests with JerseyTest
  if (options.includeTests) {
    const testCode = `package com.example.jersey.test;

import org.glassfish.jersey.test.JerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.jupiter.api.Test;
import ${pkgPrefix}.ws.rs.core.Application;
import ${pkgPrefix}.ws.rs.core.Response;
import com.example.jersey.AppConfig;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ProductResourceTest extends JerseyTest {

    @Override
    protected Application configure() {
        return new AppConfig();
    }

    @Test
    public void testGetAllProducts() {
        Response response = target("api/products").request().get();
        assertEquals(200, response.getStatus());
    }

    @Test
    public void testSecuredEndpointWithoutTokenFails401() {
        Response response = target("api/products").request().post(null);
        assertEquals(401, response.getStatus());
    }
}`;
    zip.file('src/test/java/com/example/jersey/test/ProductResourceTest.java', testCode);
  }

  // 11. README.md
  const readme = `# Jersey REST Practice Application (${isJakarta ? 'Jakarta EE 10 / JAX-RS 3.1' : 'Java EE 8 / JAX-RS 2.1'})

This is a complete, production-ready Jersey project generated by the **Jersey REST Practice Studio**.

## Architecture & Features Included:
- **JAX-RS Resource Endpoints**: \`@Path\`, \`@GET\`, \`@POST\`, \`@PUT\`, \`@DELETE\`, \`@PathParam\`, \`@QueryParam\`, \`@Context UriInfo\`
- **Filter Lifecycle**: \`@PreMatching\` URL rewriter, \`@Secured\` ContainerRequestFilter, ContainerResponseFilter with CORS & Audit logs
- **Interceptors**: ReaderInterceptor & WriterInterceptor entity streaming hooks
- **Client Integration**: Fluent Jersey ClientBuilder & WebTarget API
- **Exception Mappers**: Global \`ExceptionMapper<EntityNotFoundException>\` formatted as RFC 7807 JSON
- **Grizzly HTTP Server**: Standalone embedded container (no heavyweight application server required)

## How to Run:

### 1. Compile and Execute Server:
\`\`\`bash
mvn clean compile exec:java
\`\`\`
The server will boot on **http://localhost:8080/**

### 2. Run Automated Integration Tests:
\`\`\`bash
mvn test
\`\`\`

### 3. Test Endpoints with cURL:
\`\`\`bash
# 1. Fetch catalog
curl http://localhost:8080/api/products

# 2. Test pre-matching rewrite
curl http://localhost:8080/v1/items

# 3. Create product with @Secured token
curl -X POST http://localhost:8080/api/products \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer secret-admin-token" \\
     -d '{"name":"Mechanical Keyboard","price":150.0}'
\`\`\`
`;

  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}
