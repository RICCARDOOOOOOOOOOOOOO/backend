
import { apiClient } from './APiClient';

async function recuperaTurni() {
  const response = await apiClient.get(`/turni/recuperaTurni.php?year=2025`);
  return response.returnObject;
}

async function recuperaDettaglioTurno(idTurno) {
  let postData = {idturno: idTurno};
  const response = await apiClient.post(`/turni/recuperaDettagli.php`, postData);
  return response;
}

export default { recuperaTurni, recuperaDettaglioTurno };