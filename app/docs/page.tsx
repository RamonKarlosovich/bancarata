"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerDocs() {
  return (
    <div style={{ height: "100vh" }}>
      <SwaggerUI
        url="/swagger.json"
        docExpansion="none"
        defaultModelsExpandDepth={-1}
      />
    </div>
  );
}