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
              </tr>
            );
          })}
          </tbody>
      </table>

        </div>
    </>
  );
}
