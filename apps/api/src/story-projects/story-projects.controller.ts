import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { StoryProjectsService } from "./story-projects.service";
import { CreateStoryProjectDto, UpdateStoryProjectDto } from "./dto/story-project.dto";

// NOTE: CurrentUser ignores any argument and always yields the whole user
// object, so it must be used as `@CurrentUser() user` and dereferenced here.
// `@CurrentUser("id")` silently passes the user object through as the id.
@Controller("story-projects")
@UseGuards(JwtAuthGuard)
export class StoryProjectsController {
  constructor(private readonly service: StoryProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: any, @Param("id") id: string) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStoryProjectDto) {
    return this.service.create(user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: UpdateStoryProjectDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.service.remove(user.id, id);
  }
}
