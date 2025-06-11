import React, { useEffect, useState } from "react";
import CassaApi from "../services/CassaApi";
import "../styles/main.css"

export default function DettaglioCassa({id_turno, id_anag}) {
  const [cassa, setCassa] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [visualizzaNuovaVoce, setVisualizzaNuovaVoce] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const recuperaCassa = () => {
      console.log("recuperaCassa");
      CassaApi.recuperaCassa(id_anag, id_turno).then((response) => {
        setCassa(response);
        setIsLoading(false);
      });
    };

    if(id_turno && id_anag) recuperaCassa();

  }, [id_turno, id_anag]);

  const espandiNuovaVoceCassa = () => {
    setVisualizzaNuovaVoce(true);
  }

  const chiudiNuovaVoceCassa = () => {
    setVisualizzaNuovaVoce(false);
  }

  function inserisciVoceCassa(formData) {
    let value = formData.get("value");
    let type = formData.get("type");
    let sign = formData.get("sign");
    if (sign == "-") value = value * -1;

    CassaApi.inserisciInCassa(id_anag, id_turno, value, type).then((response) => {
        setCassa(response);
        chiudiNuovaVoceCassa();
    });
  }

  function eliminaVoceCassa(id) {    
    CassaApi.eliminaVoceCassa(id, id_anag, id_turno).then((response) => {
        setCassa(response);
    });
  }

  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>    
    <div class="background_green">
      <h2>Cassa</h2>
      <h1>{cassa.cognome} {cassa.nome}</h1>
      <table>
        <thead>
          <tr>
            <td>data</td>
            <td>tipo</td>
            <td>valore</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          
        {cassa &&
          cassa?.inserimenti?.map((data) => {
            return (              
              <tr key={data.id}>
                <td>{data.insert_date}</td>
                <td>{data.type}</td>
                <td>{data.value}</td>
                <td><button onClick={() => eliminaVoceCassa(data.id)}>elimina voce</button></td>                
              </tr>
            );
          })}

        </tbody>
      </table>

      <hr></hr>

        { visualizzaNuovaVoce != true &&
          <button onClick={() => espandiNuovaVoceCassa()}>nuova voce cassa</button>
        }
        { visualizzaNuovaVoce == true &&
          <button onClick={() => chiudiNuovaVoceCassa()}>chiudi voce cassa</button>
        }

      <br></br>

       { visualizzaNuovaVoce == true &&
              <div>
                <h3>nuova voce cassa</h3>

                <form action={inserisciVoceCassa}>
                  <label for="value">valore</label>
                  <input name="value" />
                  <br></br>
                  <label for="type">tipo</label>
                  <select name="type" id="types">
                    <option value="">-</option>
                    <option value="BAR">BAR</option>
                    <option value="GITA">GITA</option>
                    <option value="STRUDEL">STRUDEL</option>
                    <option value="SPECK">SPECK</option>
                  </select>
                  <br></br>
                  <label for="sign">spesa o versamento</label>
                  <select name="sign" id="signs">
                    <option value="-">SPESA</option>
                    <option value="+">VERSAMENTO</option>
                  </select>
                  <br></br>
                  <button type="submit">salva voce cassa</button>
                </form>

              </div>
        }

        </div>
    </>
  );
}
