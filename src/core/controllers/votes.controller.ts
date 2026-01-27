import { Controller, Get, Post, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { VotesService } from "../services/votes.service";
import { CreateVoteDto } from "../dtos/payload/votes-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { CreateVoteResponseDto, VoteListResponseDto } from "../dtos/responses/votes-response.dto";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('votes', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("votes")
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateVoteResponseDto })
  async create(@Body() dto: CreateVoteDto, @Req() req: any) {
    // Capturamos IP y User Agent automáticamente si no vienen en el DTO
    dto.ip_address = dto.ip_address || req.ip;
    dto.user_agent = dto.user_agent || req.headers['user-agent'];
    return await this.votesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiResponse({ status: 200, type: VoteListResponseDto })
  async findAll(@Query("_where") _where?: string) {
    const data = await this.votesService.findAll(_where);
    return {
      status: "success",
      message: t('LISTAR_RES'),
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }
}