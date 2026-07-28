import { Module } from "@nestjs/common";
import { StoryProjectsService } from "./story-projects.service";
import { StoryProjectsController } from "./story-projects.controller";

@Module({
  providers: [StoryProjectsService],
  controllers: [StoryProjectsController],
})
export class StoryProjectsModule {}
