
import { apiClient } from './APiClient';

async function recuperaAnagrafica(id_anag) {
  let postData = { id: id_anag };
    const response = await apiClient.post(
      `/dati_anagrafici/recuperaAnagraficaSingola.php`,
      postData
    );
    let anagrafica = {
      idanag: response.returnObject.id,
      nome: response.returnObject.nome,
      cognome: response.returnObject.cognome
    }
    return anagrafica;
}

export default { recuperaAnagrafica };