export class CassaDto {
  id_anag: number;
  id_turno: number;
  cognome: string;
  nome: string;

  inserimenti: VoceCassaDto[];
};

export class VoceCassaDto {
  id: number;
  insert_date: Date;
  value: number;
  type: string;
}
