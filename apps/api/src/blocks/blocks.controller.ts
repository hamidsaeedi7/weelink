import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { ReorderBlocksDto } from "./dto/reorder-blocks.dto";
import { ApplyTemplateDto, RestoreBlocksDto } from "./dto/apply-template.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("blocks")
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private blocks: BlocksService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.blocks.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateBlockDto) {
    return this.blocks.create(user.id, dto);
  }

  @Put("reorder")
  reorder(@CurrentUser() user: { id: string }, @Body() dto: ReorderBlocksDto) {
    return this.blocks.reorder(user.id, dto);
  }

  // Declared before the ":id" routes so "apply-template" is never swallowed
  // by the wildcard param.
  @Post("apply-template")
  applyTemplate(@CurrentUser() user: { id: string }, @Body() dto: ApplyTemplateDto) {
    return this.blocks.applyTemplate(user.id, dto);
  }

  @Post("restore")
  restore(@CurrentUser() user: { id: string }, @Body() dto: RestoreBlocksDto) {
    return this.blocks.restore(user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: Partial<CreateBlockDto>,
  ) {
    return this.blocks.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.blocks.remove(user.id, id);
  }
}

@Controller("blocks")
export class BlocksPublicController {
  constructor(private blocks: BlocksService) {}

  @Post(":id/click")
  click(@Param("id") id: string) {
    return this.blocks.recordClick(id);
  }
}
