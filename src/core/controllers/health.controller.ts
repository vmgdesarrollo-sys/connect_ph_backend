import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("System")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cluster: {
        mode: process.env.LIVEKIT_REDIS_HOST ? "CLUSTER" : "SINGLE_NODE",
        livekitRedis: process.env.LIVEKIT_REDIS_HOST || "not-configured",
        livekitUrl: process.env.LIVEKIT_URL || "not-configured",
      },
    };
  }
}
