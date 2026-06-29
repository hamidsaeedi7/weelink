import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AbTestsService } from "./ab-tests.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("ab-tests")
export class AbTestsController {
  constructor(private abTests: AbTestsService) {}

  // GET /ab-tests (auth) — my tests
  @Get()
  @UseGuards(JwtAuthGuard)
  getTests(@CurrentUser() user: { id: string }) {
    return this.abTests.getTests(user.id);
  }

  // POST /ab-tests (auth) — create test
  @Post()
  @UseGuards(JwtAuthGuard)
  createTest(
    @CurrentUser() user: { id: string },
    @Body() data: { name: string; variantBDescription?: string },
  ) {
    return this.abTests.createTest(user.id, data);
  }

  // POST /ab-tests/public/:slug — get active test (public)
  @Post("public/:slug")
  getActiveTest(@Param("slug") slug: string) {
    return this.abTests.getActiveTest(slug);
  }

  // POST /ab-tests/:id/impression — record impression
  @Post(":id/impression")
  recordImpression(
    @Param("id") id: string,
    @Body("variant") variant: "A" | "B",
  ) {
    return this.abTests.recordImpression(id, variant);
  }

  // POST /ab-tests/:id/conversion — record conversion
  @Post(":id/conversion")
  recordConversion(
    @Param("id") id: string,
    @Body("variant") variant: "A" | "B",
  ) {
    return this.abTests.recordConversion(id, variant);
  }

  // PUT /ab-tests/:id/end (auth) — end test with winner
  @Put(":id/end")
  @UseGuards(JwtAuthGuard)
  endTest(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body("winner") winner: "A" | "B",
  ) {
    return this.abTests.endTest(user.id, id, winner);
  }

  // PUT /ab-tests/:id/pause (auth) — pause/unpause
  @Put(":id/pause")
  @UseGuards(JwtAuthGuard)
  pauseTest(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.abTests.pauseTest(user.id, id);
  }
}
