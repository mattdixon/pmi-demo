export const dynamic = "force-dynamic";

// Swagger UI for interactive API testing. Loaded from a pinned CDN so we add
// zero npm dependencies and avoid React 19 / Next 16 peer-dep conflicts that
// come with swagger-ui-react. Points at the /api/openapi spec.
const SWAGGER_VERSION = "5.17.14";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PMI Aspire POC — API docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css"
    />
    <style>
      body { margin: 0; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          deepLinking: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`;

export const GET = async () => {
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
