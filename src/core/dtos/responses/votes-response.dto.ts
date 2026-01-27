import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('votes', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class VoteDataDto {
  @ApiProperty() id: string;
  @ApiProperty() voting_questions_id: string;
  @ApiProperty() questions_options_id: string;
  @ApiProperty() coefficient_at_voting: number;
  @ApiProperty() created_at: Date;
}

export class CreateVoteResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: VoteDataDto }) data: VoteDataDto;
}

export class VoteListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [VoteDataDto] }) data: VoteDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}