import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('questions_options', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class QuestionOptionDataDto {
  @ApiProperty() id: string;
  @ApiProperty() question_id: string;
  @ApiProperty() option_text: string;
  @ApiProperty() order_index: number;
  @ApiProperty() is_active: boolean;
}

export class CreateQuestionOptionResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: QuestionOptionDataDto }) data: QuestionOptionDataDto;
}

export class QuestionOptionListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [QuestionOptionDataDto] }) data: QuestionOptionDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}