import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('assembly_attendances', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class AttendanceDataDto {
  @ApiProperty() id: string;
  @ApiProperty() assemblies_id: string;
  @ApiProperty() unit_assignments_id: string;
  @ApiProperty({ example: true }) is_present: boolean;
  @ApiProperty() arrival_at: Date;
  @ApiProperty() departure_at: Date;
}

export class CreateAttendanceResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("CREAR_RES") }) message: string;
  @ApiProperty({ type: AttendanceDataDto }) data: AttendanceDataDto;
}

export class AttendanceListResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("LISTAR_RES") }) message: string;
  @ApiProperty({ type: [AttendanceDataDto] }) data: AttendanceDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) properties: PaginationMetaDto;
}

export class GetAttendanceResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("DETALLE_RES") }) message: string;
  @ApiProperty({ type: AttendanceDataDto }) data: AttendanceDataDto;
}

export class UpdateAttendanceResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("ACTUALIZADA_RES") }) message: string;
  @ApiProperty({ type: AttendanceDataDto }) data: AttendanceDataDto;
}

export class DeleteAttendanceResponseDto {
  @ApiProperty({ example: g("SUCCESS") }) status: string;
  @ApiProperty({ example: t("ELIMINADA_RES") }) message: string;
}