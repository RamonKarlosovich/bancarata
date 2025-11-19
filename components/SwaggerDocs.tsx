"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function SwaggerDocs() {
  // Cache-busting: siempre fuerza a recargar swagger.json
  const swaggerUrl = `/swagger.json?v=${Date.now()}`;

  return (
    <div style={{ height: "100vh" }}>
      <SwaggerUI
        url={swaggerUrl}
        docExpansion="none"
        defaultModelsExpandDepth={-1}
      />
    </div>
  );
}
