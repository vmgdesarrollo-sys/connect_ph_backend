import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('assembly_announcements', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class AnnouncementDataDto {
  @ApiProperty({ example: t("UUID") })
  id: string;
  @ApiProperty({ example: t("TITLE") })
  title: string;
  @ApiProperty({ example: t("MESSAGE") })
  message: string;
  @ApiProperty({ example: true })
  is_sticky: boolean;
  @ApiProperty({ example: "2026-01-25T13:00:00Z" })
  created_at: Date;
}

export class CreateAnnouncementResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: AnnouncementDataDto }) data: AnnouncementDataDto;
}

export class AnnouncementListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [AnnouncementDataDto] }) data: AnnouncementDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}

export class GetAnnouncementResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("DETALLE_RES") }) message: string;
  @ApiProperty({ type: AnnouncementDataDto }) data: AnnouncementDataDto;
}

export class DeleteAnnouncementResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("ELIMINADA_RES") }) message: string;
}

export class UpdateAnnouncementResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("UPDATE_SUCCESS") }) message: string;
  @ApiProperty({ type: AnnouncementDataDto }) data: AnnouncementDataDto;
}