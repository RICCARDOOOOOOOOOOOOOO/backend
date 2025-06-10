import { apiClient } from "./APiClient";
import { CassaDto, VoceCassaDto } from "./../models/CassaDto";

async function recuperaCassa(id_anag, id_turno) {
  let postData = { id_anag: id_anag, id_turno: id_turno };
  const response = await apiClient.post(`/turni/recuperaCassa.php`, postData);

  let cassa = new CassaDto();
  response.forEach((element) => {
    if (cassa.nome == null) {
      cassa.nome = element.nome;
      cassa.cognome = element.cognome;
      cassa.inserimenti = [];
      cassa.totaleVersato = 0;
      cassa.totaleSpesa = 0;
      cassa.totaleInCassa = 0;
    }

    let voceCassa = new VoceCassaDto();
    voceCassa.id = element.id;
    voceCassa.insert_date = element.insert_date;
    voceCassa.value = element.value;
    voceCassa.type = element.type;
    cassa.inserimenti.push(voceCassa);
    if (element.value > 0) {
      cassa.totaleVersato += element.value;
    } else {
      cassa.totaleSpesa += element.value * -1;
    }
  });
  cassa.totaleInCassa = cassa.totaleVersato - cassa.totaleSpesa;

  if (cassa.nome == null || cassa.nome == "") {
    let postData = { id: id_anag };
    const response = await apiClient.post(
      `/dati_anagrafici/recuperaAnagraficaSingola.php`,
      postData
    );
    console.log("response se non ho voci in cassa", response);
    cassa.nome = response.returnObject.nome;
    cassa.cognome = response.returnObject.cognome;
    cassa.inserimenti = [];
    cassa.totaleVersato = 0;
    cassa.totaleSpesa = 0;
    cassa.totaleInCassa = 0;
  }

  return cassa;
}

export default { recuperaCassa };
