import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('voting_questions', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class VotingQuestionDataDto {
  @ApiProperty() id: string;
  @ApiProperty() question_text: string;
  @ApiProperty() status: string;
  @ApiProperty() result_type: string;
  @ApiProperty() opened_at: Date;
  @ApiProperty() closed_at: Date;
}

export class CreateVotingQuestionResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: VotingQuestionDataDto }) data: VotingQuestionDataDto;
}

export class VotingQuestionListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [VotingQuestionDataDto] }) data: VotingQuestionDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}

export class UpdateVotingQuestionResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("ACTUALIZADA_RES") }) message: string;
  @ApiProperty({ type: VotingQuestionDataDto }) data: VotingQuestionDataDto;
}