import React, { useEffect, useState } from "react";
import CassaApi from "../services/CassaApi";
import AnagraficaApi from "../services/AnagraficaApi";
import "../styles/main.css"

export default function RiepilogoCassa({id_turno, anagraficaSelezionata}) {
  const [riepilogoCassa, setRiepilogoCassa] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const recuperaRiepilogoCassa = () => {
      console.log("recuperaRiepilogoCassa");
      CassaApi.recuperaRiepilogoCassa(id_turno).then((response) => {
        setRiepilogoCassa(response);
        setIsLoading(false);
      });
    };

    if(id_turno) recuperaRiepilogoCassa();

  }, [id_turno]);


  const selezionaAnagrafica = (id_anag) => {
    console.log("anagrafica", id_anag);
    AnagraficaApi.recuperaAnagrafica(id_anag).then((response) => {
        anagraficaSelezionata(response);
    });    
  }

  function creaPdfCassa(cassaSelezionata) {
    CassaApi.creaPdfCassa(id_turno, cassaSelezionata.id_anag).then((response) => {
        var pdf_newTab = window.open("");
        if (pdf_newTab) {
          pdf_newTab.document.write(
              "<html><head><title>cassa</title></head><body><iframe title='cassa " + cassaSelezionata.cognome + "'  width='100%' height='100%' src='data:application/pdf;base64, " +    encodeURI(response) + "'></iframe></body></html>"
          );
        } else {
          console.error("Failed to open a new tab. Please check your browser's popup blocker settings.");
        }
      });
  }

  function invioMailCassa(cassaSelezionata) {
    CassaApi.invioMailCassa(id_turno, cassaSelezionata.id_anag).then((response) => {
        if (response.result == 1) {
          alert(response.returnMessages[0]);
        } else {
          console.error("response invio mail:", response);      
        }   
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
    <div class="background_pink">
      <h2>Riepilogo Cassa</h2>      
      <table class="simple_table">
        <thead>
          <tr>
            <th></th>
            <th>cognome</th>
            <th>nome</th>
            <th>tot. versato</th>
            <th>tot. spesa</th>
            <th>tot. in cassa</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        {riepilogoCassa &&
          riepilogoCassa?.map((data) => {
            return (
              <tr key={data.id_anag}>
                <td><button onClick={() => selezionaAnagrafica(data.id_anag)}>seleziona</button></td>
                <td>{data.cognome}</td>
                <td>{data.nome}</td>
                <td>{data.totale_versato}</td>
                <td>{data.totale_spesa}</td>
                <td>{data.totale_in_cassa}</td>
                <td><button onClick={() => creaPdfCassa(data)}>pdf</button></td>
                <td><button onClick={() => invioMailCassa(data)}>mail</button></td>
              </tr>
            );
          })}
          </tbody>
      </table>

        </div>
    </>
  );
}
