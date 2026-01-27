import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('qa_entries', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class QaEntryDataDto {
  @ApiProperty() id: string;
  @ApiProperty() assembly_attendances_id: string;
  @ApiProperty() question_text: string;
  @ApiProperty() status: string;
  @ApiProperty() answer_text: string;
  @ApiProperty() upvotes: number;
  @ApiProperty() created_at: Date;
}

export class CreateQaResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: QaEntryDataDto }) data: QaEntryDataDto;
}

export class QaListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [QaEntryDataDto] }) data: QaEntryDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}

export class UpdateQaResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("ACTUALIZADA_RES") }) message: string;
  @ApiProperty({ type: QaEntryDataDto }) data: QaEntryDataDto;
}